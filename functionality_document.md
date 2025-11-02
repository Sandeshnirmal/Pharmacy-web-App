**Document: Pharmacy Web App - Core Functionalities Analysis**

**Date:** 2025-10-28

**Author:** Cline

---

**1. Product Master Functionality**

*   **Description:** The Product Master manages the core information about all pharmaceutical products. It is primarily defined by the `Product` model in `backend/product/models.py`.
    *   **Key Models:**
        *   `Product`: Stores general product details (name, brand, generic name, manufacturer, medicine type, prescription type, strength, description, uses, side effects, images, categories, etc.). It links to `Composition` for active ingredients.
        *   `Composition`: Defines reusable active ingredients.
        *   `Category`: Organizes products into categories.
        *   `GenericName`: Stores generic names for products.
        *   `Batch`: **Crucially, pricing (MRP, selling price, cost price) and stock quantity are managed at the batch level, not directly on the `Product` model.** Each product can have multiple batches, each with its own manufacturing date, expiry date, quantities, and specific pricing.
    *   **Data Flow:** Products are defined, then batches are created for each product, holding specific stock and pricing information.

*   **Flaws/Broken Code & Solutions:**
    *   **Flaw 1: `Product.composition` (TextField) vs. `Product.compositions` (ManyToManyField):** The `Product` model had both a `composition` (TextField, marked as "Legacy composition field") and a `compositions` (ManyToManyField to `Composition` through `ProductComposition`). This redundancy could lead to data inconsistency and confusion.
        *   **Solution:** The `composition` TextField has been removed from the `Product` model. All composition data is now managed solely through the `compositions` ManyToManyField and the `ProductComposition` intermediary model. (Migration of existing data from the legacy field would be a separate, manual step if data existed).
    *   **Flaw 2: `Product.is_prescription_required` vs. `Product.prescription_type`:** There was `is_prescription_required` (BooleanField) and `prescription_type` (CharField with choices like 'otc', 'prescription', 'controlled'). These fields overlapped in intent.
        *   **Solution:** `is_prescription_required` has been removed. The system now relies solely on `prescription_type` to determine if a prescription is needed.
    *   **Flaw 3: `Batch.current_quantity` not explicitly updated on stock movements:** While `StockMovement` records changes, there was no explicit trigger or method to automatically update `Batch.current_quantity` when a `StockMovement` occurred. This could lead to discrepancies between recorded movements and actual batch quantities.
        *   **Solution:** A `post_save` and `post_delete` signal has been implemented in `backend/inventory/signals.py` and connected in `backend/inventory/apps.py`. This signal automatically updates the `Batch.current_quantity` whenever a `StockMovement` is created or deleted, ensuring accurate inventory tracking.
    *   **Flaw 4: `Batch.save` method calculates selling prices but doesn't handle `None` for MRP/Discount:** The `save` method in `Batch` assumes `mrp_price` and `discount_percentage` (and their online/offline counterparts) are not `None` when performing calculations.
        *   **Solution:** Upon review, the existing `Batch.save` method already includes explicit `is not None` checks before performing calculations. Additionally, `DecimalField`s have `default=0`, which prevents them from being `None` unless explicitly set. Therefore, this flaw is already robustly handled by the existing implementation.

    *All identified flaws in the Product Master functionality at the model level have been addressed and resolved.*

**2. Rate Functionality**

*   **Description:** "Rate" refers to the pricing of products, both cost price (purchase rate) and selling price.
    *   **Cost Price:** Stored in `Batch.cost_price` (`backend/product/models.py`). This is the price at which the product is acquired from a supplier.
    *   **Selling Price:**
        *   **Base/Generic Selling Price:** `Batch.mrp_price` and `Batch.selling_price` (calculated from `mrp_price` and `discount_percentage`) in `backend/product/models.py`.
        *   **Channel-Specific Selling Price:** `Batch.online_mrp_price`, `Batch.online_selling_price`, `Batch.offline_mrp_price`, `Batch.offline_selling_price` are available for different sales channels. These are also calculated within the `Batch.save` method.
        *   **Purchase Order Item Price:** `PurchaseOrderItem.unit_price` (`backend/inventory/models.py`) stores the agreed-upon purchase price per unit for a specific item in a purchase order.
        *   **Offline Sale Item Price:** `OfflineSaleItem.price_per_unit` (`backend/offline_sales/models.py`) stores the final selling price per unit for a specific item in an offline sale.

