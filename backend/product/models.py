from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from simple_history.models import HistoricalRecords # Import HistoricalRecords
from decimal import Decimal

User = get_user_model()

# ============================================================================
# COMPOSITION MANAGEMENT SYSTEM
# ============================================================================

class Composition(models.Model):
    """Reusable medicine compositions (active ingredients)"""
    name = models.CharField(max_length=200, unique=True)
    scientific_name = models.CharField(max_length=300, blank=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, blank=True)
    side_effects = models.TextField(blank=True)
    contraindications = models.TextField(blank=True)
    aliases = models.JSONField(default=list, blank=True)  # Alternative names for better searching
    therapeutic_class = models.CharField(max_length=100, blank=True)  # Drug class
    mechanism_of_action = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_compositions')

    class Meta:
        db_table = 'compositions'
        verbose_name = 'Composition'
        verbose_name_plural = 'Compositions'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.name


class GenericName(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    parent_category = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    """Enhanced Medicine database with multiple compositions support"""
    name = models.CharField(max_length=255)
    brand_name = models.CharField(max_length=200, blank=True)
    generic_name = models.ForeignKey(GenericName, on_delete=models.SET_NULL, null=True, blank=True)
    manufacturer = models.CharField(max_length=255, default='MedCorp')

    MEDICINE_TYPES = [
        ('tablet', 'Tablet'),
        ('capsule', 'Capsule'),
        ('syrup', 'Syrup'),
        ('injection', 'Injection'),
        ('cream', 'Cream'),
        ('drops', 'Drops'),
        ('inhaler', 'Inhaler'),
        ('other', 'Other'),
    ]
    medicine_type = models.CharField(max_length=20, choices=MEDICINE_TYPES, default='tablet')

    PRESCRIPTION_TYPES = [
        ('otc', 'Over The Counter'),
        ('prescription', 'Prescription Required'),
        ('controlled', 'Controlled Substance'),
    ]
    prescription_type = models.CharField(max_length=20, choices=PRESCRIPTION_TYPES, default='otc')

    min_stock_level = models.PositiveIntegerField(default=10)
    
    description = models.TextField(blank=True)
    uses = models.TextField(blank=True)
    side_effects = models.TextField(blank=True)
    how_to_use = models.TextField(blank=True)
    precautions = models.TextField(blank=True)
    storage = models.TextField(blank=True)

    compositions = models.ManyToManyField(
        Composition,
        through='ProductComposition',
        related_name='product_list'
    )

    image = models.ImageField(upload_to='product_images/', blank=True, null=True)
    hsn_code = models.CharField(max_length=20, blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)

    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_products', null=True, blank=True)

    class Meta:
        db_table = 'products'
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['brand_name']),
            models.Index(fields=['manufacturer']),
            models.Index(fields=['is_active']),
            models.Index(fields=['prescription_type']),
        ]
        unique_together = ['name', 'manufacturer'] # Removed 'dosage_form'

    @property
    def stock_quantity(self):
        """Calculates the total stock quantity from all active batches."""
        return self.batches.aggregate(total_quantity=models.Sum('current_quantity'))['total_quantity'] or 0

    def get_default_batch(self):
        """
        Returns the default batch for the product based on stock > 0 and earliest expiry date.
        """
        from django.utils import timezone
        today = timezone.now().date()
        return self.batches.filter(
            current_quantity__gt=0,
            expiry_date__gte=today
        ).order_by('expiry_date').first()

    @property
    def is_prescription_required(self):
        """
        Returns True if the product requires a prescription ('prescription' or 'controlled').
        """
        return self.prescription_type in ['prescription', 'controlled']

    def __str__(self):
        return f"{self.name} ({self.manufacturer})"


class ProductComposition(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_compositions')
    composition = models.ForeignKey(Composition, on_delete=models.CASCADE, related_name='composition_products')
    strength = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True, help_text="Strength value (e.g., 500 for 500mg)")
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    is_primary = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'product_compositions'
        verbose_name = 'Product Composition'
        verbose_name_plural = 'Product Compositions'
        unique_together = ['product', 'composition']

    def __str__(self):
        return f"{self.product.name} - {self.composition.name} ({self.strength})"


