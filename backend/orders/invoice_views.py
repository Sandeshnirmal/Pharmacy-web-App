from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Order
from .invoice_service import Invoice, InvoiceService
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_invoice_for_order(request, order_id):
    """
    Create invoice for an order
    
    POST /api/order/invoices/create/{order_id}/
    """
    try:
        order = get_object_or_404(Order, id=order_id, user=request.user)
        
        # Check if invoice already exists
        if hasattr(order, 'invoice'):
            return Response({
                'success': False,
                'error': 'Invoice already exists for this order'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create invoice
        invoice = InvoiceService.create_invoice_for_order(order)
        invoice_data = InvoiceService.get_invoice_data(invoice)
        
        return Response({
            'success': True,
            'invoice': invoice_data,
            'message': 'Invoice created successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error creating invoice: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to create invoice'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_invoice_for_order(request, order_id):
    """
    Get invoice for an order
    
    GET /api/order/invoices/{order_id}/
    """
    try:
        order = get_object_or_404(Order, id=order_id, user=request.user)
        
        if not hasattr(order, 'invoice'):
            return Response({
                'success': False,
                'error': 'No invoice found for this order'
            }, status=status.HTTP_404_NOT_FOUND)
        
        invoice_data = InvoiceService.get_invoice_data(order.invoice)
        
        return Response({
            'success': True,
            'invoice': invoice_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching invoice: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to fetch invoice'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_invoice_as_paid(request, order_id):
    """
    Mark invoice as paid after successful payment
    
    POST /api/order/invoices/{order_id}/mark-paid/
    
    Request Body:
    {
        "razorpay_payment_id": "pay_xyz123",
        "razorpay_order_id": "order_abc456",
        "razorpay_signature": "signature_hash"
    }
    """
    try:
        order = get_object_or_404(Order, id=order_id, user=request.user)
        
        if not hasattr(order, 'invoice'):
            return Response({
                'success': False,
                'error': 'No invoice found for this order'
            }, status=status.HTTP_404_NOT_FOUND)
        
        payment_data = {
            'razorpay_payment_id': request.data.get('razorpay_payment_id'),
            'razorpay_order_id': request.data.get('razorpay_order_id'),
            'razorpay_signature': request.data.get('razorpay_signature'),
        }
        
        # Validate payment data
        if not all([payment_data['razorpay_payment_id'], payment_data['razorpay_order_id']]):
            return Response({
                'success': False,
                'error': 'Payment ID and Order ID are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark invoice as paid
        invoice = InvoiceService.mark_invoice_as_paid(order.invoice, payment_data)
        invoice_data = InvoiceService.get_invoice_data(invoice)
        
        return Response({
            'success': True,
            'invoice': invoice_data,
            'message': 'Invoice marked as paid successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error marking invoice as paid: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to mark invoice as paid'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_invoices(request):
    """
    Get all invoices for the authenticated user
    
    GET /api/order/invoices/my-invoices/
    """
    try:
        user_orders = Order.objects.filter(user=request.user)
        invoices = Invoice.objects.filter(order__in=user_orders).order_by('-created_at')
        
        invoices_data = []
        for invoice in invoices:
            invoice_data = InvoiceService.get_invoice_data(invoice)
            invoices_data.append(invoice_data)
        
        return Response({
            'success': True,
            'invoices': invoices_data,
            'total_invoices': len(invoices_data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching user invoices: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to fetch invoices'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_invoice_pdf(request, order_id):
    """
    Download invoice as PDF
    
    GET /api/order/invoices/{order_id}/download/
    """
    try:
        order = get_object_or_404(Order, id=order_id, user=request.user)
        
        if not hasattr(order, 'invoice'):
            return Response({
                'success': False,
                'error': 'No invoice found for this order'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Generate PDF (placeholder implementation)
        pdf_content = InvoiceService.generate_invoice_pdf(order.invoice)
        
        response = HttpResponse(pdf_content, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice_{order.invoice.invoice_number}.pdf"'
        
        return response
        
    except Exception as e:
        logger.error(f"Error downloading invoice PDF: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to download invoice'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_invoice_summary(request, order_id):
    """
    Get invoice summary for display
    
    GET /api/order/invoices/{order_id}/summary/
    """
    try:
        order = get_object_or_404(Order, id=order_id, user=request.user)
        
        if not hasattr(order, 'invoice'):
            # Create invoice if it doesn't exist
            invoice = InvoiceService.create_invoice_for_order(order)
        else:
            invoice = order.invoice
        
        summary = {
            'invoice_number': invoice.invoice_number,
            'status': invoice.status,
            'total_amount': float(invoice.total_amount),
            'payment_method': invoice.payment_method,
            'invoice_date': invoice.invoice_date.isoformat(),
            'due_date': invoice.due_date.isoformat(),
            'payment_date': invoice.payment_date.isoformat() if invoice.payment_date else None,
            'order_number': f'ORD{order.id:06d}',
            'items_count': invoice.items.count(),
        }
        
        return Response({
            'success': True,
            'summary': summary
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching invoice summary: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to fetch invoice summary'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