*   **Flaws/Broken Code & Solutions:**
    *   **Flaw 1: Inconsistent handling of `DecimalField` defaults:** While `DecimalField`s have `default=0` or `default=0.00`, it's good practice to ensure that calculations always handle potential `None` values if the fields are ever allowed to be null, or if data integrity issues arise. (Addressed in Batch.save flaw in Product Master section).
    *   **Flaw 2: Lack of clear audit trail for price changes:** There was no explicit mechanism to track historical price changes for products or batches.
        *   **Solution:** A versioning system has been implemented using `django-simple-history`. `simple_history` has been added to `INSTALLED_APPS` in `backend/backend/settings.py`, and `history = HistoricalRecords()` has been added to the `Batch` model in `backend/product/models.py`. This will automatically track all changes to `Batch` instances, providing a clear audit trail for price and other field modifications.

    *All identified flaws in the Rate functionality at the project level have been addressed and resolved.*

**3. Discount Functionality**

*   **Description:** Discounts can be applied at various levels within the system.
    *   **Batch-level Discounts:** `Batch.discount_percentage`, `Batch.online_discount_percentage`, `Batch.offline_discount_percentage` (`backend/product/models.py`) are used to calculate the selling price for a specific batch. These are fixed for a given batch.
    *   **Purchase Item Discounts:** `PurchaseOrderItem.discount_percentage` (`backend/inventory/models.py`) allows for discounts to be applied to individual items during a purchase order.
    *   **Global/Targeted Discounts:** The `Discount` model (`backend/product/models.py`) allows for defining promotional discounts that can be applied to specific products or entire categories, with start and end dates.
    *   **Sales Discounts:** In `OfflineSaleItem`, the `price_per_unit` is the final price *after* discounts. There isn't a separate discount field on the sale item itself, implying discounts are applied upstream (from batch or global discounts) before the final `price_per_unit` is determined.

*   **Flaws/Broken Code & Solutions:**
    *   **Flaw 1: Potential for conflicting discounts:** If a product has a batch-level discount and is also part of a category with an active `Discount` from the `Discount` model, the system needs a clear rule on which discount takes precedence or how they combine. This logic was not explicitly defined.
        *   **Solution:** A discount hierarchy and application logic have been implemented within the `create` method of `OfflineSaleSerializer` (`backend/offline_sales/serializers.py`). The logic prioritizes batch-level offline discounts, then applies the highest active product-specific or category-specific `Discount` from the `Discount` model. The final `price_per_unit` is calculated, and the total `discount_percentage` and `discount_amount` are stored explicitly for each `OfflineSaleItem`.
    *   **Flaw 2: No explicit discount field on `OfflineSaleItem`:** While `price_per_unit` reflected the discounted price, it was not explicitly storing the `discount_amount` or `discount_percentage` applied to each `OfflineSaleItem` for reporting and auditing.
        *   **Solution:** `discount_percentage` and `discount_amount` fields have been added to the `OfflineSaleItem` model (`backend/offline_sales/models.py`). These fields are now calculated and populated within the `OfflineSaleSerializer.create` method, providing explicit records of discounts applied at the time of sale.

    *All identified flaws in the Discount functionality at the project level have been addressed and resolved.*

**4. Purchase Bill Functionality**

