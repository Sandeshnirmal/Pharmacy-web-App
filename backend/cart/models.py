from django.db import models
from usermanagement.models import User # Corrected import path for User
from product.models import Product

class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart of {self.user.username}"

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    # Add a ForeignKey to ProductUnit to specify the unit for this cart item
    product_unit = models.ForeignKey(
        'product.ProductUnit',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="The unit in which this product is added to the cart (e.g., 'strip', 'bottle')."
    )
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('cart', 'product', 'product_unit') # A product in a specific unit can only be once in a cart

    def __str__(self):
        unit_display = self.product_unit.unit_abbreviation if self.product_unit and self.product_unit.unit_abbreviation else (self.product_unit.unit_name if self.product_unit else 'units')
        return f"{self.quantity} {unit_display} of {self.product.name} in {self.cart.user.username}'s cart"

    @property
    def total_price(self):
        default_batch = self.product.get_default_batch()
        if default_batch:
            return self.quantity * default_batch.online_selling_price
        return 0 # Or raise an error, depending on desired behavior when no batch is found