class Batch(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='batches')
    batch_number = models.CharField(max_length=100)
    history = HistoricalRecords() # Add HistoricalRecords to track changes
    manufacturing_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField()
    quantity = models.DecimalField(max_digits=20, decimal_places=10, default=0)
    current_quantity = models.DecimalField(max_digits=20, decimal_places=10)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    
    # Generic pricing fields (can be used as defaults or for single-channel scenarios)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, null=False)
    mrp_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, null=False)
    discount_percentage = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Online specific pricing
    online_mrp_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, null=False)
    online_discount_percentage = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    online_selling_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, null=False)

    # Offline specific pricing
    offline_mrp_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, null=False)
    offline_discount_percentage = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    offline_selling_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, null=False)

    is_primary = models.BooleanField(default=False)
    mfg_license_number = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Calculate generic selling price
        if self.mrp_price is not None and self.discount_percentage is not None:
            discount_amount = self.mrp_price * (self.discount_percentage / Decimal('100'))
            self.selling_price = self.mrp_price - discount_amount
        
        # Calculate online selling price
        if self.online_mrp_price is not None and self.online_discount_percentage is not None:
            online_discount_amount = self.online_mrp_price * (self.online_discount_percentage / Decimal('100'))
            self.online_selling_price = self.online_mrp_price - online_discount_amount
        
        # Calculate offline selling price
        if self.offline_mrp_price is not None and self.offline_discount_percentage is not None:
            offline_discount_amount = self.offline_mrp_price * (self.offline_discount_percentage / Decimal('100'))
            self.offline_selling_price = self.offline_mrp_price - offline_discount_amount
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} - {self.batch_number}"


class Inventory(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inventory')
    quantity_on_hand = models.PositiveIntegerField()
    reorder_point = models.PositiveIntegerField()
    last_restock_date = models.DateField()

    def __str__(self):
        return f"{self.product.name} - {self.quantity_on_hand} in stock"


class ProductReview(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=200, blank=True)
    comment = models.TextField(blank=True)
    is_verified_purchase = models.BooleanField(default=False)
    helpful_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('product', 'user')

    def __str__(self):
        return f"{self.user.username} - {self.product.name} ({self.rating}/5)"


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image_url = models.URLField()
    alt_text = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.product.name} - Image {self.order}"


class Wishlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')

    def __str__(self):
        return f"{self.user.username} - {self.product.name}"


class ProductTag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=7, default='#007bff')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class ProductTagAssignment(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='tags')
    tag = models.ForeignKey(ProductTag, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('product', 'tag')

    def __str__(self):
        return f"{self.product.name} - {self.tag.name}"


class ProductViewHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-viewed_at']

    def __str__(self):
        return f"{self.user.username} viewed {self.product.name}"


class Discount(models.Model):
    DISCOUNT_TARGET_TYPES = [
        ('product', 'Product'),
        ('category', 'Category'),
    ]

    name = models.CharField(max_length=255)
    percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Discount percentage (0-100)"
    )
    description = models.TextField(blank=True)
    target_type = models.CharField(max_length=20, choices=DISCOUNT_TARGET_TYPES)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True, related_name='discounts')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, null=True, blank=True, related_name='discounts')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_discounts')

    class Meta:
        verbose_name = 'Discount'
        verbose_name_plural = 'Discounts'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['target_type']),
            models.Index(fields=['is_active']),
        ]

    def clean(self):
        if self.target_type == 'product' and not self.product:
            from django.core.exceptions import ValidationError
            raise ValidationError({'product': 'Product must be specified for product-wise discounts.'})
        if self.target_type == 'category' and not self.category:
            from django.core.exceptions import ValidationError
            raise ValidationError({'category': 'Category must be specified for category-wise discounts.'})
        if self.target_type == 'product' and self.category:
            from django.core.exceptions import ValidationError
            raise ValidationError({'category': 'Cannot specify category for product-wise discounts.'})
        if self.target_type == 'category' and self.product:
            from django.core.exceptions import ValidationError
            raise ValidationError({'product': 'Cannot specify product for category-wise discounts.'})

    def __str__(self):
        target = ""
        if self.target_type == 'product' and self.product:
            target = f" for Product: {self.product.name}"
        elif self.target_type == 'category' and self.category:
            target = f" for Category: {self.category.name}"
        return f"{self.name} ({self.percentage}%) {target}"
