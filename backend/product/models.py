from django.db import models

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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Batch(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='batches')
    batch_number = models.CharField(max_length=100)
    manufacturing_date = models.DateField()
    expiry_date = models.DateField()
    current_quantity = models.PositiveIntegerField()    
    mfg_license_number = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.product.name} - {self.batch_number}"


class Inventory(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inventory')
    quantity_on_hand = models.PositiveIntegerField()
    reorder_point = models.PositiveIntegerField()
    last_restock_date = models.DateField()

    def __str__(self):
        return f"{self.product.name} - {self.quantity_on_hand} in stock"