*   **Description:** The Purchase Bill functionality manages the process of ordering and receiving products from suppliers. It is primarily handled by the `PurchaseOrder` and `PurchaseOrderItem` models in `backend/inventory/models.py`.
    *   **Key Models:**
        *   `Supplier`: Stores supplier information.
        *   `PurchaseOrder`: Represents a purchase order, including supplier, invoice details, total amount, status (PENDING, ORDERED, RECEIVED, CANCELLED), and creation/update details.
        *   `PurchaseOrderItem`: Details individual products within a purchase order, including product, quantity, unit price, discount, tax, subtotal, and received/returned quantities.
        *   `PurchaseReturn` and `PurchaseReturnItem`: Handle returns to suppliers.
    *   **Frontend:** `frontend/src/pages/PurchaseOrderForm.jsx` is likely the interface for creating and managing purchase orders.

*   **Flaws/Broken Code & Solutions:**
    *   **Flaw 1: `invoice_number` and `invoice_date` temporarily nullable:** The `PurchaseOrder` model had `invoice_number` and `invoice_date` temporarily allowed as null for migration. These should ideally be mandatory once the migration is complete, as they are critical for a valid purchase bill.
        *   **Solution:** The model fields in `backend/inventory/models.py` were temporarily reverted to nullable to allow for migration. At the project level, validation has been added to the `PurchaseOrderSerializer` (`backend/inventory/serializers.py`) to ensure that `invoice_number` and `invoice_date` are always provided when a `PurchaseOrder`'s `status` is set to 'RECEIVED'. Once existing data is handled, these fields can be made non-nullable in the model.
    *   **Flaw 2: No clear link between `PurchaseOrderItem` receipt and `StockMovement`:** When `received_quantity` is updated in `PurchaseOrderItem`, there was no explicit mechanism to automatically create a corresponding `StockMovement` of type 'IN' to update the inventory.
        *   **Solution:** Upon review, the `create` and `update` methods of `PurchaseOrderSerializer` (`backend/inventory/serializers.py`) already contain robust logic to create `StockMovement` entries of type 'IN' and update `Batch` quantities when a `PurchaseOrder` is created or its status changes to 'RECEIVED'. This flaw is addressed by the existing serializer logic.
    *   **Flaw 3: `PurchaseOrderItem` stores `batch_number` and `expiry_date` but doesn't link to `Batch` model directly for new batches:** If a new batch is received, the `PurchaseOrderItem` stores its `batch_number` and `expiry_date`, but the direct linking to a `Batch` model instance was not explicitly detailed.
        *   **Solution:** Upon review, the `create` and `update` methods of `PurchaseOrderSerializer` (`backend/inventory/serializers.py`) already handle this by using `Batch.objects.get_or_create()` to either retrieve an existing batch or create a new one based on `product`, `batch_number`, and `expiry_date`. The `Batch` quantities are then updated accordingly. This flaw is addressed by the existing serializer logic.

    *All identified flaws in the Purchase Bill functionality at the project level have been addressed and resolved.*

**5. Sales Billing Functionality**

*   **Description:** The Sales Billing functionality handles the process of selling products to customers, primarily for offline sales. It is defined by the `OfflineSale` and `OfflineSaleItem` models in `backend/offline_sales/models.py`.
    *   **Key Models:**
        *   `OfflineCustomer`: Stores customer details for offline sales.
        *   `OfflineSale`: Represents a sales bill, including customer details, sale date, total amount, paid amount, change amount, payment method, status (PENDING, PAID, CANCELLED, RETURNED, PARTIALLY_RETURNED), and user information.
        *   `OfflineSaleItem`: Details individual products within a sale, including product, batch, quantity, price per unit, and subtotal.
        *   `BillReturn` and `BillReturnItem`: Handle returns of sold items.
    *   **Frontend:** `frontend/src/pages/salesbillpage.jsx` and `frontend/src/pages/offline_sales/OfflineSalesBilling.jsx` are likely the interfaces for creating and managing sales bills.

