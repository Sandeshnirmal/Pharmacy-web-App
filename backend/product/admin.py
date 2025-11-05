from django.contrib import admin
from .models import Category, Product, Batch, Inventory, GenericName, ProductReview, ProductImage, Wishlist, ProductTag, ProductTagAssignment, ProductViewHistory, Composition, Discount, ProductUnit, ProductComposition

@admin.register(ProductUnit)
class ProductUnitAdmin(admin.ModelAdmin):
    list_display = ('unit_name', 'base_unit_name', 'conversion_factor', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('unit_name', 'base_unit_name')
    ordering = ('unit_name',)

class ProductCompositionInline(admin.TabularInline):
    model = ProductComposition
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'brand_name', 'generic_name', 'manufacturer', 'medicine_type', 'prescription_type', 'category', 'product_unit', 'is_active', 'is_featured', 'created_at')
    list_filter = ('medicine_type', 'prescription_type', 'category', 'is_active', 'is_featured')
    search_fields = ('name', 'brand_name', 'generic_name__name', 'manufacturer', 'description')
    raw_id_fields = ('generic_name', 'category', 'created_by', 'product_unit')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    inlines = [ProductCompositionInline]
    fieldsets = (
        (None, {
            'fields': ('name', 'brand_name', 'generic_name', 'manufacturer', 'category', 'product_unit')
        }),
        ('Medicine Details', {
            'fields': ('medicine_type', 'prescription_type', 'form', 'dosage_form', 'pack_size', 'min_stock_level')
        }),
        ('Description & Usage', {
            'fields': ('description', 'uses', 'side_effects', 'how_to_use', 'precautions', 'storage')
        }),
        ('Other Information', {
            'fields': ('image_url', 'hsn_code', 'is_active', 'is_featured', 'is_prescription_required', 'created_by')
        }),
    )

@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ('product', 'batch_number', 'expiry_date', 'quantity', 'current_quantity', 'selling_price', 'mrp_price', 'is_primary', 'created_at')
    list_filter = ('expiry_date', 'is_primary')
    search_fields = ('product__name', 'batch_number')
    raw_id_fields = ('product',)
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent_category', 'created_at', 'updated_at')
    search_fields = ('name',)
    list_filter = ('parent_category',)

@admin.register(GenericName)
class GenericNameAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'rating', 'is_verified_purchase', 'helpful_count', 'created_at')
    list_filter = ('rating', 'is_verified_purchase')
    search_fields = ('product__name', 'user__username', 'comment')
    raw_id_fields = ('product', 'user')

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'image_url', 'is_primary', 'order')
    list_filter = ('is_primary',)
    raw_id_fields = ('product',)
    ordering = ('product', 'order')

@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'created_at')
    raw_id_fields = ('user', 'product')

@admin.register(ProductTag)
class ProductTagAdmin(admin.ModelAdmin):
    list_display = ('name', 'color', 'created_at')
    search_fields = ('name',)

@admin.register(ProductTagAssignment)
class ProductTagAssignmentAdmin(admin.ModelAdmin):
    list_display = ('product', 'tag', 'created_at')
    raw_id_fields = ('product', 'tag')

@admin.register(ProductViewHistory)
class ProductViewHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'viewed_at')
    raw_id_fields = ('user', 'product')
    ordering = ('-viewed_at',)

@admin.register(Composition)
class CompositionAdmin(admin.ModelAdmin):
    list_display = ('name', 'scientific_name', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'scientific_name', 'description')

@admin.register(Discount)
class DiscountAdmin(admin.ModelAdmin):
    list_display = ('name', 'percentage', 'target_type', 'product', 'category', 'is_active', 'start_date', 'end_date')
    list_filter = ('target_type', 'is_active')
    search_fields = ('name', 'description', 'product__name', 'category__name')
    raw_id_fields = ('product', 'category', 'created_by')
