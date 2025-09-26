from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from orders.models import Order, OrderStatusHistory
from django.db import transaction
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Cleans up abandoned pending orders older than a specified threshold.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=1,
            help='Number of days after which a pending order is considered abandoned.',
        )

    def handle(self, *args, **options):
        days_threshold = options['days']
        abandoned_threshold = timezone.now() - timedelta(days=days_threshold)

        self.stdout.write(self.style.SUCCESS(
            f"Starting cleanup of abandoned pending orders older than {days_threshold} days..."
        ))
        logger.info(
            f"Starting cleanup of abandoned pending orders older than {days_threshold} days."
        )

        try:
            with transaction.atomic():
                # Find pending orders that are older than the threshold
                abandoned_orders = Order.objects.filter(
                    order_status='Pending',
                    payment_status='Pending',
                    created_at__lt=abandoned_threshold
                )

                count = abandoned_orders.count()
                if count == 0:
                    self.stdout.write(self.style.SUCCESS("No abandoned orders found."))
                    logger.info("No abandoned orders found.")
                    return

                for order in abandoned_orders:
                    old_status = order.order_status
                    order.order_status = 'Cancelled'
                    order.payment_status = 'Aborted'
                    order.notes += f"\nAutomatically cancelled due to abandonment (older than {days_threshold} days)."
                    order.save()

                    OrderStatusHistory.objects.create(
                        order=order,
                        old_status=old_status,
                        new_status='Cancelled',
                        changed_by=None, # System action
                        reason=f'Automatically cancelled due to abandonment (older than {days_threshold} days).'
                    )
                    logger.info(f"Order {order.id} (ORD{order.id:06d}) marked as Cancelled/Aborted.")

                self.stdout.write(self.style.SUCCESS(
                    f"Successfully cancelled {count} abandoned pending orders."
                ))
                logger.info(
                    f"Successfully cancelled {count} abandoned pending orders."
                )

        except Exception as e:
            logger.exception("Error during cleanup of abandoned orders.")
            self.stderr.write(self.style.ERROR(
                f"An error occurred during cleanup: {str(e)}"
            ))
