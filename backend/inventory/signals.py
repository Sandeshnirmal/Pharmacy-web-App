from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from inventory.models import StockMovement
from product.models import Batch

@receiver(post_save, sender=StockMovement)
def update_batch_quantity_on_stock_movement_save(sender, instance, created, **kwargs):
    """
    Updates the Batch's current_quantity when a StockMovement is saved.
    Assumes quantity in StockMovement is positive for IN and negative for OUT.
    """
    batch = instance.batch
    if created:
        # New stock movement
        if instance.movement_type == 'IN':
            batch.current_quantity += instance.quantity
            batch.quantity += instance.quantity # Synchronize quantity
        elif instance.movement_type in ['OUT', 'EXPIRED', 'DAMAGED', 'SUPPLIER_RETURN']:
            batch.current_quantity -= instance.quantity
            batch.quantity -= instance.quantity # Synchronize quantity
    else:
        # Existing stock movement updated (less common, but handle for robustness)
        # This would require comparing old and new quantities, which is more complex.
        # For simplicity, we'll assume updates to quantity are rare or handled by new movements.
        # A more robust solution would involve pre_save to get old quantity.
        pass # For now, we'll focus on 'created' events.

    batch.save(update_fields=['current_quantity', 'quantity'])

@receiver(post_delete, sender=StockMovement)
def update_batch_quantity_on_stock_movement_delete(sender, instance, **kwargs):
    """
    Reverts the Batch's current_quantity when a StockMovement is deleted.
    """
    batch = instance.batch
    if instance.movement_type == 'IN':
        batch.current_quantity -= instance.quantity
        batch.quantity -= instance.quantity # Synchronize quantity
    elif instance.movement_type in ['OUT', 'EXPIRED', 'DAMAGED', 'SUPPLIER_RETURN']:
        batch.current_quantity += instance.quantity
        batch.quantity += instance.quantity # Synchronize quantity
    batch.save(update_fields=['current_quantity', 'quantity'])