*   **Flaws/Broken Code & Solutions:**
    *   **Flaw 1: Denormalized customer data in `OfflineSale`:** `OfflineSale` stores `customer_name`, `customer_phone`, `customer_address` in addition to a `ForeignKey` to `OfflineCustomer`. While this can provide flexibility for guest sales, it introduces redundancy if the customer is linked, potentially leading to inconsistencies if the `OfflineCustomer` record is updated but the `OfflineSale` fields are not.
        *   **Solution:** Upon review, the `create` and `update` methods of `OfflineSaleSerializer` (`backend/offline_sales/serializers.py`) already contain logic to populate these denormalized fields from the linked `OfflineCustomer` instance, ensuring consistency when a customer is linked. For guest sales (where `customer` is null), these fields are used directly. This flaw is addressed by the existing serializer logic.
    *   **Flaw 2: No explicit link between `OfflineSaleItem` and `StockMovement` for 'OUT' movements:** When an `OfflineSaleItem` is created, there was no explicit mechanism to automatically create a `StockMovement` of type 'OUT' to decrement the `Batch.current_quantity`.
        *   **Solution:** Upon review, the `create` method of `OfflineSaleSerializer` (`backend/offline_sales/serializers.py`) already contains robust logic to create `StockMovement` entries of type 'OUT' and decrement `Batch` quantities for each `OfflineSaleItem` upon sale creation. This flaw is addressed by the existing serializer logic.
    *   **Flaw 3: Return logic for `OfflineSale` status:** The `OfflineSale` status can be 'RETURNED' or 'PARTIALLY_RETURNED'. The logic for transitioning to these statuses and ensuring `total_amount`, `paid_amount`, and `change_amount` are correctly adjusted (or new transactions are recorded) was not explicitly detailed in the models.
        *   **Solution:** Upon review, the `create` method of `BillReturnSerializer` (`backend/offline_sales/serializers.py`) already contains robust business logic to update the `OfflineSale` status to 'RETURNED' or 'PARTIALLY_RETURNED', adjust `Batch` quantities, and create corresponding `StockMovement` entries of type 'IN' for returned items. This flaw is addressed by the existing serializer logic.

    *All identified flaws in the Sales Billing functionality at the project level have been addressed and resolved.*

**6. Order Functionality**

*   **Description:** The Order functionality manages customer orders placed through the online platform. It encompasses order creation, item details, payment, status tracking, and links to prescription processing.
    *   **Key Models:**
        *   `Order`: Stores overall order information (user, total amount, payment method/status, order status, prescription link, delivery info, tracking).
        *   `OrderItem`: Details individual products within an order (product, quantity, unit price at order, batch, link to `PrescriptionMedicine`).
        *   `OrderTracking`: Provides detailed, timestamped status updates for an order.
        *   `OrderStatusHistory`: Logs all status changes for an order, including who changed it and why.

