# order/views.py
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Count, Sum
from django.utils import timezone
from .models import Order, OrderItem, OrderTracking, OrderStatusHistory
from .serializers import OrderSerializer, OrderItemSerializer

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-order_date')
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('order_status', None)
        payment_status = self.request.query_params.get('payment_status', None)
        is_prescription = self.request.query_params.get('is_prescription_order', None)
        user_id = self.request.query_params.get('user_id', None)

        if status_filter:
            queryset = queryset.filter(order_status=status_filter)
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status)
        if is_prescription:
            queryset = queryset.filter(is_prescription_order=is_prescription.lower() == 'true')
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        return queryset

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get order statistics for admin dashboard"""
        total_orders = Order.objects.count()
        pending_orders = Order.objects.filter(order_status='Pending').count()
        processing_orders = Order.objects.filter(order_status='Processing').count()
        delivered_orders = Order.objects.filter(order_status='Delivered').count()
        prescription_orders = Order.objects.filter(is_prescription_order=True).count()

        total_revenue = Order.objects.filter(
            payment_status='Paid'
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0

        return Response({
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'processing_orders': processing_orders,
            'delivered_orders': delivered_orders,
            'prescription_orders': prescription_orders,
            'total_revenue': total_revenue,
        })

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update order status"""
        order = self.get_object()
        new_status = request.data.get('order_status')

        if new_status in dict(Order.ORDER_STATUS):
            order.order_status = new_status
            order.save()
            return Response({'message': 'Order status updated successfully'})

        return Response(
            {'error': 'Invalid order status'},
            status=status.HTTP_400_BAD_REQUEST
        )

class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        order_id = self.request.query_params.get('order_id', None)

        if order_id:
            queryset = queryset.filter(order_id=order_id)

        return queryset


