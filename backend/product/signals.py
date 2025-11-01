from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import (
    Category, Product, Batch, Inventory, GenericName,
    ProductReview, ProductImage, Wishlist, ProductTag,
    ProductViewHistory, Discount, ProductComposition
)

def invalidate_product_related_cache(sender, instance, **kwargs):
    """
    Invalidates the entire cache for views related to product data when any
    product-related model is saved or deleted.
    """
    cache.clear()
    # print(f"Cache cleared due to {sender.__name__} {instance.id} {'saved' if kwargs.get('created') else 'updated' if 'update_fields' in kwargs else 'deleted'}.") # Removed debug print

# Connect signals for all relevant models
@receiver(post_save, sender=Category)
@receiver(post_delete, sender=Category)
@receiver(post_save, sender=Product)
@receiver(post_delete, sender=Product)
@receiver(post_save, sender=Batch)
@receiver(post_delete, sender=Batch)
@receiver(post_save, sender=Inventory)
@receiver(post_delete, sender=Inventory)
@receiver(post_save, sender=GenericName)
@receiver(post_delete, sender=GenericName)
@receiver(post_save, sender=ProductReview)
@receiver(post_delete, sender=ProductReview)
@receiver(post_save, sender=ProductImage)
@receiver(post_delete, sender=ProductImage)
@receiver(post_save, sender=Wishlist)
@receiver(post_delete, sender=Wishlist)
@receiver(post_save, sender=ProductTag)
@receiver(post_delete, sender=ProductTag)
@receiver(post_save, sender=ProductViewHistory)
@receiver(post_delete, sender=ProductViewHistory)
@receiver(post_save, sender=Discount)
@receiver(post_delete, sender=Discount)
@receiver(post_save, sender=ProductComposition)
@receiver(post_delete, sender=ProductComposition)
def connect_invalidate_product_related_cache(sender, instance, **kwargs):
    invalidate_product_related_cache(sender, instance, **kwargs)