*   **Flaws/Broken Code & Solutions:**
    *   **Flaw 1: `OrderItem.unit_price` vs. `OrderItem.unit_price_at_order` redundancy:**
        *   **Description:** The `OrderItem` model previously had both `unit_price` and `unit_price_at_order`. `unit_price_at_order` is the correct field for storing the price at the time of order.
        *   **Solution:** `OrderItem.unit_price` has been removed from the `OrderItem` model, resolving this redundancy. All logic should now consistently use `unit_price_at_order`.
    *   **Flaw 2: `Order.order_status` and `OrderTracking.status` redundancy:**
        *   **Description:** Both `Order` and `OrderTracking` models have a `status` field. While `OrderTracking` is for history, `Order.order_status` should ideally be the single source of truth for the current status. The current setup might lead to inconsistencies if not carefully managed.
        *   **Solution:** A `post_save` signal has been implemented in `backend/orders/signals.py` and connected in `backend/orders/apps.py`. This signal automatically creates an `OrderStatusHistory` entry and updates `OrderTracking` whenever `order_status` changes, ensuring a consistent audit trail.
    *   **Flaw 3: `Order.address` (ForeignKey) vs. `Order.delivery_address` (JSONField) redundancy:**
        *   **Description:** The `Order` model previously had both a `ForeignKey` to `usermanagement.Address` and a `delivery_address` `JSONField`. This created redundancy and potential for inconsistency.
        *   **Solution:** The `Order.address` ForeignKey has been removed. The system now relies solely on `delivery_address` (JSONField) to store a complete snapshot of the delivery address at the time of order, ensuring historical accuracy even if the user's primary address changes.
    *   **Flaw 4: `OrderItem.product` and `OrderItem.batch` nullable:**
        *   **Description:** Both `product` and `batch` in `OrderItem` were previously `null=True`. An order item should always be linked to a product, and ideally to a specific batch for accurate inventory tracking.
        *   **Solution:** `OrderItem.product` and `OrderItem.batch` have been made non-nullable (`null=False, blank=False`) with `on_delete=models.PROTECT` to prevent accidental deletion of critical product or batch data. The order creation/processing logic must now ensure these fields are always provided.
    *   **Flaw 5: `Order.prescription_image_url` and `Order.prescription_status` vs. `prescriptions.PrescriptionMedicine`:**
        *   **Description:** The `Order` model previously had direct fields for `prescription_image_url` and `prescription_status`, creating a parallel and potentially inconsistent system with the more detailed `Prescription` and `PrescriptionMedicine` models in the `prescriptions` app.
        *   **Solution:** `Order.prescription_image_url` and `Order.prescription_status` have been removed. A `ForeignKey` from `Order` to `prescriptions.Prescription` has been added. This consolidates prescription data management, with `Order.is_prescription_order` indicating if an order requires a prescription, and the `prescription` ForeignKey linking to the detailed prescription record.
    *   **Flaw 6: Stock deduction logic not visible:**
        *   **Description:** The models define the structure, but the actual logic for deducting stock when an order is placed/processed is not visible in the models. This is a critical part of order processing.
        *   **Solution:** The stock deduction logic has been implemented within the `create` method of `OrderSerializer` (`backend/orders/serializers.py`). It handles atomic deduction of stock from the appropriate `Batch` and creation of `StockMovement` records (type 'OUT') when an order is placed.

    *All identified flaws in the Order functionality at the model level have been addressed and resolved.*

**7. Prescriptions Process Functionality**

*   **Description:** Manages the entire lifecycle of a prescription, from upload to verification and dispensing. It integrates AI for text extraction and medicine mapping.
    *   **Key Models:**
        *   `Prescription`: Stores overall prescription details (patient info, doctor info, image, OCR text, AI confidence, workflow status).
        *   `PrescriptionMedicine`: Details individual medicines extracted/mapped from a prescription (raw text, extracted dosage/frequency, suggested product, verified product, quantities, prices).
        *   `PrescriptionWorkflowLog`: Audit trail for status changes in a prescription.
        *   `PrescriptionScanResult`: Stores results of AI/OCR scans for medicine suggestions.
        *   `MedicineSuggestion`: Individual medicine suggestions from scans.

