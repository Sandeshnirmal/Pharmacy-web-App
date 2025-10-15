from django.db import models, transaction
from django.utils import timezone
from django.conf import settings
from decimal import Decimal
import uuid
from .models import Order
from django.contrib.auth import get_user_model
from company_details.models import CompanyDetails # Import CompanyDetails model
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.lib import colors
import io

User = get_user_model()

class Invoice(models.Model):
    """Invoice model for order billing"""
    
    INVOICE_STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Invoice identification
    invoice_number = models.CharField(max_length=50, unique=True)
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='invoice')
    
    # Invoice details
    invoice_date = models.DateTimeField(default=timezone.now)
    due_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=INVOICE_STATUS_CHOICES, default='draft')
    
    # Financial details
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Payment details
    payment_method = models.CharField(max_length=50, default='RAZORPAY')
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True)
    payment_date = models.DateTimeField(blank=True, null=True)
    
    # Additional details
    notes = models.TextField(blank=True)
    terms_and_conditions = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'invoices'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.order.user.username}"
    
    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = self.generate_invoice_number()
        super().save(*args, **kwargs)
    
    def generate_invoice_number(self):
        """Generate unique invoice number"""
        today = timezone.now()
        prefix = f"INV{today.strftime('%Y%m%d')}"
        
        # Get the last invoice number for today
        last_invoice = Invoice.objects.filter(
            invoice_number__startswith=prefix
        ).order_by('-invoice_number').first()
        
        if last_invoice:
            # Extract the sequence number and increment
            last_seq = int(last_invoice.invoice_number[-4:])
            new_seq = last_seq + 1
        else:
            new_seq = 1
        
        return f"{prefix}{new_seq:04d}"


class InvoiceItem(models.Model):
    """Invoice line items"""
    
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    product_name = models.CharField(max_length=200)
    product_description = models.TextField(blank=True)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Tax details
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'invoice_items'
    
    def __str__(self):
        return f"{self.product_name} x {self.quantity}"
    
    def save(self, *args, **kwargs):
        # Calculate tax amount
        self.tax_amount = (self.total_price * self.tax_rate) / 100
        super().save(*args, **kwargs)


