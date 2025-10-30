from django.db.models import Q
from django.utils import timezone
from datetime import date, timedelta

from .models import Product, Batch, Discount, Category

def calculate_effective_discount_percentage(product_obj):
    """
    Calculates the highest applicable discount percentage for a product,
    considering both batch-specific and master discounts (product/category-wise).
    """
    all_batches = list(product_obj.batches.all())
    active_batches = [batch for batch in all_batches if batch.expiry_date > date.today()]

    batch_max_discount = 0
    if active_batches:
        # Consider the highest generic discount from active batches
        batch_max_discount = float(max(batch.discount_percentage for batch in active_batches))

    today = timezone.now().date()
    
    # Product-specific discounts
    product_discounts = product_obj.discounts.filter(
        is_active=True,
        start_date__lte=today,
        end_date__gte=today,
        target_type='product'
    )
    
    # Category-specific discounts (including parent categories)
    category_discounts = Discount.objects.filter(
        Q(category=product_obj.category) | Q(category__parent_category=product_obj.category),
        is_active=True,
        start_date__lte=today,
        end_date__gte=today,
        target_type='category'
    )

    max_discount_from_master = 0
    if product_discounts.exists():
        max_discount_from_master = max(d.percentage for d in product_discounts)
    if category_discounts.exists():
        max_discount_from_master = max(max_discount_from_master, max(d.percentage for d in category_discounts))

    return max(batch_max_discount, max_discount_from_master)


def calculate_current_selling_price(product_obj, channel='online'):
    """
    Calculates the current selling price for a product based on the specified channel,
    considering batch-specific pricing and master discounts.
    """
    all_batches = list(product_obj.batches.all())
    active_batches = [batch for batch in all_batches if batch.expiry_date > date.today() and batch.current_quantity > 0]

    if not active_batches:
        return 0 # Return 0 if no active batches

    # Sort by expiry date to prioritize batches that expire sooner (common practice)
    # The "primary" batch for display/pricing will now be the earliest expiring active batch.
    active_batches.sort(key=lambda b: b.expiry_date)

    # Select the earliest expiring active batch
    selected_batch = active_batches[0]

    base_mrp = 0
    batch_discount_percentage = 0

    if channel == 'online':
        base_mrp = selected_batch.online_mrp_price
        batch_discount_percentage = selected_batch.online_discount_percentage
    elif channel == 'offline':
        base_mrp = selected_batch.offline_mrp_price
        batch_discount_percentage = selected_batch.offline_discount_percentage
    else: # Default or generic
        base_mrp = selected_batch.mrp_price
        batch_discount_percentage = selected_batch.discount_percentage

    # Find the highest applicable discount from the Discount model
    today = timezone.now().date()
    product_discounts = product_obj.discounts.filter(
        is_active=True,
        start_date__lte=today,
        end_date__gte=today,
        target_type='product'
    )
    category_discounts = Discount.objects.filter(
        Q(category=product_obj.category) | Q(category__parent_category=product_obj.category),
        is_active=True,
        start_date__lte=today,
        end_date__gte=today,
        target_type='category'
    )

    max_discount_from_master = 0
    if product_discounts.exists():
        max_discount_from_master = max(d.percentage for d in product_discounts)
    if category_discounts.exists():
        max_discount_from_master = max(max_discount_from_master, max(d.percentage for d in category_discounts))

    # Compare batch-specific discount with master discounts and take the highest
    final_discount_percentage = max(batch_discount_percentage, max_discount_from_master)

    # Calculate final selling price
    if base_mrp is not None: # Should not be None due to model defaults, but good to be safe
        discount_amount = base_mrp * (final_discount_percentage / 100)
        return base_mrp - discount_amount
    return 0

def calculate_current_cost_price(product_obj):
    """
    Calculates the current cost price for a product, prioritizing primary batch.
    """
    all_batches = list(product_obj.batches.all())
    active_batches = [batch for batch in all_batches if batch.expiry_date > date.today() and batch.current_quantity > 0]

    active_batches.sort(key=lambda b: b.expiry_date)

    primary_batch = next((batch for batch in active_batches if batch.is_primary), None)
    if primary_batch:
        return primary_batch.cost_price

    if active_batches:
        return active_batches[0].cost_price
    return 0
