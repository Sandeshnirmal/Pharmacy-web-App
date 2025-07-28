from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

User = get_user_model()

# ============================================================================
# COMPOSITION MANAGEMENT SYSTEM
# ============================================================================

class Composition(models.Model):
    """Reusable medicine compositions (active ingredients)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, unique=True)
    scientific_name = models.CharField(max_length=300, blank=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, blank=True)  # e.g., 'analgesic', 'antibiotic'
    side_effects = models.TextField(blank=True)
    contraindications = models.TextField(blank=True)
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
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)  # Branded name
    brand_name = models.CharField(max_length=200, blank=True)
    generic_name = models.ForeignKey(GenericName, on_delete=models.CASCADE)
    manufacturer = models.CharField(max_length=255, default='MedCorp')

    # Medicine classifications
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

    # Prescription requirements
    PRESCRIPTION_TYPES = [
        ('otc', 'Over The Counter'),
        ('prescription', 'Prescription Required'),
        ('controlled', 'Controlled Substance'),
    ]
    prescription_type = models.CharField(max_length=20, choices=PRESCRIPTION_TYPES, default='otc')

    # Legacy fields for backward compatibility
    strength = models.CharField(max_length=50, blank=True)  # e.g., 500mg
    form = models.CharField(max_length=50, blank=True)  # Tablet, Syrup, etc.
    is_prescription_required = models.BooleanField(default=False)

    # Pricing and inventory
    price = models.DecimalField(max_digits=10, decimal_places=2)
    mrp = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.PositiveIntegerField(default=0)
    min_stock_level = models.PositiveIntegerField(default=10)

    # Medicine details
    dosage_form = models.CharField(max_length=100, blank=True)  # e.g., "500mg", "10ml"
    pack_size = models.CharField(max_length=50, blank=True)  # e.g., "10 Tablets", "100ml"
    packaging_unit = models.CharField(max_length=50, blank=True)  # e.g., Box, Strip

    # Enhanced medicine information
    description = models.TextField(blank=True)
    composition = models.TextField(blank=True, help_text="Legacy composition field")
    uses = models.TextField(blank=True, help_text="Medical uses and indications")
    side_effects = models.TextField(blank=True, help_text="Possible side effects")
    how_to_use = models.TextField(blank=True, help_text="Dosage and administration instructions")
    precautions = models.TextField(blank=True, help_text="Warnings and precautions")
    storage = models.TextField(blank=True, help_text="Storage conditions")

    # Relationships
    compositions = models.ManyToManyField(
        Composition,
        through='ProductComposition',
        related_name='products'
    )

    # Legacy fields
    image_url = models.URLField(blank=True)
    hsn_code = models.CharField(max_length=20, blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)

    # Status and metadata
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)

    # Audit fields
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
        unique_together = ['name', 'manufacturer', 'dosage_form']

    def __str__(self):
        return f"{self.name} ({self.manufacturer})"

class ProductComposition(models.Model):
    """Junction table for product-composition relationship with dosage info"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    composition = models.ForeignKey(Composition, on_delete=models.CASCADE)
    strength = models.CharField(max_length=100)  # e.g., "500mg", "10%"
    unit = models.CharField(max_length=20, default='mg')  # mg, ml, %, etc.
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'product_compositions'
        verbose_name = 'Product Composition'
        verbose_name_plural = 'Product Compositions'
        unique_together = ['product', 'composition']

    def __str__(self):
        return f"{self.product.name} - {self.composition.name} ({self.strength}{self.unit})"


class Batch(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='batches')
    batch_number = models.CharField(max_length=100)
    manufacturing_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField()
    quantity = models.PositiveIntegerField(default=0)  # Initial quantity
    current_quantity = models.PositiveIntegerField()  # Current available quantity
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    mfg_license_number = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
    color = models.CharField(max_length=7, default='#007bff')  # Hex color
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

