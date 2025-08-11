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


# ============================================================================
# ENHANCED ORDER FLOW API VIEWS
# Payment First → Prescription Upload → Verification → Confirmation → Courier
# ============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_paid_order_for_prescription(request):
    """
    Step 1: Create order after successful payment, before prescription verification

    This endpoint creates an order in 'payment_completed' status after successful payment.
    The order will wait for prescription upload and verification.

    Request Body:
    {
        "items": [
            {"product_id": 1, "quantity": 2},
            {"product_id": 2, "quantity": 1}
        ],
        "delivery_address": {
            "name": "John Doe",
            "phone": "+91-9876543210",
            "address_line_1": "123 Main Street",
            "address_line_2": "Apartment 4B",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001",
            "country": "India"
        },
        "payment_data": {
            "method": "RAZORPAY",
            "payment_id": "pay_xyz123",
            "amount": 500.00
        }
    }

    Response:
    {
        "success": true,
        "order_id": 123,
        "order_number": "ORD000123",
        "status": "payment_completed",
        "total_amount": 500.00,
        "message": "Order created successfully. Please upload prescription for verification."
    }
    """
    from .enhanced_order_flow import EnhancedOrderFlow

    try:
        # Extract and validate request data
        items = request.data.get('items', [])
        delivery_address = request.data.get('delivery_address', {})
        payment_data = request.data.get('payment_data', {})

        # Validate required fields
        if not items:
            return Response({
                'success': False,
                'error': 'Items are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not delivery_address:
            return Response({
                'success': False,
                'error': 'Delivery address is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not payment_data:
            return Response({
                'success': False,
                'error': 'Payment data is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create paid order
        result = EnhancedOrderFlow.create_paid_order_for_prescription_review(
            user=request.user,
            items=items,
            delivery_address=delivery_address,
            payment_data=payment_data
        )

        if result['success']:
            order = result['order']
            return Response({
                'success': True,
                'order_id': order.id,
                'order_number': f'ORD{order.id:06d}',
                'status': order.order_status,
                'total_amount': float(order.total_amount),
                'delivery_address': order.delivery_address,
                'message': result['message']
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'success': False,
                'error': result['error']
            }, status=status.HTTP_400_BAD_REQUEST)

    except ValueError as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error creating paid order: {str(e)}")
        return Response({
            'success': False,
            'error': 'An error occurred while creating the order'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def link_prescription_to_order(request, order_id):
    """
    Step 2: Link uploaded prescription to paid order
    """
    from .enhanced_order_flow import EnhancedOrderFlow

    try:
        prescription_id = request.data.get('prescription_id')

        if not prescription_id:
            return Response({
                'error': 'Prescription ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        result = EnhancedOrderFlow.link_prescription_to_paid_order(
            order_id=order_id,
            prescription_id=prescription_id,
            user=request.user
        )

        if result['success']:
            order = result['order']
            return Response({
                'success': True,
                'order_id': order.id,
                'status': order.order_status,
                'prescription_id': result['prescription'].id,
                'message': result['message']
            })
        else:
            return Response({
                'error': result['error']
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({
            'error': f'Failed to link prescription: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_prescription_and_confirm_order(request, order_id):
    """
    Step 3: Admin verifies prescription and confirms order
    """
    from .enhanced_order_flow import EnhancedOrderFlow

    try:
        # Check if user is admin/staff
        if not request.user.is_staff:
            return Response({
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        approved = request.data.get('approved', True)
        verification_notes = request.data.get('verification_notes', '')

        result = EnhancedOrderFlow.verify_prescription_and_confirm_order(
            order_id=order_id,
            admin_user=request.user,
            verification_notes=verification_notes,
            approved=approved
        )

        if result['success']:
            order = result['order']
            return Response({
                'success': True,
                'order_id': order.id,
                'status': order.order_status,
                'approved': result['approved'],
                'courier_scheduled': result.get('courier_scheduled', False),
                'tracking_number': getattr(order, 'tracking_number', ''),
                'message': result['message']
            })
        else:
            return Response({
                'error': result['error']
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({
            'error': f'Failed to verify prescription: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_orders_for_prescription_review(request):
    """
    Get orders waiting for prescription verification (Admin only)
    """
    try:
        if not request.user.is_staff:
            return Response({
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        from .enhanced_order_flow import EnhancedOrderFlow

        orders = EnhancedOrderFlow.get_orders_for_prescription_review()

        orders_data = []
        for order in orders:
            orders_data.append({
                'id': order.id,
                'order_number': f'ORD{order.id:06d}',
                'user': {
                    'id': order.user.id,
                    'username': order.user.username,
                    'email': order.user.email
                },
                'total_amount': float(order.total_amount),
                'status': order.order_status,
                'prescription': {
                    'id': order.prescription.id if order.prescription else None,
                    'upload_date': order.prescription.upload_date.isoformat() if order.prescription else None,
                    'image_url': order.prescription.image_url if order.prescription else None
                },
                'created_at': order.created_at.isoformat(),
                'delivery_address': order.delivery_address
            })

        return Response({
            'success': True,
            'orders': orders_data,
            'total_orders': len(orders_data)
        })

    except Exception as e:
        return Response({
            'error': f'Failed to fetch orders: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_paid_orders_awaiting_prescription(request):
    """
    Get orders that have been paid but are waiting for prescription upload
    """
    try:
        from .enhanced_order_flow import EnhancedOrderFlow

        if request.user.is_staff:
            # Admin can see all orders
            orders = EnhancedOrderFlow.get_paid_orders_awaiting_prescription()
        else:
            # Users can only see their own orders
            orders = EnhancedOrderFlow.get_paid_orders_awaiting_prescription().filter(user=request.user)

        orders_data = []
        for order in orders:
            orders_data.append({
                'id': order.id,
                'order_number': f'ORD{order.id:06d}',
                'total_amount': float(order.total_amount),
                'status': order.order_status,
                'payment_status': order.payment_status,
                'created_at': order.created_at.isoformat(),
                'delivery_address': order.delivery_address,
                'items_count': order.items.count()
            })

        return Response({
            'success': True,
            'orders': orders_data,
            'total_orders': len(orders_data)
        })

    except Exception as e:
        return Response({
            'error': f'Failed to fetch orders: {str(e)}'
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
