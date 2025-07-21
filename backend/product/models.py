from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()

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
    name = models.CharField(max_length=255, unique=True)  # Branded name
    generic_name = models.ForeignKey(GenericName, on_delete=models.CASCADE)
    strength = models.CharField(max_length=50)  # e.g., 500mg
    form = models.CharField(max_length=50)  # Tablet, Syrup, etc.
    manufacturer = models.CharField(max_length=255, default='MedCorp')  # Fixed brand
    price = models.DecimalField(max_digits=10, decimal_places=2)
    mrp = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    image_url = models.URLField(blank=True)
    is_prescription_required = models.BooleanField(default=False)
    hsn_code = models.CharField(max_length=20)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    packaging_unit = models.CharField(max_length=50)  # e.g., Box, Strip
    pack_size = models.CharField(max_length=50)  # e.g., 10 Tablets
    stock_quantity = models.PositiveIntegerField(default=0)  # Current stock level
    min_stock_level = models.PositiveIntegerField(default=10)  # Minimum stock alert level

    # Enhanced medicine information
    composition = models.TextField(blank=True, help_text="Active ingredients and their quantities")
    uses = models.TextField(blank=True, help_text="Medical uses and indications")
    side_effects = models.TextField(blank=True, help_text="Possible side effects")
    how_to_use = models.TextField(blank=True, help_text="Dosage and administration instructions")
    precautions = models.TextField(blank=True, help_text="Warnings and precautions")
    storage = models.TextField(blank=True, help_text="Storage conditions")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


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