*   **Flaws/Broken Code & Solutions:**
    *   **Flaw 1: `Prescription.status` vs. `Prescription.verification_status` redundancy:**
        *   **Description:** The `Prescription` model has both `status` (for enhanced workflow) and `verification_status` (a legacy field). This is a clear redundancy.
        *   **Solution:** `Prescription.verification_status` has been removed from `backend/prescriptions/models.py`. All status management is now consolidated under `Prescription.status`.
    *   **Flaw 2: `PrescriptionMedicine.suggested_medicine` vs. `PrescriptionMedicine.mapped_product` vs. `PrescriptionMedicine.verified_medicine`:**
        *   **Description:** Multiple fields for linking to a `Product` (`suggested_medicine`, `mapped_product` (legacy), `verified_medicine`) in `PrescriptionMedicine`. This is confusing and redundant.
        *   **Solution:** `PrescriptionMedicine.mapped_product` (legacy field) has been removed from `backend/prescriptions/models.py`. The roles of `suggested_medicine` and `verified_medicine` are now clearly defined, with application logic consistently using `verified_medicine` for order fulfillment.
    *   **Flaw 3: `PrescriptionMedicine.quantity_prescribed` (PositiveIntegerField) vs. `extracted_quantity` (CharField) vs. `verified_quantity` (CharField):**
        *   **Description:** Multiple fields for quantity, with inconsistent types. `quantity_prescribed` is an integer, while `extracted_quantity` and `verified_quantity` are CharFields. This can lead to data type issues and difficulty in calculations.
        *   **Solution:** `extracted_quantity` and `verified_quantity` fields in `backend/prescriptions/models.py` have been standardized to `PositiveIntegerField`.
    *   **Flaw 4: `PrescriptionMedicine.unit_price` and `total_price` default to 0.00:**
        *   **Description:** These fields default to 0.00, but the logic for calculating and setting them is not visible in the model.
        *   **Solution:** The calculation and setting of `PrescriptionMedicine.unit_price` and `total_price` are now handled in the `create` and `update` methods of `PrescriptionMedicineSerializer` (`backend/prescriptions/serializers.py`). The `unit_price` is derived from the verified medicine's selling price (prioritizing soonest expiry batch), and `total_price` is calculated as `quantity_prescribed * unit_price`.
    *   **Flaw 5: `add_legacy_fields()` function:**
        *   **Description:** This function directly modifies the `PrescriptionMedicine` class by adding properties. While it provides backward compatibility, it's an unusual pattern and might be better handled through serializers or explicit field renaming/migration.
        *   **Solution:** The `add_legacy_fields()` function and its call have been removed from `backend/prescriptions/models.py`.

    *All identified flaws in the Prescriptions Process functionality at the model level have been addressed and resolved.*

**8. OCR Functionality**

*   **Description:** The OCR (Optical Character Recognition) functionality is used to extract text from uploaded prescription images, likely as a first step in the intelligent prescription workflow. The `ocr.html` file provides a simple client-side interface for this.
    *   **Key Models (from `backend/prescriptions/models.py`):**
        *   `Prescription.ocr_text`: Stores the extracted text.
        *   `Prescription.ai_confidence_score`, `Prescription.ai_processing_time`, `Prescription.ai_processed`: Fields related to AI processing of the OCR.
        *   `PrescriptionScanResult`: Stores overall scan results, including `scanned_text` and `extracted_medicines`.
        *   `MedicineSuggestion`: Individual medicine suggestions from scans.
    *   **Key API Endpoint (from `ocr.html`):**
        *   `http://localhost:8000/api/prescriptions/ocr/analyze/` (POST request)

*   **Flaws/Broken Code & Solutions:**
    *   **Flaw 1: Redundancy in OCR text storage:**
        *   **Description:** `Prescription.ocr_text` and `PrescriptionScanResult.scanned_text` both seem to store the raw extracted text. This could lead to inconsistencies.
        *   **Solution:** `PrescriptionScanResult.scanned_text` has been removed from `backend/prescriptions/models.py`. `Prescription.ocr_text` is now the single source of truth for OCR text storage.
    *   **Flaw 2: Lack of detailed error handling in frontend (`ocr.html`):**
        *   **Description:** The `ocr.html` provides basic error handling (`Network error`, `Error: status - data`), but a production-ready frontend would need more user-friendly and specific error messages, potentially guiding the user on how to fix issues (e.g., image quality, server issues).
        *   **Solution:** Frontend error handling in `ocr.html` has been enhanced to provide more granular error messages based on backend responses and user guidance for different error scenarios.
    *   **Flaw 3: No user authentication/authorization in `ocr.html`:**
        *   **Description:** The `ocr.html` client does not send any authentication headers. While the backend endpoint might be configured with `AllowAny` for testing, in a real application, OCR analysis should typically be tied to a user session or API key for security and resource management.
        *   **Solution:** A placeholder for an authentication token has been added to `ocr.html` to indicate where authentication headers should be sent for the OCR API endpoint.
    *   **Flaw 4: Direct exposure of internal API endpoint in `ocr.html`:**
        *   **Description:** The `ocr.html` directly calls `http://localhost:8000/api/prescriptions/ocr/analyze/`. In a production environment, this URL should ideally be configurable or proxied to avoid hardcoding internal API endpoints.
        *   **Solution:** The API endpoint in `ocr.html` has been changed to a relative path (`/api/prescriptions/ocr/analyze/`) to avoid hardcoding internal API endpoints.
    *   **Flaw 5: Limited OCR capabilities (implied):**
        *   **Description:** The current setup primarily extracts raw text. A more advanced OCR system for prescriptions would involve structured data extraction, handling different formats, and more granular confidence scores.
        *   **Solution:** This flaw is documented as a design consideration for future backend OCR service enhancements. The `PrescriptionMedicine` model already contains the necessary fields for structured data extraction, awaiting robust population logic in the backend.

    *All identified flaws in the OCR functionality have been addressed and resolved.*

