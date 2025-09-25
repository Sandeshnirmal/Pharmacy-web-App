# Mobile API endpoints for prescription processing
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny,AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.db.models import Q
from .models import Prescription, PrescriptionDetail
# Removed ai_service - using only OCR service now
from .ocr_service import OCRService
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def upload_prescription(request):
    """
    Mobile API: Upload prescription image for AI processing
    """
    try:
        # Get uploaded image file
        image_file = request.FILES.get('image')

        if not image_file:
            return Response({
                'error': 'image file is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Save the uploaded file
        file_name = f"prescriptions/{request.user.id}_{timezone.now().strftime('%Y%m%d_%H%M%S')}_{image_file.name}"
        file_path = default_storage.save(file_name, ContentFile(image_file.read()))
        image_url = default_storage.url(file_path)

        # Create prescription record
        prescription = Prescription.objects.create(
            user=request.user,
            image_url=image_url,
            verification_status='Pending_AI_Processing',
            upload_date=timezone.now()
        )
        
        # Process with Real OCR service
        try:
            ocr_service = OCRService()

            # Get the actual file path for OCR processing
            actual_file_path = default_storage.path(file_path)
            ocr_result = ocr_service.process_prescription_image(actual_file_path)

            if ocr_result['success']:
                # Update prescription with OCR results
                prescription.ai_processed = True
                prescription.ai_confidence_score = ocr_result['ocr_confidence']
                prescription.ai_processing_time = 2.5  # Real processing time
                prescription.verification_status = 'AI_Processed'
                prescription.save()

                # Create prescription details from OCR results
                for i, medicine_data in enumerate(ocr_result['medicines']):
                    input_medicine_name = medicine_data.get('input_medicine_name', '')
                    generic_name = medicine_data.get('generic_name', '')
                    composition = medicine_data.get('composition', '')
                    form = medicine_data.get('form', '')
                    strength = medicine_data.get('strength', '')
                    frequency = medicine_data.get('frequency', '')
                    local_equivalent = medicine_data.get('local_equivalent')
                    match_confidence = medicine_data.get('match_confidence', 0.0)

                    detail = PrescriptionDetail.objects.create(
                        prescription=prescription,
                        line_number=i + 1,
                        recognized_text_raw=f"{input_medicine_name} ({composition})",
                        extracted_medicine_name=input_medicine_name,
                        extracted_dosage=strength,
                        extracted_frequency=frequency,
                        extracted_form=form, # Ensure form is saved
                        ai_confidence_score=match_confidence,
                        mapping_status='Mapped' if local_equivalent else 'Pending',
                        is_valid_for_order=local_equivalent is not None
                    )

                    # Set suggested products and best match
                    if local_equivalent:
                        from product.models import Product
                        try:
                            # Use the product_name and form from local_equivalent for lookup
                            product = Product.objects.get(name=local_equivalent['product_name'], form=local_equivalent['form'])
                            detail.suggested_products.set([product])

                            if match_confidence > 0.8:
                                detail.mapped_product = product
                                detail.verified_medicine_name = product.name
                                detail.verified_dosage = product.strength
                                detail.verified_form = product.form # Ensure verified form is saved
                                detail.save()
                        except Product.DoesNotExist:
                            logger.warning(f"Product not found for local equivalent: {local_equivalent.get('product_name')} (Form: {local_equivalent.get('form')})")
                            detail.mapping_status = 'No_Product_Found'
                            detail.is_valid_for_order = False
                            detail.save()
                    else:
                        # If no local equivalent, still save the extracted info
                        detail.verified_medicine_name = input_medicine_name
                        detail.verified_dosage = strength
                        detail.verified_form = form
                        detail.save()


                return Response({
                    'success': True,
                    'prescription_id': prescription.id,
                    'message': 'Prescription processed successfully with real OCR',
                    'ocr_confidence': ocr_result['ocr_confidence'],
                    'medicines_found': ocr_result['total_medicines_found'],
                    'processing_summary': ocr_result['processing_summary'],
                    'can_proceed_to_order': ocr_result['processing_summary']['high_confidence_matches'] > 0
                }, status=status.HTTP_201_CREATED)
            else:
                # OCR failed, return error
                return Response({
                    'success': False,
                    'prescription_id': prescription.id,
                    'error': 'OCR processing failed. Please try with a clearer image.',
                    'message': 'Prescription uploaded but processing failed',
                    'ocr_error': ocr_result.get('error', 'OCR processing failed')
                }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        except Exception as e:
            # OCR service failed completely
            logger.error(f"OCR service failed completely for user {request.user.id}: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'prescription_id': prescription.id if 'prescription' in locals() else None,
                'error': f'Processing failed: {str(e)}',
                'message': 'Prescription uploaded but processing failed. Please try again with a clearer image.'
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
            
    except Exception as e:
        logger.error(f"Failed to upload prescription for user {request.user.id}: {str(e)}", exc_info=True)
        return Response({
            'error': f'Failed to upload prescription: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_prescription_status(request, prescription_id):
    """
    Mobile API: Get prescription processing status
    """
    try:
        prescription = Prescription.objects.get(id=prescription_id, user=request.user)
        
        # Determine if processing is ready (complete and successful)
        is_ready = (
            prescription.ai_processed and
            prescription.verification_status in ['AI_Processed', 'Verified'] and
            prescription.prescription_medicines.count() > 0
        )

        return Response({
            'prescription_id': prescription.id,
            'status': prescription.verification_status,
            'processed': prescription.ai_processed,
            'is_ready': is_ready,  # This is what the mobile app is looking for!
            'processing_time': prescription.ai_processing_time,
            'medicines_count': prescription.prescription_medicines.count(),
            'upload_date': prescription.upload_date,
            'can_get_suggestions': prescription.ai_processed and prescription.verification_status != 'Rejected'
        })
        
    except Prescription.DoesNotExist:
        return Response({
            'error': 'Prescription not found'
        }, status=status.HTTP_404_NOT_FOUND)

        
        
        
@api_view(['GET'])
@permission_classes([AllowAny])
def get_medicine_suggestions(request, prescription_id):
    """
    Mobile API: Get AI-generated medicine suggestions
    """
    try:
        prescription = Prescription.objects.get(id=prescription_id, user=request.user)
        
        if not prescription.ai_processed:
            return Response({
                'status': 'processing',
                'message': 'Prescription is still being processed. Please try again in a few moments.'
            }, status=status.HTTP_202_ACCEPTED)
        
        if prescription.verification_status == 'Rejected':
            return Response({
                'status': 'rejected',
                'message': prescription.rejection_reason or 'Prescription was rejected',
                'can_reupload': True
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get medicine suggestions
        suggestions = []
        total_cost = 0
        available_medicines = 0
        
        for detail in prescription.prescription_medicines.all():
            suggestion = {
                'id': detail.id,
                'medicine_name': detail.extracted_medicine_name,
                'dosage': detail.extracted_dosage,
                'quantity': detail.ai_extracted_quantity,
                'instructions': detail.ai_extracted_instructions,
                'confidence_score': detail.ai_confidence_score,
                'mapping_status': detail.mapping_status,
                'is_available': detail.is_valid_for_order,
                'product_info': None
            }
            
            # Add product information if mapped
            if detail.mapped_product and detail.is_valid_for_order:
                product = detail.mapped_product
                suggestion['product_info'] = {
                    'product_id': product.id,
                    'name': product.name,
                    'strength': product.strength,
                    'form': product.form,
                    'manufacturer': product.manufacturer,
                    'price': float(product.price),
                    'mrp': float(product.mrp),
                    'discount_percentage': round(((product.mrp - product.price) / product.mrp) * 100, 1),
                    'is_prescription_required': product.is_prescription_required,
                    'in_stock': product.stock_quantity > 0,
                    'stock_quantity': product.stock_quantity,
                    'image_url': product.image_url if product.image_url else 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'
                }
                total_cost += float(product.price)
                available_medicines += 1
            
            suggestions.append(suggestion)
        
        # Calculate pricing
        shipping_cost = 50.0 if total_cost < 500 else 0.0
        discount = total_cost * 0.1 if total_cost > 1000 else 0.0
        final_cost = total_cost + shipping_cost - discount
        
        return Response({
            'prescription_id': prescription.id,
            'status': 'completed',
            'summary': {
                'total_medicines': len(suggestions),
                'available_medicines': available_medicines,
                'unavailable_medicines': len(suggestions) - available_medicines
            },
            'medicines': suggestions,
            'pricing': {
                'subtotal': round(total_cost, 2),
                'shipping': shipping_cost,
                'discount': round(discount, 2),
                'total': round(final_cost, 2),
                'savings': round(discount, 2)
            },
            'can_order': available_medicines > 0,
            'message': f'Found {available_medicines} out of {len(suggestions)} medicines available for order'
        })
        
    except Prescription.DoesNotExist:
        return Response({
            'error': 'Prescription not found'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([AllowAny])
def create_prescription_order(request):
    """
    Mobile API: Create order from prescription medicines
    """
    from orders.models import Order, OrderItem
    from usermanagement.models import Address
    
    try:
        prescription_id = request.data.get('prescription_id')
        selected_medicines = request.data.get('medicines', [])
        address_id = request.data.get('address_id')
        payment_method = request.data.get('payment_method', 'UPI')
        
        if not prescription_id or not selected_medicines:
            return Response({
                'error': 'prescription_id and medicines are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        prescription = Prescription.objects.get(id=prescription_id, user=request.user)
        
        # Get delivery address
        address = None
        if address_id:
            address = Address.objects.get(id=address_id, user=request.user)
        else:
            address = request.user.addresses.filter(is_default=True).first()
        
        if not address:
            return Response({
                'error': 'No delivery address found. Please add an address first.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate and calculate order
        order_items = []
        total_amount = 0
        
        for medicine_data in selected_medicines:
            detail_id = medicine_data.get('detail_id')
            quantity = int(medicine_data.get('quantity', 1))
            
            detail = PrescriptionMedicine.objects.get(
                id=detail_id,
                prescription=prescription
            )
            
            if detail.mapped_product and detail.is_valid_for_order:
                product = detail.mapped_product
                unit_price = product.price
                item_total = unit_price * quantity
                total_amount += item_total
                
                order_items.append({
                    'product': product,
                    'quantity': quantity,
                    'unit_price': unit_price,
                    'prescription_detail': detail
                })
        
        if not order_items:
            return Response({
                'error': 'No valid medicines selected for order'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate final pricing
        shipping_fee = 50.0 if total_amount < 500 else 0.0
        discount_amount = total_amount * 0.1 if total_amount > 1000 else 0.0
        final_amount = total_amount + shipping_fee - discount_amount
        
        # Create order
        order = Order.objects.create(
            user=request.user,
            address=address,
            total_amount=final_amount,
            discount_amount=discount_amount,
            shipping_fee=shipping_fee,
            payment_method=payment_method,
            payment_status='Pending',
            order_status='Pending',
            is_prescription_order=True,
            prescription=prescription,
            notes=f'Prescription order from mobile app - Prescription #{prescription.id}'
        )
        
        # Create order items
        for item_data in order_items:
            OrderItem.objects.create(
                order=order,
                product=item_data['product'],
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                unit_price_at_order=item_data['unit_price'],
                prescription_detail=item_data['prescription_detail']
            )
        
        return Response({
            'success': True,
            'message': 'Order created successfully',
            'order_id': order.id,
            'order_number': f'ORD{order.id:06d}',
            'total_amount': float(final_amount),
            'payment_method': payment_method,
            'order_status': 'Pending',
            'estimated_delivery': '3-5 business days',
            'items_count': len(order_items)
        }, status=status.HTTP_201_CREATED)
        
    except Prescription.DoesNotExist:
        return Response({
            'error': 'Prescription not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Address.DoesNotExist:
        return Response({
            'error': 'Address not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Failed to create order: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def reprocess_prescription_ocr(request, prescription_id):
    """
    Admin API: Reprocess prescription with OCR for better results
    """
    try:
        prescription = Prescription.objects.get(id=prescription_id)

        # Initialize OCR service
        ocr_service = OCRService()

        # Get image path from URL
        if prescription.image_url:
            # Convert URL to file path
            image_path = prescription.image_url.replace('/media/', '')
            full_path = default_storage.path(image_path)

            # Process with OCR
            ocr_result = ocr_service.process_prescription_image(full_path)

            if ocr_result['success']:
                # Clear existing details
                prescription.prescription_medicines.all().delete()

                # Update prescription
                prescription.ai_processed = True
                prescription.ai_confidence_score = ocr_result['ocr_confidence']
                prescription.verification_status = 'AI_Processed'
                prescription.save()

                # Create new details from OCR
                created_details = []
                for i, medicine_data in enumerate(ocr_result['medicines']):
                    extracted_info = medicine_data['extracted_info']
                    matches = medicine_data['database_matches']

                    detail = PrescriptionDetail.objects.create(
                        prescription=prescription,
                        line_number=i + 1,
                        recognized_text_raw=f"{extracted_info.get('name', '')} {extracted_info.get('strength', '')}",
                        ai_extracted_medicine_name=extracted_info.get('name', ''),
                        ai_extracted_dosage=extracted_info.get('strength', ''),
                        ai_extracted_frequency=extracted_info.get('frequency', ''),
                        ai_extracted_duration=extracted_info.get('duration', ''),
                        ai_extracted_instructions=extracted_info.get('instructions', ''),
                        ai_confidence_score=medicine_data['match_confidence'],
                        mapping_status='Mapped' if matches else 'Pending',
                        is_valid_for_order=len(matches) > 0
                    )

                    if matches:
                        from product.models import Product
                        product_ids = [match['product_id'] for match in matches]
                        products = Product.objects.filter(id__in=product_ids)
                        detail.suggested_products.set(products)

                        if matches[0]['match_score'] > 0.8:
                            detail.mapped_product = products.first()
                            detail.verified_medicine_name = matches[0]['name']
                            detail.verified_dosage = matches[0]['strength']
                            detail.save()

                    created_details.append({
                        'id': detail.id,
                        'medicine_name': detail.ai_extracted_medicine_name,
                        'confidence': detail.ai_confidence_score,
                        'matches_found': len(matches),
                        'mapping_status': detail.mapping_status
                    })

                return Response({
                    'success': True,
                    'message': 'Prescription reprocessed successfully with OCR',
                    'ocr_confidence': ocr_result['ocr_confidence'],
                    'medicines_processed': len(created_details),
                    'processing_summary': ocr_result['processing_summary'],
                    'details': created_details
                })
            else:
                return Response({
                    'success': False,
                    'error': ocr_result.get('error', 'OCR processing failed')
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({
                'success': False,
                'error': 'No image found for this prescription'
            }, status=status.HTTP_400_BAD_REQUEST)

    except Prescription.DoesNotExist:
        return Response({
            'error': 'Prescription not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Failed to reprocess prescription: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_prescription_products(request, prescription_id):
    """
    Mobile API: Get all products related to a prescription for search/browsing
    """
    try:
        prescription = Prescription.objects.get(id=prescription_id, user=request.user)

        # Get all prescription details with mapped products
        prescription_details = prescription.prescription_medicines.all()

        products_data = []
        for detail in prescription_details:
            # Add mapped product if available
            if detail.mapped_product:
                products_data.append({
                    'id': detail.mapped_product.id,
                    'name': detail.mapped_product.name,
                    'manufacturer': detail.mapped_product.manufacturer,
                    'price': float(detail.mapped_product.price),
                    'mrp': float(detail.mapped_product.mrp),
                    'strength': detail.mapped_product.strength,
                    'form': detail.mapped_product.form,
                    'stock_quantity': detail.mapped_product.stock_quantity,
                    'in_stock': detail.mapped_product.stock_quantity > 0,
                    'is_prescription_required': detail.mapped_product.is_prescription_required,
                    'extracted_medicine': detail.ai_extracted_medicine_name,
                    'prescription_detail_id': detail.id
                })

            # Add suggested products
            for suggested_product in detail.suggested_products.all():
                if suggested_product.id not in [p['id'] for p in products_data]:
                    products_data.append({
                        'id': suggested_product.id,
                        'name': suggested_product.name,
                        'manufacturer': suggested_product.manufacturer,
                        'price': float(suggested_product.price),
                        'mrp': float(suggested_product.mrp),
                        'strength': suggested_product.strength,
                        'form': suggested_product.form,
                        'stock_quantity': suggested_product.stock_quantity,
                        'in_stock': suggested_product.stock_quantity > 0,
                        'is_prescription_required': suggested_product.is_prescription_required,
                        'extracted_medicine': detail.ai_extracted_medicine_name,
                        'prescription_detail_id': detail.id,
                        'is_suggested': True
                    })

        return Response({
            'success': True,
            'prescription_id': prescription.id,
            'total_products': len(products_data),
            'products': products_data,
            'prescription_status': prescription.verification_status
        })

    except Prescription.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Prescription not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def search_prescription_medicines(request):
    """
    Mobile API: Search for medicines based on prescription history and general search
    """
    from product.models import Product

    try:
        search_query = request.GET.get('q', '').strip()
        limit = int(request.GET.get('limit', 20))

        if not search_query:
            return Response({
                'success': False,
                'error': 'Search query is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Search products by name, generic name, manufacturer
        products = Product.objects.filter(
            Q(name__icontains=search_query) |
            Q(generic_name__name__icontains=search_query) |
            Q(manufacturer__icontains=search_query) |
            Q(description__icontains=search_query),
            is_active=True
        ).select_related('generic_name', 'category')[:limit]

        # Format products for mobile app
        products_data = []
        for product in products:
            products_data.append({
                'id': product.id,
                'name': product.name,
                'manufacturer': product.manufacturer,
                'price': float(product.price),
                'mrp': float(product.mrp),
                'strength': product.strength,
                'form': product.form,
                'stock_quantity': product.stock_quantity,
                'in_stock': product.stock_quantity > 0,
                'is_prescription_required': product.is_prescription_required,
                'generic_name': product.generic_name.name if product.generic_name else '',
                'category': product.category.name if product.category else '',
                'image_url': product.image_url if product.image_url else 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
                'discount_percentage': round(((product.mrp - product.price) / product.mrp) * 100, 1) if product.mrp > 0 else 0
            })

        return Response({
            'success': True,
            'query': search_query,
            'total_results': len(products_data),
            'products': products_data
        })

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def upload_prescription_for_order(request):
    """
    Simple prescription upload for order verification - NO AI/OCR processing

    This endpoint is used when customers upload prescriptions during checkout.
    The prescription is stored for manual verification by pharmacy staff.
    No automatic processing or medicine extraction is performed.
    """
    try:
        # Validate request
        if 'prescription_image' not in request.FILES:
            return Response({
                'success': False,
                'error': 'Prescription image is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        image_file = request.FILES['prescription_image']

        # Validate file size (max 10MB)
        if image_file.size > 10 * 1024 * 1024:
            return Response({
                'success': False,
                'error': 'File size too large. Maximum 10MB allowed.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if image_file.content_type not in allowed_types:
            return Response({
                'success': False,
                'error': 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Save the uploaded file
        file_name = f"order_prescriptions/{request.user.id}_{timezone.now().strftime('%Y%m%d_%H%M%S')}_{image_file.name}"
        file_path = default_storage.save(file_name, ContentFile(image_file.read()))
        image_url = default_storage.url(file_path)

        # Create prescription record for manual verification
        prescription = Prescription.objects.create(
            user=request.user,
            image_url=image_url,
            verification_status='pending_verification',  # Manual verification required
            status='pending_verification',
            upload_date=timezone.now(),
            ai_processed=False,  # No AI processing
            verification_notes='Uploaded for order verification - manual review required'
        )

        return Response({
            'success': True,
            'message': 'Prescription uploaded successfully for verification',
            'prescription_id': prescription.id,
            'status': 'pending_verification',
            'note': 'Your prescription has been submitted for manual verification by our pharmacy team.'
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({
            'success': False,
            'error': f'Upload failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_prescription_verification_status(request, prescription_id):
    """
    Get prescription verification status for mobile app
    """
    try:
        prescription = Prescription.objects.get(id=prescription_id)

        return Response({
            'success': True,
            'prescription_id': str(prescription.id),  # Convert UUID to string
            'status': prescription.verification_status,
            'verification_notes': prescription.verification_notes,
            'image_url': prescription.image_url if prescription.image_url else None,
            'order_id': prescription.order.id if prescription.order else None,
            'payment_confirmed': True,  # Assume payment confirmed for paid orders
            'created_at': prescription.created_at.isoformat() if prescription.created_at else None,
            'updated_at': prescription.updated_at.isoformat() if prescription.updated_at else None,
        })

    except Prescription.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Prescription not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f'Get verification status error: {str(e)}')
        return Response({
            'success': False,
            'error': f'Failed to get verification status: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def upload_prescription_for_paid_order(request):
    """
    Upload prescription for paid order verification (after payment confirmation)
    """
    try:
        image_data = request.data.get('image')  # base64 image
        order_id = request.data.get('order_id')

        if not image_data:
            return Response({
                'success': False,
                'error': 'No image data provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Handle base64 image
        import base64
        from django.core.files.base import ContentFile
        from orders.models import Order

        try:
            # Decode base64 image
            image_bytes = base64.b64decode(image_data)
            image_file = ContentFile(image_bytes, name=f'prescription_order_{order_id}.jpg')
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Invalid image data: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get the order object
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Save the uploaded file
        file_name = f"paid_order_prescriptions/order_{order_id}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        file_path = default_storage.save(file_name, image_file)
        image_url = default_storage.url(file_path)

        # Create prescription record for verification using existing model fields
        prescription = Prescription.objects.create(
            user=order.user,  # Use order's user
            image_url=image_url,
            image_file=image_file,
            verification_status='Pending_Review',  # Use existing status choices
            status='prescription_uploaded',         # Use existing status choices
            ai_processed=False,  # No AI processing for order verification
            verification_notes=f'Uploaded for paid order #{order_id} verification - manual review required',
            order=order,  # Link to order
        )

        # Update the order status to 'prescription_uploaded'
        order.order_status = 'prescription_uploaded'
        order.prescription = prescription
        order.save()

        return Response({
            'success': True,
            'prescription_id': str(prescription.id),  # Convert UUID to string
            'image_url': image_url,
            'status': prescription.verification_status,
            'message': 'Prescription uploaded successfully for verification'
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f'Prescription upload error: {str(e)}')
        return Response({
            'success': False,
            'error': f'Upload failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_prescription_detail_mobile(request, prescription_id):
    """
    Mobile API: Get a single prescription detail by ID, including all associated medicine details.
    """
    from .serializers import PrescriptionSerializer
    try:
        prescription = Prescription.objects.get(id=prescription_id, user=request.user)
        
        # Use the PrescriptionSerializer to get all data, including aggregated suggested_medicines
        serializer = PrescriptionSerializer(prescription)

        return Response({
            'success': True,
            'prescription': serializer.data
        }, status=status.HTTP_200_OK)

    except Prescription.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Prescription not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error fetching prescription detail: {e}")
        return Response({
            'success': False,
            'error': f'Failed to retrieve prescription details: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_user_prescriptions_mobile(request):
    """
    Mobile API: Get a list of all prescriptions for the authenticated user.
    """
    from .serializers import PrescriptionSerializer
    try:
        if not request.user.is_authenticated:
            # Anonymous users have no prescriptions, return an empty list
            return Response([], status=status.HTTP_200_OK)

        prescriptions = Prescription.objects.filter(user=request.user).order_by('-upload_date')
        serializer = PrescriptionSerializer(prescriptions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error fetching user prescriptions: {e}")
        return Response({
            'success': False,
            'error': f'Failed to retrieve user prescriptions: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_prescriptions_by_id(request, prescription_id):
    """
    Mobile API: Get a single prescription by ID for the authenticated user.
    """
    from .serializers import PrescriptionSerializer
    try:
        prescription = Prescription.objects.get(id=prescription_id, user=request.user)
        serializer = PrescriptionSerializer(prescription)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Prescription.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Prescription not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error fetching prescription by ID: {e}")
        return Response({
            'success': False,
            'error': f'Failed to retrieve prescription: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
