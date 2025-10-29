from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Order, OrderStatusHistory, OrderTracking
from usermanagement.models import User # Assuming User model is in usermanagement app

@receiver(post_save, sender=Order)
def create_order_status_history_and_tracking(sender, instance, created, **kwargs):
    if created:
        # For a newly created order, create the initial status history entry
        OrderStatusHistory.objects.create(
            order=instance,
            old_status='', # No old status for a new order
            new_status=instance.order_status,
            reason='Order created'
        )
        # Also create an initial OrderTracking entry
        OrderTracking.objects.create(
            order=instance,
            status='order_placed', # Initial tracking status
            message='Your order has been placed successfully.',
            location='Processing Center' # Default initial location
        )
    else:
        # For an existing order, check if the status has changed
        try:
            old_order_status = Order.objects.get(pk=instance.pk).order_status
        except Order.DoesNotExist:
            return # Should not happen for an existing instance

        if old_order_status != instance.order_status:
            # Create a new status history entry
            OrderStatusHistory.objects.create(
                order=instance,
                old_status=old_order_status,
                new_status=instance.order_status,
                reason=f'Order status changed from {old_order_status} to {instance.order_status}'
            )
            # Update or create OrderTracking entry based on the new order_status
            # This logic can be expanded to map specific order_status to tracking_status
            tracking_status_map = {
                'Pending': 'order_placed',
                'payment_completed': 'payment_confirmed',
                'prescription_uploaded': 'order_placed', # Prescription uploaded, but still 'order_placed' from tracking perspective
                'verified': 'prescription_verified',
                'prescription_rejected': 'cancelled', # Or a specific 'prescription_rejected' tracking status
                'Processing': 'preparing',
                'Shipped': 'out_for_delivery',
                'Delivered': 'delivered',
                'Cancelled': 'cancelled',
                'Aborted': 'cancelled', # Or a specific 'aborted' tracking status
            }
            tracking_status = tracking_status_map.get(instance.order_status, 'order_placed')

            # Try to get the latest tracking update and update it, or create a new one
            latest_tracking = OrderTracking.objects.filter(order=instance).order_by('-created_at').first()
            if latest_tracking and latest_tracking.status != tracking_status:
                OrderTracking.objects.create(
                    order=instance,
                    status=tracking_status,
                    message=f'Order status updated to {instance.order_status}',
                    location=latest_tracking.location # Keep previous location or update as needed
                )
            elif not latest_tracking:
                 OrderTracking.objects.create(
                    order=instance,
                    status=tracking_status,
                    message=f'Order status updated to {instance.order_status}',
                    location='Processing Center'
                )