# Order Tracking API Endpoints
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_order_tracking(request, order_id):
    """Get detailed tracking information for an order"""
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        tracking_updates = OrderTracking.objects.filter(order=order).order_by('-created_at')

        tracking_data = []
        for update in tracking_updates:
            tracking_data.append({
                'id': update.id,
                'status': update.status,
                'status_display': update.get_status_display(),
                'message': update.message,
                'location': update.location,
                'estimated_delivery': update.estimated_delivery,
                'actual_delivery': update.actual_delivery,
                'delivery_person_name': update.delivery_person_name,
                'delivery_person_phone': update.delivery_person_phone,
                'tracking_number': update.tracking_number,
                'notes': update.notes,
                'created_at': update.created_at,
            })

        return Response({
            'order_id': order.id,
            'order_status': order.order_status,
            'payment_status': order.payment_status,
            'tracking_updates': tracking_data,
            'current_status': tracking_data[0] if tracking_data else None,
        })

    except Order.DoesNotExist:
        return Response({
            'error': 'Order not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Failed to get tracking information: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_tracking_update(request, order_id):
    """Add a new tracking update for an order (Admin only)"""
    try:
        # Check if user is admin/staff
        if not request.user.is_staff:
            return Response({
                'error': 'Permission denied. Admin access required.'
            }, status=status.HTTP_403_FORBIDDEN)

        order = Order.objects.get(id=order_id)

        tracking_status = request.data.get('status')
        message = request.data.get('message', '')
        location = request.data.get('location', '')
        estimated_delivery = request.data.get('estimated_delivery')
        delivery_person_name = request.data.get('delivery_person_name', '')
        delivery_person_phone = request.data.get('delivery_person_phone', '')
        tracking_number = request.data.get('tracking_number', '')
        notes = request.data.get('notes', '')

        # Create tracking update
        tracking_update = OrderTracking.objects.create(
            order=order,
            status=tracking_status,
            message=message,
            location=location,
            delivery_person_name=delivery_person_name,
            delivery_person_phone=delivery_person_phone,
            tracking_number=tracking_number,
            notes=notes,
            updated_by=request.user
        )

        if estimated_delivery:
            tracking_update.estimated_delivery = estimated_delivery
            tracking_update.save()

        # Update order status if needed
        status_mapping = {
            'order_placed': 'Pending',
            'order_confirmed': 'Processing',
            'preparing': 'Processing',
            'packed': 'Processing',
            'out_for_delivery': 'Shipped',
            'delivered': 'Delivered',
            'cancelled': 'Cancelled',
        }

        if tracking_status in status_mapping:
            old_status = order.order_status
            new_status = status_mapping[tracking_status]

            if old_status != new_status:
                order.order_status = new_status
                order.save()

                # Record status history
                OrderStatusHistory.objects.create(
                    order=order,
                    old_status=old_status,
                    new_status=new_status,
                    changed_by=request.user,
                    reason=f'Updated via tracking: {message}'
                )

        return Response({
            'success': True,
            'message': 'Tracking update added successfully',
            'tracking_id': tracking_update.id
        })

    except Order.DoesNotExist:
        return Response({
            'error': 'Order not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Failed to add tracking update: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_order_status_history(request, order_id):
    """Get status change history for an order"""
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        status_history = OrderStatusHistory.objects.filter(order=order).order_by('-timestamp')

        history_data = []
        for history in status_history:
            history_data.append({
                'id': history.id,
                'old_status': history.old_status,
                'new_status': history.new_status,
                'changed_by': history.changed_by.username if history.changed_by else 'System',
                'reason': history.reason,
                'timestamp': history.timestamp,
            })

        return Response({
            'order_id': order.id,
            'status_history': history_data
        })

    except Order.DoesNotExist:
        return Response({
            'error': 'Order not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Failed to get status history: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def create_pending_order(request):
    """
    Create a pending order before prescription verification
    Payment happens first, then prescription upload and verification
    """
    try:
        import uuid
        from product.models import Product
        from usermanagement.models import Address

        items = request.data.get('items', [])
        delivery_address = request.data.get('delivery_address', {})
        payment_method = request.data.get('payment_method', 'COD')  # Match model choices
        total_amount = request.data.get('total_amount', 0)

        if not items:
            return Response({
                'error': 'No items provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Store delivery address in notes since Address model requires user
        delivery_info = ""
        if delivery_address:
            delivery_info = f"""
Customer: {delivery_address.get('name', 'Anonymous')}
Phone: {delivery_address.get('phone', 'Not provided')}
Address: {delivery_address.get('address', 'Not provided')}
"""

        # Get a default user for anonymous orders (use first user as fallback)
        from usermanagement.models import User
        default_user = User.objects.first()

        # Create pending order using existing model fields
        order = Order.objects.create(
            user=default_user,  # Use default user for anonymous orders
            address=None,  # No address object for anonymous orders
            order_status='Pending',  # Use existing status choices
            payment_status='Pending',  # Use existing status choices
            payment_method=payment_method.upper(),  # Ensure uppercase
            is_prescription_order=True,
            total_amount=total_amount,
            notes=f"Anonymous prescription order{delivery_info}",
        )

        # Add order items
        for item in items:
            try:
                product = Product.objects.get(id=item['product_id'])
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=item['quantity'],
                    unit_price_at_order=item.get('price', product.price),
                )
            except Product.DoesNotExist:
                # Skip invalid products
                continue

        # Generate a simple order number
        order_number = f"PO{order.id:06d}"

        return Response({
            'success': True,
            'order_id': order.id,
            'order_number': order_number,
            'status': order.order_status,
            'payment_method': payment_method,
            'total_amount': float(order.total_amount),
            'message': 'Pending order created successfully'
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({
            'error': f'Failed to create pending order: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def confirm_prescription_order(request, order_id):
    """
    Confirm prescription order after verification
    """
    try:
        order = Order.objects.get(id=order_id)

        # Update order status to processing (next step after pending)
        order.order_status = 'Processing'  # Use existing status choices
        order.payment_status = 'Paid'      # Use existing status choices
        order.save()

        # Generate order number if not exists
        order_number = f"PO{order.id:06d}"

        return Response({
            'success': True,
            'order_id': order.id,
            'order_number': order_number,
            'status': order.order_status,
            'message': 'Order confirmed successfully'
        })

    except Order.DoesNotExist:
        return Response({
            'error': 'Order not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Failed to confirm order: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