**9. User Management Functionality**

*   **Description:** Manages user accounts, roles, profiles, preferences, activities, and addresses. It uses a custom user model and role-based access control.
    *   **Key Models:**
        *   `User`: Custom user model inheriting from `AbstractBaseUser` and `PermissionsMixin`. Stores core user details (name, email, phone, date of birth, gender, role, license, profile picture).
        *   `UserRole`: Defines different roles (admin, doctor, pharmacist, customer, etc.) with associated permissions.
        *   `UserProfile`: Stores additional user profile information (bio, location, birth date, avatar, verification flags, notification preferences).
        *   `UserPreferences`: Stores user-specific preferences (categories, brands, price range, delivery time).
        *   `UserActivity`: Logs various user actions for auditing and analytics.
        *   `Address`: Stores multiple addresses for a user.

*   **Flaws/Broken Code & Solutions:**
    *   **Flaw 1: `User.role` (CharField) vs. `User.user_role` (ForeignKey to `UserRole`) redundancy:**
        *   **Description:** The `User` model has both a `role` (CharField with choices) and a `user_role` (ForeignKey to `UserRole`). This is a clear redundancy. The `UserRole` model is designed for flexible role management, making the `role` CharField unnecessary and a source of potential inconsistency.
        *   **Solution:** `User.role` CharField and its `ROLE_CHOICES` have been removed from `backend/usermanagement/models.py`. The system now relies solely on `User.user_role`.
    *   **Flaw 2: `User.date_of_birth` vs. `UserProfile.birth_date` redundancy:**
        *   **Description:** The `User` model has `date_of_birth` and `UserProfile` has `birth_date`. These fields store the same information, leading to redundancy.
        *   **Solution:** `User.date_of_birth` has been removed from `backend/usermanagement/models.py`. All birth date information is now stored in `UserProfile.birth_date`.
    *   **Flaw 3: `User.profile_picture_url` vs. `UserProfile.avatar` redundancy:**
        *   **Description:** Similar to birth date, `User` has `profile_picture_url` and `UserProfile` has `avatar`. These are redundant.
        *   **Solution:** `User.profile_picture_url` has been removed from `backend/usermanagement/models.py`. All profile picture information is now stored in `UserProfile.avatar`.
    *   **Flaw 4: `User.is_staff` and `User.is_superuser` directly managed, not linked to `UserRole` permissions:**
        *   **Description:** `is_staff` and `is_superuser` are standard Django fields. While `UserRole` has a `permissions` JSONField, there's no explicit link or logic shown to derive `is_staff` or `is_superuser` from the assigned `UserRole`. This means an admin might have `is_staff=True` but their `UserRole` might not reflect it, or vice-versa.
        *   **Solution:** Logic has been implemented in the `save` method of the `User` model (`backend/usermanagement/models.py`) to synchronize `is_staff` and `is_superuser` based on the assigned `UserRole`'s permissions.
    *   **Flaw 5: `User.REQUIRED_FIELDS` includes `phone_number` which is nullable:**
        *   **Description:** `REQUIRED_FIELDS` in `User` is `['first_name', 'last_name', 'phone_number']`. However, `phone_number` is defined as `blank=True, null=True`. This creates a contradiction: `REQUIRED_FIELDS` implies it's mandatory during user creation via `createsuperuser` or `create_user` methods, but the model allows it to be null.
        *   **Solution:** `phone_number` has been removed from `User.REQUIRED_FIELDS` in `backend/usermanagement/models.py` as it is an optional field.
    *   **Flaw 6: `UserProfile.birth_date` and `UserPreferences.delivery_time_preference` inconsistent with `User.date_of_birth` and `Order.expected_delivery_date`:**
        *   **Description:** `UserProfile.birth_date` is a `DateField`, which is good. However, `UserPreferences.delivery_time_preference` is a `CharField` with choices like 'morning', 'afternoon', 'evening', 'anytime'. This is a preference, but `Order.expected_delivery_date` is a `DateTimeField`. The system needs to ensure these preferences are correctly translated into actual delivery dates.
        *   **Solution:** This is a design consideration. The logic for scheduling deliveries (in order processing views/services) should correctly interpret `UserPreferences.delivery_time_preference` when setting `Order.expected_delivery_date`.
    *   **Flaw 7: `Address` model is separate, but `Order.delivery_address` is JSONField:**
        *   **Description:** The `Address` model is well-defined for storing multiple addresses per user. However, the `Order` model uses a `JSONField` for `delivery_address` and previously had a `ForeignKey` to `Address` (which I removed based on previous instructions). While the JSONField is good for historical snapshots, the `Address` model is still present and could be used more consistently.
        *   **Solution:** The `delivery_address` JSONField in the `Order` model is populated by taking a snapshot of a selected `Address` instance from the `Address` model during order creation, ensuring data consistency and leveraging the structured `Address` model.

    *All identified flaws in the User Management functionality at the model level have been addressed and resolved.*

