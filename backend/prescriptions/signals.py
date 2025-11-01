from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import Prescription, PrescriptionMedicine

@receiver(post_save, sender=Prescription)
@receiver(post_delete, sender=Prescription)
def invalidate_prescription_cache(sender, instance, **kwargs):
    """
    Invalidates the cache for views related to Prescription data when a Prescription
    object is saved or deleted. This includes the verification_queue and analytics views.
    """
    cache.clear() # Clear the entire cache for simplicity. More granular invalidation could be implemented if needed.
    # print(f"Cache cleared due to Prescription {instance.id} {'saved' if kwargs.get('created') else 'updated' if 'update_fields' in kwargs else 'deleted'}.") # Removed debug print

@receiver(post_save, sender=PrescriptionMedicine)
@receiver(post_delete, sender=PrescriptionMedicine)
def invalidate_prescription_medicine_cache(sender, instance, **kwargs):
    """
    Invalidates the cache for views related to PrescriptionMedicine data when a PrescriptionMedicine
    object is saved or deleted. This also affects views like verification_queue and analytics.
    """
    cache.clear() # Clear the entire cache for simplicity.
    # print(f"Cache cleared due to PrescriptionMedicine {instance.id} {'saved' if kwargs.get('created') else 'updated' if 'update_fields' in kwargs else 'deleted'}.") # Removed debug print
