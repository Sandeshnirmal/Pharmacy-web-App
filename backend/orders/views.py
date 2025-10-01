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
    # permission_classes = [IsAuthenticated] # Changed to IsAuthenticated
    # authentication_classes = [JWTAuthentication] # Add JWTAuthentication

    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('order_status', None)
        payment_status = self.request.query_params.get('payment_status', None)
        is_prescription = self.request.query_params.get('is_prescription_order', None)
        user_id = self.request.query_params.get('user_id', None)

        # if status_filter:
        #     queryset = queryset.filter(order_status=status_filter)
        # if payment_status:
        #     queryset = queryset.filter(payment_status=payment_status)
        # if is_prescription:
        #     queryset = queryset.filter(is_prescription_order=is_prescription.lower() == 'true')
        # # Filter by authenticated user
        # if self.request.user.is_authenticated:
        #     queryset = queryset.filter(user=self.request.user)
        # elif user_id: # Allow user_id filter only if not authenticated (e.g., for admin if needed, but generally not for regular users)
        #     queryset = queryset.filter(user_id=user_id)
        # else:
        #     # If no user is authenticated and no user_id is provided, return empty queryset
        #     # This prevents accidental exposure of all orders if AllowAny was used
        #     return queryset.none()

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

        # Initialize variables at the beginning to avoid UnboundLocalError
        is_prescription_order = False
        prescription_image_to_set = None
        prescription_status_to_set = None

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
        
        # Determine if it's a prescription order based on items_data
        for item in items_data:
            product_id = item.get('product_id')
            try:
                product = Product.objects.get(id=product_id, is_active=True)
                if product.is_prescription_required:
                    is_prescription_order = True
                    break # Found a prescription item, no need to check further
            except Product.DoesNotExist:
                # Handle this error later in item validation, for now just determine prescription status
                pass

        # Determine initial prescription status and image data if it's a prescription order
        if is_prescription_order:
            if prescription_image_base64:
                prescription_image_to_set = prescription_image_base64
                prescription_status_to_set = prescription_status_from_request if prescription_status_from_request else 'pending_review'
            else:
                # If prescription is required but not uploaded, return error
                logger.error("Prescription required but not uploaded for a prescription order.")
                return Response({
                    'success': False,
                    'error': 'Prescription required but not uploaded.'
                }, status=status.HTTP_400_BAD_REQUEST)
        # If not a prescription order, prescription_status_to_set and prescription_image_to_set remain None,
        # allowing the model's defaults/nullability to apply.

        # Explicitly capture the state of variables derived from the request
        # to avoid potential UnboundLocalError in nested blocks.
        _is_prescription_order_from_request = is_prescription_order
        _prescription_image_to_set_from_request = prescription_image_to_set
        _prescription_status_to_set_from_request = prescription_status_to_set

        # Check if an existing order_id is provided to update an existing pending or aborted order
        existing_order_id = request.data.get('order_id')
        order = None
        if existing_order_id:
            try:
                order = Order.objects.get(id=existing_order_id, user=request.user)

                # If the order is already paid and completed, just return it (or update prescription if needed)
                if order.payment_status == 'Paid' and order.order_status == 'payment_completed':
                    logger.info(f"Existing order {existing_order_id} for user {request.user.id} is already paid and completed. Returning it.")
                    # Potentially update prescription details if they are sent again
                    if _is_prescription_order_from_request: # Use the explicitly bound variable
                        order.prescription_image_base64 = _prescription_image_to_set_from_request
                        order.prescription_status = _prescription_status_to_set_from_request
                        order.save() # Save only if prescription details were updated
                    
                    return Response({
                        'success': True,
                        'order_id': order.id,
                        'order_number': f'ORD{order.id:06d}',
                        'status': order.order_status,
                        'total_amount': float(order.total_amount),
                        'delivery_address': order.delivery_address,
                        'is_prescription_order': order.is_prescription_order,
                        'prescription_status': order.prescription_status,
                        'message': 'Order already paid and finalized.'
                    }, status=status.HTTP_200_OK)
                
                # If the order is pending or aborted, proceed to update it to paid
                elif order.order_status in ['Pending', 'Aborted'] and order.payment_status == 'Pending':
                    logger.info(f"Found existing order {existing_order_id} for user {request.user.id} with status {order.order_status}. Proceeding to update it to paid.")
                else:
                    # This case means an order exists but is in an unexpected state (e.g., 'Cancelled', 'Processing' but not 'Paid')
                    logger.warning(f"Existing order {existing_order_id} for user {request.user.id} is in an unexpected state ({order.order_status}/{order.payment_status}). Creating a new order.")
                    order = None # Force creation of a new order
            except Order.DoesNotExist:
                logger.warning(f"Existing order {existing_order_id} not found for user {request.user.id}. Creating a new order.")
                order = None # Ensure order is None if not found

        # Validate order items and calculate total amount
        validated_items = []
        total_amount_calculated = 0.0
        # is_prescription_order is already determined above

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
                
                # is_prescription_order is already determined above
                # if product.is_prescription_required:
                #     is_prescription_order = True

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

        # Determine initial prescription status and image data
        # prescription_status_to_set and prescription_image_to_set are already determined above

        # if is_prescription_order:
        #     if prescription_image_base64:
        #         prescription_image_to_set = prescription_image_base64
        #         prescription_status_to_set = prescription_status_from_request if prescription_status_from_request else 'pending_review'
        #     else:
        #         # If prescription is required but not uploaded, return error
        #         logger.error("Prescription required but not uploaded for a prescription order.")
        #         return Response({
        #             'success': False,
        #             'error': 'Prescription required but not uploaded.'
        #         }, status=status.HTTP_400_BAD_REQUEST)
        # If not a prescription order, prescription_status_to_set and prescription_image_to_set remain None,
        # allowing the model's defaults/nullability to apply.

        with transaction.atomic():
            if order:
                # Update existing order
                order.address = selected_address
                order.order_status = 'payment_completed'
                order.payment_status = 'Paid'
                order.payment_method = payment_method.upper()
                order.total_amount = final_amount
                order.discount_amount = discount_amount
                order.shipping_fee = shipping_fee
                order.is_prescription_order = _is_prescription_order_from_request # Use the explicitly bound variable
                order.notes = notes
                order.delivery_address = delivery_address_json

                # Only set prescription fields if it's a prescription order
                if _is_prescription_order_from_request: # Use the explicitly bound variable
                    order.prescription_image_base64 = _prescription_image_to_set_from_request
                    order.prescription_status = _prescription_status_to_set_from_request
                else:
                    # If it's no longer a prescription order, clear these fields
                    order.prescription_image_base64 = None
                    order.prescription_status = 'pending_review' # Reset to default or a non-prescription specific status

                # Determine old status for history
                old_status_for_history = order.order_status
                
                # Update existing order
                order.address = selected_address
                order.order_status = 'payment_completed'
                order.payment_status = 'Paid'
                order.payment_method = payment_method.upper()
                order.total_amount = final_amount
                order.discount_amount = discount_amount
                order.shipping_fee = shipping_fee
                order.is_prescription_order = _is_prescription_order_from_request # Use the explicitly bound variable
                order.notes = notes
                order.delivery_address = delivery_address_json

                # Only set prescription fields if it's a prescription order
                if _is_prescription_order_from_request: # Use the explicitly bound variable
                    order.prescription_image_base64 = _prescription_image_to_set_from_request
                    order.prescription_status = _prescription_status_to_set_from_request
                else:
                    # If it's no longer a prescription order, clear these fields
                    order.prescription_image_base64 = None
                    order.prescription_status = 'verified' # Reset to default or a non-prescription specific status

                order.save()

                # Clear existing order items and add new ones
                order.items.all().delete()
                for item_data in validated_items:
                    OrderItem.objects.create(
                        order=order,
                        product=item_data['product'],
                        quantity=item_data['quantity'],
                        unit_price_at_order=item_data['unit_price'],
                    )
                
                OrderStatusHistory.objects.create(
                    order=order,
                    old_status=old_status_for_history,
                    new_status='payment_completed',
                    changed_by=request.user,
                    reason='Existing order updated after successful payment with optional prescription'
                )
                logger.info(f"Existing order {order.id} updated successfully for user {request.user.id}")

            else:
                # Create new order
                order_kwargs = {
                    'user': request.user,
                    'address': selected_address, # Link to Address model
                    'order_status': 'payment_completed',
                    'payment_status': 'Paid',
                    'payment_method': payment_method.upper(),
                    'total_amount': final_amount,
                    'discount_amount': discount_amount,
                    'shipping_fee': shipping_fee,
                    'is_prescription_order': _is_prescription_order_from_request, # Use the explicitly bound variable
                    'notes': notes,
                    'delivery_address': delivery_address_json,
                }

                # Only add prescription fields to kwargs if it's a prescription order
                if _is_prescription_order_from_request: # Use the explicitly bound variable
                    order_kwargs['prescription_image_base64'] = _prescription_image_to_set_from_request
                    order_kwargs['prescription_status'] = _prescription_status_to_set_from_request
                # If not a prescription order, these fields are omitted, and model defaults apply.

                order = Order.objects.create(**order_kwargs)

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
                logger.info(f"New paid order created successfully: {order.id} for user {request.user.id}")
            
            return Response({
                'success': True,
                'order_id': order.id,
                'order_number': f'ORD{order.id:06d}',
                'status': order.order_status,
                'total_amount': float(order.total_amount),
                'delivery_address': order.delivery_address,
                'is_prescription_order': order.is_prescription_order,
                'prescription_status': order.prescription_status,
                'message': 'Order created/updated successfully.'
            }, status=status.HTTP_201_CREATED)
                
    except ValueError as e:
        logger.error(f"Validation error during create_paid_order_for_prescription: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.exception("An unexpected error occurred during paid order creation/update.")
        return Response({
            'success': False,
            'error': 'An error occurred while creating/updating the order',
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
                'changed_by': history.changed_by.email if history.changed_by else 'System', # Changed to .email
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
        logger.exception(f"An unexpected error occurred while getting order status history for order {order_id}.")
        return Response({
            'error': f'Failed to get status history: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_pending_order(request):
    """
    Get the most recent pending order for the authenticated user.
    This is used by the frontend to check if a payment attempt is a retry for an existing order.
    """
    try:
        order = Order.objects.filter(
            user=request.user,
            order_status='Pending',
            payment_status='Pending'
        ).order_by('-created_at').first()

        if order:
            return Response({
                'success': True,
                'order_id': order.id,
                'order_number': f'ORD{order.id:06d}',
                'total_amount': float(order.total_amount),
                'message': 'Found existing pending order.'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': 'No pending order found for the user.'
            }, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        logger.exception("Error fetching user's pending order.")
        return Response({
            'success': False,
            'error': f'Failed to fetch pending order: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated]) # Require authentication
def create_pending_order(request):
    """
    Create a pending order before prescription verification, or re-use/abort existing one.
    Payment happens first, then prescription upload and verification.
    """
    try:
        from product.models import Product
        from django.forms.models import model_to_dict # For comparing order items

        logger.info(f"create_pending_order Request - Raw Body: {request.body}")
        logger.info(f"create_pending_order Request - Parsed Data: {request.data}")

        items_data = request.data.get('items', [])
        delivery_address_data = request.data.get('delivery_address', {})
        payment_method = request.data.get('payment_method', '')  # Match model choices
        total_amount = request.data.get('total_amount', 0)
        prescription_image_base64 = request.data.get('prescription_image')
        notes = request.data.get('notes', '')

        if not items_data:
            logger.error("create_pending_order: No items provided in request.")
            return Response({
                'success': False,
                'error': 'No items provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        # --- Check for existing pending order ---
        existing_pending_order = Order.objects.filter(
            user=request.user,
            order_status='Pending',
            payment_status='Pending'
        ).order_by('-created_at').first()

        if existing_pending_order:
            # Compare items of the existing pending order with the new cart items
            existing_order_items = sorted([
                {'product_id': item.product.id, 'quantity': item.quantity}
                for item in existing_pending_order.items.all()
            ], key=lambda x: x['product_id'])

            current_cart_items = sorted([
                {'product_id': int(item['product_id']), 'quantity': int(item['quantity'])}
                for item in items_data
            ], key=lambda x: x['product_id'])

            # Ensure product_id and quantity are integers for existing_order_items as well
            existing_order_items_cleaned = sorted([
                {'product_id': int(item.product.id), 'quantity': int(item.quantity)}
                for item in existing_pending_order.items.all()
            ], key=lambda x: x['product_id'])

            logger.debug(f"Existing order items (cleaned): {existing_order_items_cleaned}")
            logger.debug(f"Current cart items (from request): {current_cart_items}")

            if existing_order_items_cleaned == current_cart_items:
                # Cart items are the same, re-use the existing pending order
                logger.info(f"Re-using existing pending order {existing_pending_order.id} for user {request.user.id} as cart items are unchanged.")
                return Response({
                    'success': True,
                    'order_id': existing_pending_order.id,
                    'order_number': f"ORD{existing_pending_order.id:06d}",
                    'status': existing_pending_order.order_status,
                    'payment_method': existing_pending_order.payment_method,
                    'total_amount': float(existing_pending_order.total_amount),
                    'prescription_id': existing_pending_order.id,
                    'message': 'Re-using existing pending order as cart items are unchanged.'
                }, status=status.HTTP_200_OK)
            else:
                # Cart items are different, abort the old order
                with transaction.atomic():
                    existing_pending_order.order_status = 'Aborted'
                    existing_pending_order.payment_status = 'Aborted'
                    existing_pending_order.notes = 'Order aborted due to cart modification before payment completion.'
                    existing_pending_order.save()
                    OrderStatusHistory.objects.create(
                        order=existing_pending_order,
                        old_status='Pending',
                        new_status='Aborted',
                        changed_by=request.user,
                        reason='Cart modified, previous pending order aborted.'
                    )
                    logger.info(f"Existing pending order {existing_pending_order.id} aborted for user {request.user.id} due to cart change.")
        
        # --- Create new pending order (if no existing or if existing was aborted) ---
        with transaction.atomic():
            order = Order.objects.create(
                user=request.user,  # Associate with the authenticated user
                address=None,  # Address will be stored in delivery_address JSON field
                order_status='Pending',  # Use existing status choices
                payment_status='Pending',  # Use existing status choices
                payment_method=payment_method.upper(),  # Ensure uppercase
                is_prescription_order=True, # Assuming all pending orders might be prescription related initially
                total_amount=total_amount,
                delivery_address=delivery_address_data, # Store delivery address as JSON
                prescription_image_base64=prescription_image_base64, # Store base64 image directly
                prescription_status='pending_review', # Always set to 'pending_review' for prescription orders
                notes=notes,
            )

            # Add order items
            for item in items_data:
                product_id = item.get('product_id')
                quantity = item.get('quantity')
                price = item.get('price')

                if not product_id or not quantity:
                    logger.error(f"create_pending_order: Invalid item data - product_id or quantity missing for item: {item}")
                    return Response({
                        'success': False,
                        'error': 'Invalid item data: product_id and quantity are required for all items.'
                    }, status=status.HTTP_400_BAD_REQUEST)

                try:
                    product = Product.objects.get(id=product_id)
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=quantity,
                        unit_price_at_order=price if price is not None else product.price,
                    )
                    logger.debug(f"OrderItem created for product {product_id} (Order {order.id})")
                except Product.DoesNotExist:
                    logger.error(f"create_pending_order: Product with ID {product_id} not found for order {order.id}.")
                    return Response({
                        'success': False,
                        'error': f"Product with ID {product_id} not found."
                    }, status=status.HTTP_400_BAD_REQUEST)
                except Exception as e:
                    logger.exception(f"create_pending_order: Error creating order item for product {product_id} (Order {order.id}).")
                    return Response({
                        'success': False,
                        'error': f"Error processing item {product_id}: {str(e)}"
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Generate a simple order number
            order_number = f"ORD{order.id:06d}"

            OrderStatusHistory.objects.create(
                order=order,
                old_status='',
                new_status='Pending',
                changed_by=request.user,
                reason='New pending order created.'
            )

            logger.info(f"New pending order created successfully: {order.id} for user {request.user.id}")

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
        logger.exception("An unexpected error occurred during pending order creation/management.")
        return Response({
            'error': f'Failed to create/manage pending order: {str(e)}',
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