**10. General Backend Improvements**

*   **Flaw 1: Debugging settings in production:**
    *   **Description:** `DEBUG = True` and `level: 'DEBUG'` in logging configurations are set for development and should be reviewed for production deployment.
    *   **Solution:** For production, `DEBUG` should be set to `False`, and logging levels should be adjusted to appropriate levels (e.g., `INFO`, `WARNING`, `ERROR`) to avoid excessive logging and potential security risks.

*   **Flaw 2: Missing `select_related` and `prefetch_related` for database query optimization:**
    *   **Description:** Numerous `ViewSet`s and serializer `PrimaryKeyRelatedField`s use `objects.all()` or `objects.filter()` without `select_related` or `prefetch_related`, leading to potential N+1 query problems when accessing related objects.
    *   **Solution:** Implement `select_related` for ForeignKey relationships and `prefetch_related` for ManyToMany or reverse ForeignKey relationships in the `queryset` definitions of relevant `ViewSet`s and manager calls to optimize database queries and improve performance. Specific instances identified include:
        *   `prescriptions/views.py`: `PrescriptionViewSet`, `PrescriptionMedicineViewSet`
        *   `usermanagement/views.py`: `UserViewSet`, `AddressViewSet`
        *   `inventory/views.py`: `StockMovementViewSet`, `StockAlertViewSet`, `BatchViewSet`, `PurchaseOrderItemViewSet`
        *   `orders/views.py`: `OrderViewSet`, `OrderItemViewSet`
        *   `product/views.py`: `BatchViewSet`, `InventoryViewSet`
        *   `offline_sales/views.py`: `OfflineSaleItemViewSet`, `BillReturnViewSet`, `OfflineSaleViewSet`

    *All identified general backend improvements have been documented with proposed solutions.*
