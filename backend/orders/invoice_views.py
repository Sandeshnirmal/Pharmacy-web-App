from django.shortcuts import get_object_or_404, render
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated,AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Order
from .invoice_service import Invoice, InvoiceService
import logging
from .views import OrderPagination # Import OrderPagination

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
    logger.info(f"Fetching invoices for user: {request.user.email}")
    logger.info(f"Available orders for user: {list(Order.objects.filter(user=request.user).values_list('id', flat=True))}")
    try:
        user_orders = Order.objects.filter(user=request.user)
        queryset = Invoice.objects.filter(order__in=user_orders).order_by('-created_at')
        
        paginator = OrderPagination()
        paginated_queryset = paginator.paginate_queryset(queryset, request)

        invoices_data = []
        for invoice in paginated_queryset:
            invoice_data = InvoiceService.get_invoice_data(invoice)
            invoices_data.append(invoice_data)
        
        return paginator.get_paginated_response(invoices_data)
        
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
        # Allow admin/staff to download any order's invoice
        if request.user.is_staff or request.user.is_superuser:
            order = get_object_or_404(Order, id=order_id)
        else:
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
        # Allow admin/staff to view any order's invoice
        if request.user.is_staff or request.user.is_superuser:
            order = get_object_or_404(Order, id=order_id)
        else:
            order = get_object_or_404(Order, id=order_id, user=request.user)
        
        if not hasattr(order, 'invoice'):
            # Create invoice if it doesn't exist
            invoice = InvoiceService.create_invoice_for_order(order)
        else:
            invoice = order.invoice
        
        invoice_data = InvoiceService.get_invoice_data(invoice) # Get full detailed invoice data
        
        return Response({
            'success': True,
            'invoice': invoice_data # Return full invoice data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching invoice summary: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to fetch invoice summary'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def view_invoice_html(request, order_id):
    """
    View invoice as HTML
    
    GET /api/order/orders/{order_id}/invoice/view/
    """
    try:
        logger.info(f"Attempting to fetch order {order_id}")
        logger.info(f"Authenticated user: {request.user.email}")
        
        # Get order for the current user directly
        try:
            # Allow admin/staff to view any order's invoice
            if request.user.is_staff or request.user.is_superuser:
                order = Order.objects.get(id=order_id)
            else:
                order = Order.objects.get(id=order_id, user=request.user)
            logger.info(f"Found order {order_id} for user {request.user.email}")
        except Order.DoesNotExist:
            logger.warning(f"Order {order_id} not found for user {request.user.email}")
            return Response({
                'success': False,
                'error': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)
            
        logger.info(f"Successfully retrieved order {order_id} for user {request.user.email}")
        
        if not hasattr(order, 'invoice'):
            logger.info(f"Creating new invoice for order {order_id}")
            invoice = InvoiceService.create_invoice_for_order(order)
        else:
            invoice = order.invoice
            logger.info(f"Using existing invoice {invoice.invoice_number}")
        
        invoice_data = InvoiceService.get_invoice_data(invoice)
        logger.debug(f"Generated invoice data for order {order_id}")
        
        # Check if client accepts HTML
        accept_header = request.headers.get('Accept', '*/*')
        logger.debug(f"Accept header: {accept_header}")
        
        if 'text/html' in accept_header:
            try:
                # Render HTML
                from django.template.loader import render_to_string
                from django.template import TemplateDoesNotExist
                
                context = {
                    'invoice': invoice_data,
                    'order': order,
                    'user': {
                        'email': request.user.email,
                        'full_name': f"{getattr(request.user, 'first_name', '')} {getattr(request.user, 'last_name', '')}".strip() or request.user.email,
                    }
                }
                
                # Try rendering test template first
                try:
                    html_content = render_to_string('invoices/invoice_test.html', context)
                    logger.info(f"Successfully rendered test template for order {order_id}")
                    return HttpResponse(html_content, content_type='text/html')
                except TemplateDoesNotExist as e:
                    logger.error(f"Test template not found: {str(e)}")
                    return Response({
                        'success': False,
                        'error': f'Template not found: {str(e)}'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                        
            except Exception as template_error:
                logger.error(f"Template rendering error: {str(template_error)}", exc_info=True)
                return Response({
                    'success': False,
                    'error': f'Failed to render invoice template: {str(template_error)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # Return JSON data if HTML is not accepted
            logger.info(f"Returning JSON response for order {order_id} (HTML not accepted)")
            return Response({
                'success': True,
                'invoice': invoice_data
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        logger.error(f"Error viewing invoice HTML: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': f'Failed to view invoice: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