class InvoiceService:
    """Service for managing invoices"""
    
    @staticmethod
    def create_invoice_for_order(order: Order) -> Invoice:
        """Create invoice for an order"""
        try:
            with transaction.atomic():
                # Calculate invoice amounts
                subtotal = sum(item.unit_price_at_order * item.quantity for item in order.items.all())
                tax_rate = Decimal('18.0')  # 18% GST
                tax_amount = (subtotal * tax_rate) / 100
                shipping_fee = order.shipping_fee or Decimal('0')
                discount_amount = order.discount_amount or Decimal('0')
                total_amount = subtotal + tax_amount + shipping_fee - discount_amount
                
                # Create invoice
                invoice = Invoice.objects.create(
                    order=order,
                    due_date=timezone.now() + timezone.timedelta(days=30),
                    subtotal=subtotal,
                    tax_amount=tax_amount,
                    discount_amount=discount_amount,
                    shipping_fee=shipping_fee,
                    total_amount=total_amount,
                    payment_method=order.payment_method,
                    status='draft',
                    terms_and_conditions=InvoiceService.get_default_terms()
                )
                
                # Create invoice items
                for order_item in order.items.all(): # Corrected to use order.items
                    InvoiceItem.objects.create(
                        invoice=invoice,
                        product_name=order_item.product.name,
                        product_description=f"{order_item.product.manufacturer} - {order_item.product.category}",
                        quantity=order_item.quantity,
                        unit_price=order_item.unit_price_at_order,
                        total_price=order_item.unit_price_at_order * order_item.quantity,
                        tax_rate=Decimal('18.0')
                    )
                
                return invoice
                
        except Exception as e:
            raise Exception(f"Failed to create invoice: {str(e)}")
    
    @staticmethod
    def mark_invoice_as_paid(invoice: Invoice, payment_data: dict) -> Invoice:
        """Mark invoice as paid"""
        try:
            with transaction.atomic():
                invoice.status = 'paid'
                invoice.payment_date = timezone.now()
                invoice.razorpay_payment_id = payment_data.get('razorpay_payment_id')
                invoice.razorpay_order_id = payment_data.get('razorpay_order_id')
                invoice.save()
                
                # Update order payment status
                invoice.order.payment_status = 'Paid'
                invoice.order.save()
                
                return invoice
                
        except Exception as e:
            raise Exception(f"Failed to mark invoice as paid: {str(e)}")
    
    @staticmethod
    def get_invoice_data(invoice: Invoice) -> dict:
        """Get formatted invoice data"""
        return {
            'invoice_number': invoice.invoice_number,
            'invoice_date': invoice.invoice_date.isoformat(),
            'due_date': invoice.due_date.isoformat(),
            'status': invoice.status,
            'order': {
                'order_number': f'ORD{invoice.order.id:06d}',
                'order_date': invoice.order.created_at.isoformat(),
            },
            'customer': {
                'name': invoice.order.user.get_full_name() or invoice.order.user.username,
                'email': invoice.order.user.email,
                'phone': invoice.order.delivery_address.get('phone', ''),
                'address': invoice.order.delivery_address,
            },
            'items': [
                {
                    'name': item.product_name,
                    'description': item.product_description,
                    'quantity': item.quantity,
                    'unit_price': float(item.unit_price),
                    'total_price': float(item.total_price),
                    'tax_rate': float(item.tax_rate),
                    'tax_amount': float(item.tax_amount),
                }
                for item in invoice.items.all()
            ],
            'financial': {
                'subtotal': float(invoice.subtotal),
                'tax_amount': float(invoice.tax_amount),
                'discount_amount': float(invoice.discount_amount),
                'shipping_fee': float(invoice.shipping_fee),
                'total_amount': float(invoice.total_amount),
            },
            'payment': {
                'method': invoice.payment_method,
                'razorpay_payment_id': invoice.razorpay_payment_id,
                'razorpay_order_id': invoice.razorpay_order_id,
                'payment_date': invoice.payment_date.isoformat() if invoice.payment_date else None,
            },
            'notes': invoice.notes,
            'terms_and_conditions': invoice.terms_and_conditions,
        }
    
    @staticmethod
    def get_default_terms() -> str:
        """Get default terms and conditions"""
        return """
Terms and Conditions:
1. Payment is due within 30 days of invoice date.
2. All medicines are subject to availability and expiry date verification.
3. Prescription medicines require valid prescription for delivery.
4. Returns are accepted within 7 days for unopened medicines.
5. GST is included in the total amount.
6. For any queries, contact customer support.
        """.strip()
    
    @staticmethod
    def generate_invoice_pdf(invoice: Invoice) -> bytes:
        """Generate PDF invoice"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        
        story = []
        company_details = CompanyDetails.objects.first()

        # Header Table (Logo, Company Info, Invoice Title, Invoice Details)
        header_data = [
            [
                Paragraph(f'<b>Infixmart Logo</b><br/><b>Infixmart</b><br/>123 Health St, Wellness City, 12345', styles['Normal']),
                Paragraph(f'<h1>INVOICE</h1>Invoice #: {invoice.invoice_number}<br/>Invoice Date: {invoice.invoice_date.strftime("%d %b %Y")}<br/>Payment Date: {"N/A" if not invoice.payment_date else invoice.payment_date.strftime("%d %b %Y")}', styles['Normal'])
            ]
        ]
        header_table = Table(header_data, colWidths=[4 * inch, 3 * inch])
        header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 20),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 0.2 * inch))

        # Bill To Section
        bill_to_data = [
            [Paragraph('<b>Bill To:</b>', styles['Normal']), ''],
            [Paragraph(f'{invoice.order.user.get_full_name() or invoice.order.user.email}', styles['Normal']), ''],
            [Paragraph(f'{invoice.order.user.email}', styles['Normal']), ''],
            [Paragraph(f'{invoice.order.user.phone_number or "N/A"}', styles['Normal']), ''],
        ]
        bill_to_table = Table(bill_to_data, colWidths=[3 * inch, 4 * inch])
        bill_to_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))
        story.append(bill_to_table)
        story.append(Spacer(1, 0.2 * inch))

        # Items Table
        item_table_data = [['Description', 'Qty', 'Unit Price', 'Total']]
        for item in invoice.items.all():
            item_table_data.append([
                Paragraph(f'<b>{item.product_name}</b><br/><small>{item.product_description}</small>', styles['Normal']),
                str(item.quantity),
                f'₹{item.unit_price:.2f}',
                f'₹{item.total_price:.2f}'
            ])
        
        item_table_style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#EEEEEE')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#EEEEEE')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#EEEEEE')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ])
        
        item_col_widths = [3.5 * inch, 0.7 * inch, 1.4 * inch, 1.4 * inch]
        items_table = Table(item_table_data, colWidths=item_col_widths)
        items_table.setStyle(item_table_style)
        story.append(items_table)
        story.append(Spacer(1, 0.2 * inch))

        # Financial Summary
        summary_data = [
            ['', 'Subtotal:', f'₹{invoice.subtotal:.2f}'],
            ['', 'Tax:', f'₹{invoice.tax_amount:.2f}'],
            ['', 'Discount:', f'-₹{invoice.discount_amount:.2f}'],
            ['', '<b>Total Amount:</b>', f'<b>₹{invoice.total_amount:.2f}</b>'],
        ]
        summary_table = Table(summary_data, colWidths=[4.6 * inch, 1.2 * inch, 1.2 * inch])
        summary_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (1, -1), (1, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, -1), (2, -1), 'Helvetica-Bold'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LINEBELOW', (1, -2), (2, -2), 1, colors.HexColor('#EEEEEE')), # Line above Total Amount
            ('LINEBELOW', (1, -1), (2, -1), 2, colors.black), # Double line below Total Amount
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 0.2 * inch))

        # Terms and Conditions
        story.append(Paragraph("<b>Terms & Conditions:</b>", styles['Normal']))
        terms_list = invoice.terms_and_conditions.strip().split('\n')
        for i, term in enumerate(terms_list):
            if term.strip():
                story.append(Paragraph(f'{i+1}. {term.strip()}', styles['Normal']))
        story.append(Spacer(1, 0.5 * inch))

        # Footer
        story.append(Paragraph("Thank you for your business.", styles['Normal']))
        story.append(Paragraph("This is a computer-generated invoice.", styles['Normal']))
        story.append(Spacer(1, 0.5 * inch))

        # Signature
        story.append(Paragraph("Authorised Signature", styles['Normal']))
        story.append(Spacer(1, 0.2 * inch))

        try:
            doc.build(story)
        except Exception as e:
            logger.error(f"Error building PDF document: {str(e)}")
            raise # Re-raise to be caught by the view's exception handler

        buffer.seek(0)
        return buffer.getvalue()
