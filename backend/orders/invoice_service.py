from django.db import models, transaction
from django.utils import timezone
from django.conf import settings
from decimal import Decimal
import uuid
from .models import Order
from django.contrib.auth import get_user_model
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
                subtotal = sum(item.unit_price * item.quantity for item in order.items.all())
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
                for order_item in order.items.all():
                    InvoiceItem.objects.create(
                        invoice=invoice,
                        product_name=order_item.product.name,
                        product_description=f"{order_item.product.manufacturer} - {order_item.product.category}",
                        quantity=order_item.quantity,
                        unit_price=order_item.unit_price,
                        total_price=order_item.unit_price * order_item.quantity,
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

        # Header
        story.append(Paragraph("<b>INVOICE</b>", styles['h1']))
        story.append(Spacer(1, 0.2 * inch))

        # Invoice Details
        story.append(Paragraph(f"<b>Invoice Number:</b> {invoice.invoice_number}", styles['Normal']))
        story.append(Paragraph(f"<b>Invoice Date:</b> {invoice.invoice_date.strftime('%Y-%m-%d')}", styles['Normal']))
        story.append(Paragraph(f"<b>Due Date:</b> {invoice.due_date.strftime('%Y-%m-%d')}", styles['Normal']))
        story.append(Paragraph(f"<b>Status:</b> {invoice.status.capitalize()}", styles['Normal']))
        story.append(Spacer(1, 0.2 * inch))

        # Customer Details
        story.append(Paragraph("<b>Bill To:</b>", styles['h3']))
        story.append(Paragraph(f"<b>Name:</b> {invoice.order.user.get_full_name() or invoice.order.user.username}", styles['Normal']))
        story.append(Paragraph(f"<b>Email:</b> {invoice.order.user.email}", styles['Normal']))
        if invoice.order.delivery_address:
            story.append(Paragraph(f"<b>Address:</b> {invoice.order.delivery_address.get('address_line1', '')}, {invoice.order.delivery_address.get('city', '')}, {invoice.order.delivery_address.get('state', '')} - {invoice.order.delivery_address.get('pincode', '')}", styles['Normal']))
            story.append(Paragraph(f"<b>Phone:</b> {invoice.order.delivery_address.get('phone', '')}", styles['Normal']))
        story.append(Spacer(1, 0.2 * inch))

        # Items Table
        data = [['Product', 'Description', 'Quantity', 'Unit Price', 'Total Price', 'Tax Rate', 'Tax Amount']]
        for item in invoice.items.all():
            data.append([
                item.product_name,
                item.product_description,
                str(item.quantity),
                f"₹{item.unit_price:.2f}",
                f"₹{item.total_price:.2f}",
                f"{item.tax_rate:.2f}%",
                f"₹{item.tax_amount:.2f}"
            ])
        
        table_style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BOX', (0, 0), (-1, -1), 1, colors.black),
        ])
        
        col_widths = [1.5*inch, 2*inch, 0.7*inch, 1*inch, 1*inch, 0.8*inch, 1*inch]
        item_table = Table(data, colWidths=col_widths)
        item_table.setStyle(table_style)
        story.append(item_table)
        story.append(Spacer(1, 0.2 * inch))

        # Financial Summary
        story.append(Paragraph(f"<b>Subtotal:</b> ₹{invoice.subtotal:.2f}", styles['Normal']))
        story.append(Paragraph(f"<b>Tax Amount:</b> ₹{invoice.tax_amount:.2f}", styles['Normal']))
        story.append(Paragraph(f"<b>Shipping Fee:</b> ₹{invoice.shipping_fee:.2f}", styles['Normal']))
        story.append(Paragraph(f"<b>Discount Amount:</b> ₹{invoice.discount_amount:.2f}", styles['Normal']))
        story.append(Paragraph(f"<b>Total Amount:</b> ₹{invoice.total_amount:.2f}", styles['h2']))
        story.append(Spacer(1, 0.2 * inch))

        # Payment Details
        story.append(Paragraph("<b>Payment Details:</b>", styles['h3']))
        story.append(Paragraph(f"<b>Method:</b> {invoice.payment_method}", styles['Normal']))
        if invoice.payment_date:
            story.append(Paragraph(f"<b>Payment Date:</b> {invoice.payment_date.strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
        if invoice.razorpay_payment_id:
            story.append(Paragraph(f"<b>Razorpay Payment ID:</b> {invoice.razorpay_payment_id}", styles['Normal']))
        story.append(Spacer(1, 0.2 * inch))

        # Terms and Conditions
        story.append(Paragraph("<b>Terms and Conditions:</b>", styles['h3']))
        for line in invoice.terms_and_conditions.split('\n'):
            if line.strip():
                story.append(Paragraph(line.strip(), styles['Normal']))
        story.append(Spacer(1, 0.2 * inch))

        try:
            doc.build(story)
        except Exception as e:
            logger.error(f"Error building PDF document: {str(e)}")
            raise # Re-raise to be caught by the view's exception handler

        buffer.seek(0)
        return buffer.getvalue()
