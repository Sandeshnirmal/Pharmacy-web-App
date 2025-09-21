# order/views.py
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Count, Sum
from django.utils import timezone
from rest_framework_simplejwt.authentication import JWTAuthentication # Import JWTAuthentication
from django.db import transaction # New import
from product.models import Product # Moved import
from .models import Order, OrderItem, OrderTracking, OrderStatusHistory
from .serializers import OrderSerializer, OrderItemSerializer
import logging

logger = logging.getLogger(__name__)

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-order_date')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated] # Changed to IsAuthenticated
    authentication_classes = [JWTAuthentication] # Add JWTAuthentication

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
        # Filter by authenticated user
        if self.request.user.is_authenticated:
            queryset = queryset.filter(user=self.request.user)
        elif user_id: # Allow user_id filter only if not authenticated (e.g., for admin if needed, but generally not for regular users)
            queryset = queryset.filter(user_id=user_id)
        else:
            # If no user is authenticated and no user_id is provided, return empty queryset
            # This prevents accidental exposure of all orders if AllowAny was used
            return queryset.none()

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
    Create a paid order, optionally with prescription image, directly.
    This endpoint handles the complete order creation for paid orders,
    integrating prescription upload if provided.
    """
    from usermanagement.models import Address # Import Address model
    from .enhanced_order_flow import EnhancedOrderFlow # For validation utilities

    try:
        logger.info(f"create_paid_order_for_prescription Request - Raw Body: {request.body}")
        logger.info(f"create_paid_order_for_prescription Request - Parsed Data: {request.data}")

        # Extract and validate request data
        items_data = request.data.get('items', [])
        address_id = request.data.get('delivery_address', {}).get('id') # Get address ID from nested delivery_address
        payment_data = request.data.get('payment_data', {})
        payment_method = request.data.get('payment_method', 'RAZORPAY') # Get payment method from request
        notes = request.data.get('notes', '')

        prescription_image_base64 = request.data.get('prescription_image_base64')
        prescription_status_from_request = request.data.get('prescription_status')

        # Validate required fields
        if not items_data:
            logger.error("Items are required for create_paid_order_for_prescription.")
            return Response({
                'success': False,
                'error': 'Items are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not address_id:
            logger.error("Address ID is required for create_paid_order_for_prescription.")
            return Response({
                'success': False,
                'error': 'Address ID is required in delivery_address'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            selected_address = Address.objects.get(id=address_id, user=request.user)
        except Address.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Selected address not found or does not belong to the user.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Populate delivery_address_data from the selected_address for the Order model
        delivery_address_json = {
            "id": selected_address.id,
            "name": f"{request.user.first_name} {request.user.last_name}",
            "phone": request.user.phone_number,
            "address_line_1": selected_address.address_line1,
            "address_line_2": selected_address.address_line2,
            "city": selected_address.city,
            "state": selected_address.state,
            "pincode": selected_address.pincode,
            "country": "India"
        }

        if not payment_data:
            logger.error("Payment data is required for create_paid_order_for_prescription.")
            return Response({
                'success': False,
                'error': 'Payment data is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate order items and calculate total amount
        validated_items = []
        total_amount_calculated = 0.0
        is_prescription_order = False

        for item in items_data:
            product_id = item.get('product_id')
            quantity = item.get('quantity', 1)
            price_at_order = item.get('price') # Price from frontend, for consistency

            if not product_id or not quantity:
                return Response({
                    'success': False,
                    'error': 'Invalid item data: product_id and quantity are required.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                product = Product.objects.get(id=product_id, is_active=True)
                if product.stock_quantity < quantity:
                    raise ValueError(f"Insufficient stock for {product.name}")
                
                if product.requires_prescription:
                    is_prescription_order = True

                # Use product's current price if price_at_order is not provided or invalid
                unit_price = float(price_at_order) if price_at_order is not None else float(product.price)
                total_amount_calculated += unit_price * quantity

                validated_items.append({
                    'product': product,
                    'quantity': int(quantity),
                    'unit_price': unit_price,
                })
            except Product.DoesNotExist:
                logger.warning(f"Product with ID {product_id} not found or inactive for order creation.")
                return Response({
                    'success': False,
                    'error': f"Product with ID {product_id} not found or inactive."
                }, status=status.HTTP_400_BAD_REQUEST)
            except ValueError as e:
                return Response({
                    'success': False,
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)

        if total_amount_calculated <= 0:
            return Response({
                'success': False,
                'error': 'Order total must be greater than 0'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate shipping and discount (simplified for now, can use EnhancedOrderFlow methods)
        shipping_fee = 50.0 if total_amount_calculated < 500 else 0.0
        discount_amount = total_amount_calculated * 0.1 if total_amount_calculated > 1000 else 0.0
        final_amount = total_amount_calculated + shipping_fee - discount_amount

        # Determine initial prescription status
        actual_prescription_status = None
        if is_prescription_order and prescription_image_base64:
            actual_prescription_status = prescription_status_from_request if prescription_status_from_request else 'pending_review'
        elif is_prescription_order and not prescription_image_base64:
            # If prescription is required but not uploaded, set a specific status or return error
            return Response({
                'success': False,
                'error': 'Prescription required but not uploaded.'
            }, status=status.HTTP_400_BAD_REQUEST)
        # If not a prescription order, actual_prescription_status remains None, and default will apply

        with transaction.atomic():
            order = Order.objects.create(
                user=request.user,
                address=selected_address, # Link to Address model
                order_status='payment_completed',
                payment_status='Paid',
                payment_method=payment_method.upper(),
                total_amount=final_amount,
                discount_amount=discount_amount,
                shipping_fee=shipping_fee,
                is_prescription_order=is_prescription_order,
                prescription_image_base64=prescription_image_base64,
                prescription_status=actual_prescription_status, # Use the determined status
                notes=notes,
                delivery_address=delivery_address_json,
            )

            for item_data in validated_items:
                OrderItem.objects.create(
                    order=order,
                    product=item_data['product'],
                    quantity=item_data['quantity'],
                    unit_price_at_order=item_data['unit_price'],
                )
            
            OrderStatusHistory.objects.create(
                order=order,
                old_status='',
                new_status='payment_completed',
                changed_by=request.user,
                reason='Order created after successful payment with optional prescription'
            )
            
            logger.info(f"Paid order created successfully: {order.id} for user {request.user.id}")
            
            return Response({
                'success': True,
                'order_id': order.id,
                'order_number': f'ORD{order.id:06d}',
                'status': order.order_status,
                'total_amount': float(order.total_amount),
                'delivery_address': order.delivery_address,
                'is_prescription_order': order.is_prescription_order,
                'prescription_status': order.prescription_status,
                'message': 'Order created successfully.'
            }, status=status.HTTP_201_CREATED)
                
    except ValueError as e:
        logger.error(f"Validation error during create_paid_order_for_prescription: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.exception("An unexpected error occurred during paid order creation.")
        return Response({
            'success': False,
            'error': 'An error occurred while creating the order',
            'detail': str(e)
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
@permission_classes([IsAuthenticated]) # Require authentication
def create_pending_order(request):
    """
    Create a pending order before prescription verification
    Payment happens first, then prescription upload and verification
    """
    try:
        from product.models import Product

        items = request.data.get('items', [])
        delivery_address_data = request.data.get('delivery_address', {})
        payment_method = request.data.get('payment_method', 'COD')  # Match model choices
        total_amount = request.data.get('total_amount', 0)
        prescription_image_base64 = request.data.get('prescription_image')

        if not items:
            return Response({
                'error': 'No items provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create pending order using existing model fields
        order = Order.objects.create(
            user=request.user,  # Associate with the authenticated user
            address=None,  # Address will be stored in delivery_address JSON field
            order_status='Pending',  # Use existing status choices
            payment_status='Pending',  # Use existing status choices
            payment_method=payment_method.upper(),  # Ensure uppercase
            is_prescription_order=True,
            total_amount=total_amount,
            delivery_address=delivery_address_data, # Store delivery address as JSON
            prescription_image_base64=prescription_image_base64, # Store base64 image directly
            prescription_status='pending_review', # Always set to 'pending_review' for prescription orders
            notes="Prescription order pending payment/verification",
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
                # Log and skip invalid products, or return an error if strict
                logger.warning(f"Product with ID {item['product_id']} not found for order {order.id}")
                continue
            except Exception as e:
                logger.error(f"Error creating order item for product {item.get('product_id')}: {str(e)}")
                continue

        # Generate a simple order number
        order_number = f"ORD{order.id:06d}"

        return Response({
            'success': True,
            'order_id': order.id,
            'order_number': order_number,
            'status': order.order_status,
            'payment_method': payment_method,
            'total_amount': float(order.total_amount),
            'prescription_id': order.id, # Return order ID as prescription ID for consistency
            'message': 'Pending order created successfully'
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.exception("An unexpected error occurred during pending order creation.")
        return Response({
            'error': f'Failed to create pending order: {str(e)}',
            'detail': 'An unexpected server error occurred. Please try again later.'
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
