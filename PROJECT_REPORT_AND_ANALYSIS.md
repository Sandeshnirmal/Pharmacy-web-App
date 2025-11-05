# Pharmacy Web App: Project Report and Analysis

This report provides a comprehensive overview and analysis of the Pharmacy Web App's backend architecture, focusing on the core modules: Orders, Prescriptions, Products, Offline Sales, and Inventory. It details the data models, serialization logic, API views, and inter-module relationships, along with an assessment of the overall system flow.

## 1. Orders Module Analysis

The `orders` module manages customer orders, their items, tracking, and status history.

### Models:
*   **`Order`**: Represents a customer order.
    *   **Key Fields**: `user` (ForeignKey to `User`), `address` (ForeignKey to `Address`), `order_date`, `total_amount`, `discount_amount`, `shipping_fee`, `payment_method`, `payment_status`, `order_status` (with choices like 'Pending', 'Processing', 'Delivered', 'Cancelled', 'Aborted'), `is_prescription_order`, `prescription_image_url`, `prescription_status` (with choices like 'pending_review', 'verified', 'rejected'), `delivery_method`, `expected_delivery_date`, `notes`, `delivery_address` (JSONField), `tracking_number`.
    *   **Workflow**: Supports various payment and order statuses, including a detailed flow for prescription orders.
*   **`OrderItem`**: Represents individual products within an `Order`.
    *   **Key Fields**: `order` (ForeignKey to `Order`), `product` (ForeignKey to `Product`), `quantity`, `product_unit` (ForeignKey to `ProductUnit`), `unit_price_at_order`, `prescription_detail` (ForeignKey to `PrescriptionMedicine`), `batch` (ForeignKey to `Batch`).
    *   **Calculated Property**: `total_price` (quantity * unit_price_at_order).
*   **`OrderTracking`**: Provides detailed tracking updates for an `Order`.
    *   **Key Fields**: `order` (ForeignKey to `Order`), `status` (with detailed choices like 'order_placed', 'payment_confirmed', 'out_for_delivery', 'delivered'), `message`, `location`, `estimated_delivery`, `actual_delivery`, `delivery_person_name`, `delivery_person_phone`, `tracking_number`, `notes`, `updated_by` (ForeignKey to `User`).
*   **`OrderStatusHistory`**: Logs all status changes for an `Order`.
    *   **Key Fields**: `order` (ForeignKey to `Order`), `old_status`, `new_status`, `changed_by` (ForeignKey to `User`), `reason`, `timestamp`.

### Serializers:
*   **`OrderItemSerializer`**: Serializes `OrderItem` instances.
    *   **Includes**: Nested `ProductSerializer` and `ProductUnitSerializer` for read-only product details, `batch_number`, `tax_percentage`, `tax_amount` (calculated), `total_price`. Allows `product_unit_id` for write operations.
*   **`OrderSerializer`**: Serializes `Order` instances.
    *   **Includes**: Nested `OrderItemSerializer` (many=True) for order items, `user_name`, `user_email`, `user_phone`, `address_full` (calculated), `prescription_id`, `total_items` (calculated), `total_tax_amount` (calculated). Allows `address` by ID for write operations.

### Views:
*   **`OrderViewSet`**: Provides CRUD operations for `Order`s.
    *   **Permissions**: `IsAuthenticated` (with `JWTAuthentication`).
    *   **Filtering**: By `order_status`, `payment_status`, `is_prescription_order`.
    *   **Admin Access**: Admins can view all orders; regular users only see their own.
    *   **Custom Actions**:
        *   `statistics`: Provides order statistics for admin dashboards (total, pending, processing, delivered, prescription orders, total revenue).
        *   `update_status`: Allows admins to update an order's status, recording changes in `OrderStatusHistory`.
*   **`OrderItemViewSet`**: Provides CRUD operations for `OrderItem`s.
*   **API Functions**:
    *   `get_order_tracking`: Retrieves detailed tracking information for a specific order.
    *   `add_tracking_update`: Allows admins to add new tracking updates, potentially changing the order's status.
    *   `create_paid_order_for_prescription`: Handles creation of paid orders, integrating prescription image upload and stock deduction. It can also update existing pending/aborted orders.
    *   `link_prescription_to_order`: Links an uploaded prescription to a paid order.
    *   `verify_prescription_and_confirm_order`: Admin action to verify a prescription and confirm the order.
    *   `get_orders_for_prescription_review`: Admin endpoint to list orders awaiting prescription verification.
    *   `get_paid_orders_awaiting_prescription`: Lists paid orders waiting for prescription upload (for both users and admins).
    *   `get_order_status_history`: Retrieves the status change history for an order.
    *   `get_user_pending_order`: Fetches the most recent pending order for the authenticated user.
    *   `create_pending_order`: Creates a pending order, handling existing pending orders (re-use or abort) and prescription image upload.
    *   `confirm_prescription_order`: Confirms a prescription order after verification.
    *   `deduct_inventory_from_batches`: Helper function to deduct product quantities from batches, prioritizing earliest expiry dates, and recording `StockMovement`.

### Relationships and Flow:
The `orders` module is central, linking `User`, `Address`, `Product`, `Batch`, and `Prescription` models. The enhanced order flow (`create_paid_order_for_prescription`, `link_prescription_to_order`, `verify_prescription_and_confirm_order`) demonstrates a robust process for handling prescription-based orders, from payment to verification and fulfillment. Stock deduction is integrated directly into the order creation/update process, ensuring inventory accuracy.

## 2. Prescriptions Module Analysis

The `prescriptions` module manages prescription uploads, OCR processing, medicine mapping, and workflow.

### Models:
*   **`Prescription`**: Stores details of an uploaded prescription.
    *   **Key Fields**: `id` (UUID), `prescription_number`, `patient_name`, `doctor_name`, `prescription_date`, `status` (detailed workflow: 'uploaded', 'ai_processing', 'ai_mapped', 'pending_verification', 'verified', 'rejected', etc.), `verification_status` (legacy), `image_url`, `image_file`, `ocr_text`, `ai_confidence_score`, `ai_processed`, `rejection_reason`, `clarification_notes`, `pharmacist_notes`, `verification_notes`, `user` (ForeignKey to `User`), `verified_by_admin` (ForeignKey to `User`), `upload_date`, `verification_date`.
*   **`PrescriptionMedicine`**: Stores individual medicine details extracted from a `Prescription`.
    *   **Key Fields**: `id` (UUID), `prescription` (ForeignKey to `Prescription`), `extracted_medicine_name`, `extracted_dosage`, `extracted_frequency`, `extracted_duration`, `extracted_quantity`, `extracted_instructions`, `extracted_form`, `suggested_medicine` (ForeignKey to `Product`), `suggested_products` (ManyToManyField to `Product`), `ai_confidence_score`, `verification_status` ('pending', 'verified', 'rejected'), `verified_medicine` (ForeignKey to `Product`), `quantity_prescribed`, `quantity_dispensed`, `unit_price`, `total_price`, `is_valid_for_order`, `customer_approved`, `pharmacist_comment`, `clarification_notes`, `verified_by` (ForeignKey to `User`).
*   **`PrescriptionWorkflowLog`**: Audit trail for `Prescription` status changes.
*   **`PrescriptionScanResult`**: Stores general scan results for medicine suggestions.
*   **`MedicineSuggestion`**: Stores individual medicine suggestions from scans.

### OCR Flow (as per `ORDER_FLOW_REPORT.md`):
1.  **Asynchronous AI/OCR Flow (Primary Mobile Application Flow)**:
    *   **Mobile App**: `PrescriptionScanFlowScreen.dart` uploads image to `/api/prescriptions/mobile/upload/`. Polls status via `/api/prescriptions/mobile/status/<id>/`. Fetches suggestions via `/api/prescriptions/mobile/suggestions/<id>/`.
    *   **Backend**: `mobile_api.py` receives image, creates `Prescription` record (`status='pending_ocr'`), and triggers `process_prescription_ocr_task.delay()` (Celery task).
    *   **Celery Task (`tasks.py`)**: `process_prescription_ocr_task` uses `OCRService` to:
        *   `extract_text_from_prescription` (Google Gemini AI).
        *   `match_medicines_by_composition` (matches extracted data to local `Product` database).
    *   **Updates**: `Prescription` record is updated (`ai_processed=True`, `status='pending_verification'`). `PrescriptionMedicine` entries are created. `PrescriptionWorkflowLog` records changes.
2.  **Synchronous OCR Analysis Flow (Web Test / Alternative Mobile Flow)**:
    *   `ocr.html` or `PrescriptionCameraScreen.dart` sends base64 image to `/api/prescriptions/ocr/analyze/` for immediate, synchronous OCR analysis.
3.  **Simple Upload for Manual Verification (Non-OCR Flow)**:
    *   `OrderPrescriptionUploadScreen.dart` uploads image to `/api/prescriptions/upload-for-order/` or `/api/prescriptions/upload-for-paid-order/`.
    *   Backend creates `Prescription` record with `ai_processed=False`, `status='pending_verification'`, intended for manual review.

### Relationships and Flow:
The `prescriptions` module is critical for handling medicine orders requiring a prescription. It leverages AI for efficient processing and mapping, while also providing manual verification options. The detailed workflow statuses and audit logs ensure transparency and accountability in prescription handling. `PrescriptionMedicine` links directly to `Product` for suggested and verified medicines, facilitating order creation.

## 3. Products Module Analysis

The `product` module defines the core product catalog, including compositions, categories, units, and pricing.

### Models:
*   **`Composition`**: Represents active ingredients of medicines.
    *   **Key Fields**: `name`, `scientific_name`, `description`, `category`, `side_effects`, `contraindications`, `aliases`, `therapeutic_class`, `mechanism_of_action`, `is_active`.
*   **`ProductUnit`**: Defines units of measure and conversion factors (e.g., 'Tablet' to 'Milligram').
    *   **Key Fields**: `unit_name`, `unit_abbreviation`, `base_unit_name`, `base_unit_abbreviation`, `conversion_factor`.
*   **`GenericName`**: Stores generic names for products.
*   **`Category`**: Organizes products into categories.
*   **`Product`**: Represents a medicine or product.
    *   **Key Fields**: `name`, `brand_name`, `generic_name` (ForeignKey), `manufacturer`, `medicine_type`, `prescription_type` ('otc', 'prescription', 'controlled'), `form`, `min_stock_level`, `dosage_form`, `pack_size`, `product_unit` (ForeignKey to `ProductUnit`), `description`, `uses`, `side_effects`, `how_to_use`, `precautions`, `storage`, `compositions` (ManyToManyField through `ProductComposition`), `image_url`, `hsn_code`, `category` (ForeignKey), `is_active`, `is_featured`.
    *   **Properties**: `stock_quantity` (calculated from batches), `get_default_batch`.
*   **`ProductComposition`**: Links `Product` to `Composition` with strength details.
*   **`Batch`**: Manages specific batches of a `Product` with inventory and pricing details.
    *   **Key Fields**: `product` (ForeignKey), `batch_number`, `manufacturing_date`, `expiry_date`, `quantity` (total), `current_quantity`, `cost_price`, `tax_percentage`.
    *   **Pricing**: `selling_price`, `mrp_price`, `discount_percentage` (generic); `online_mrp_price`, `online_discount_percentage`, `online_selling_price`; `offline_mrp_price`, `offline_discount_percentage`, `offline_selling_price`.
    *   **Methods**: `save()` method calculates selling prices based on MRP and discount percentages.
*   **`Inventory`**: (Legacy/Simplified) Stores product quantity on hand and reorder points. (Note: `Batch.current_quantity` is the primary stock tracking).
*   **`ProductReview`**: Customer reviews for products.
*   **`ProductImage`**: Images associated with products.
*   **`Wishlist`**: User wishlists.
*   **`ProductTag`, `ProductTagAssignment`**: Tagging system for products.
*   **`ProductViewHistory`**: Tracks user product views.
*   **`Discount`**: Defines product-specific or category-specific discounts.
    *   **Key Fields**: `name`, `percentage`, `target_type` ('product', 'category'), `product` (ForeignKey), `category` (ForeignKey), `start_date`, `end_date`, `is_active`.

### Relationships and Flow:
The `product` module forms the backbone of the pharmacy's offerings. `Product`s are linked to `Composition`s, `Category`s, and `ProductUnit`s. `Batch`es are crucial for managing inventory, expiry dates, and channel-specific pricing. The `Discount` model allows for flexible pricing strategies. The `stock_quantity` property on `Product` aggregates stock from all active batches, providing a unified view of availability.

## 4. Offline Sales Module Analysis

The `offline_sales` module handles sales transactions made directly at the pharmacy, including customer management and returns.

### Models:
*   **`OfflineCustomer`**: Stores details of customers for offline sales.
    *   **Key Fields**: `name`, `phone_number` (unique), `address`.
*   **`OfflineSale`**: Represents an offline sales transaction.
    *   **Key Fields**: `customer` (ForeignKey to `OfflineCustomer`), `customer_name`, `customer_phone`, `customer_address` (denormalized for flexibility), `sale_date`, `total_amount`, `paid_amount`, `change_amount`, `payment_method`, `created_by` (ForeignKey to `User`), `updated_by` (ForeignKey to `User`), `status` ('PENDING', 'PAID', 'CANCELLED', 'RETURNED', 'PARTIALLY_RETURNED'), `tag` ('OFFLINE', 'ONLINE'), `last_status_update_date`, `cancellation_reason`, `notes`.
*   **`OfflineSaleItem`**: Individual products sold in an `OfflineSale`.
    *   **Key Fields**: `sale` (ForeignKey to `OfflineSale`), `product` (ForeignKey to `Product`), `batch` (ForeignKey to `Batch`), `quantity`, `product_unit` (ForeignKey to `ProductUnit`), `price_per_unit`, `discount_percentage`, `discount_amount`, `subtotal`.
*   **`BillReturn`**: Manages returns for `OfflineSale`s.
    *   **Key Fields**: `sale` (ForeignKey to `OfflineSale`), `return_date`, `total_return_amount`, `reason`, `notes`, `status` ('PENDING', 'PROCESSED', 'CANCELLED'), `returned_by` (ForeignKey to `User`).
*   **`BillReturnItem`**: Individual items returned in a `BillReturn`.
    *   **Key Fields**: `bill_return` (ForeignKey to `BillReturn`), `offline_sale_item` (ForeignKey to `OfflineSaleItem`), `returned_quantity`, `price_per_unit`, `subtotal`.

### Serializers:
*   **`OfflineCustomerSerializer`**: Serializes `OfflineCustomer`.
*   **`OfflineSaleItemSerializer`**: Serializes `OfflineSaleItem`, including nested `ProductSerializer` and `BatchSerializer`.
*   **`OfflineSaleSerializer`**: Serializes `OfflineSale`.
    *   **Includes**: Nested `OfflineSaleItemSerializer` (many=True), `created_by_username`, `customer_details`.
    *   **`create()` method**: Handles discount application (batch-level, product-level, category-level), calculates `total_amount`, `change_amount`, sets `status`, and performs stock deduction with `StockMovement` creation.
    *   **`update()` method**: Manages status changes (e.g., 'CANCELLED', 'RETURNED'), reverses stock for cancelled/updated items, and re-calculates totals.
*   **`BillReturnItemSerializer`**: Serializes `BillReturnItem`.
*   **`BillReturnSerializer`**: Serializes `BillReturn`.
    *   **Includes**: Nested `BillReturnItemSerializer` (many=True), `returned_by_username`.
    *   **`create()` method**: Sets return status to 'PROCESSED', calculates `total_return_amount`, performs stock increment for returned items with `StockMovement` creation, and updates the parent `OfflineSale`'s status ('RETURNED' or 'PARTIALLY_RETURNED').

### Views:
*   **`OfflineSaleViewSet`**: Provides CRUD for `OfflineSale`s.
    *   **Permissions**: `IsAuthenticated`.
    *   **Filtering**: By `sale_date`, `customer_name`, `customer_phone`, `payment_method`.
    *   **Custom Actions**:
        *   `cancel_bill`: Marks an offline sale as 'CANCELLED', requiring a reason.
        *   `generate_bill_pdf`: Generates a PDF bill for an offline sale.
*   **`BillReturnViewSet`**: Provides CRUD for `BillReturn`s.
*   **`OfflineCustomerViewSet`**: Provides CRUD for `OfflineCustomer`s.
    *   **Custom Actions**: `search_by_phone`, `find_or_create_customer`.

### Relationships and Flow:
The `offline_sales` module provides a complete POS-like system. It manages customer information, sales transactions, item-level details, and a robust return process. Discount logic is applied during sale creation, and stock movements are meticulously recorded for both sales and returns, ensuring accurate inventory tracking.

## 5. Inventory Module Analysis

The `inventory` module manages stock levels, movements, alerts, suppliers, and purchase orders/returns.

### Models:
*   **`StockMovement`**: Records all changes in stock quantity.
    *   **Key Fields**: `product` (ForeignKey), `batch` (ForeignKey), `movement_type` ('IN', 'OUT', 'ADJUSTMENT', 'EXPIRED', 'DAMAGED', 'SUPPLIER_RETURN'), `quantity`, `product_unit` (ForeignKey to `ProductUnit`), `reference_number`, `notes`, `created_by` (ForeignKey to `User`).
*   **`StockAlert`**: Generates alerts for low stock, out of stock, or expiring/expired batches.
    *   **Key Fields**: `product` (ForeignKey), `batch` (ForeignKey), `alert_type` ('LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRING_SOON', 'EXPIRED'), `message`, `is_resolved`, `resolved_by` (ForeignKey to `User`), `resolved_at`.
*   **`Supplier`**: Stores supplier information.
*   **`PurchaseOrder`**: Represents an order placed with a supplier.
    *   **Key Fields**: `supplier` (ForeignKey), `invoice_number`, `invoice_date`, `order_date`, `total_amount`, `status` ('PENDING', 'ORDERED', 'RECEIVED', 'CANCELLED'), `created_by` (ForeignKey to `User`), `updated_by` (ForeignKey to `User`), `notes`.
*   **`PurchaseOrderItem`**: Individual products within a `PurchaseOrder`.
    *   **Key Fields**: `purchase_order` (ForeignKey), `product` (ForeignKey), `quantity`, `product_unit` (ForeignKey to `ProductUnit`), `unit_price`, `discount_percentage`, `tax_percentage`, `subtotal`, `received_quantity`, `returned_quantity`, `batch_number`, `expiry_date`.
*   **`PurchaseReturn`**: Manages returns to suppliers.
    *   **Key Fields**: `purchase_order` (ForeignKey), `return_date`, `total_amount`, `reason`, `notes`, `status` ('PENDING', 'PROCESSED', 'CANCELLED'), `created_by` (ForeignKey to `User`), `updated_by` (ForeignKey to `User`).
*   **`PurchaseReturnItem`**: Individual items returned in a `PurchaseReturn`.
    *   **Key Fields**: `purchase_return` (ForeignKey), `purchase_order_item` (ForeignKey), `product` (ForeignKey), `quantity`, `unit_price`, `batch_number`, `expiry_date`.

### Serializers:
*   **`StockMovementSerializer`**: Serializes `StockMovement`.
*   **`StockAlertSerializer`**: Serializes `StockAlert`.
*   **`SupplierSerializer`**: Serializes `Supplier`.
*   **`BatchCreateSerializer`**: Used for creating `Batch`es, automatically creating an 'IN' `StockMovement`.
*   **`InventoryStatsSerializer`**: Serializes inventory statistics.
*   **`PurchaseOrderItemSerializer`**: Serializes `PurchaseOrderItem`, including `ProductSearchSerializer` for product details.
*   **`PurchaseReturnItemSerializer`**: Serializes `PurchaseReturnItem`.
*   **`PurchaseReturnSerializer`**: Serializes `PurchaseReturn`.
    *   **`create()` method**: Handles creation of return items, updates `returned_quantity` in `PurchaseOrderItem`, and performs stock deduction with `StockMovement` creation.
    *   **`update()` method**: Manages updates to return items, including stock adjustments and reversals.
*   **`PurchaseOrderSerializer`**: Serializes `PurchaseOrder`.
    *   **`validate()` method**: Ensures `invoice_number` and `invoice_date` are present if status is 'RECEIVED'.
    *   **`create()` method**: Creates `PurchaseOrderItem`s, finds/creates `Batch`es, updates batch quantities, and creates 'IN' `StockMovement` records.
    *   **`update()` method**: Handles updates to purchase order items, including reversing old stock movements if status was 'RECEIVED' and applying new stock movements if the new status is 'RECEIVED'.

### Views:
*   **`StockMovementViewSet`**: Provides CRUD for `StockMovement`s.
*   **`StockAlertViewSet`**: Provides CRUD for `StockAlert`s, with an action to `resolve` alerts.
*   **`SupplierViewSet`**: Provides CRUD for `Supplier`s.
*   **`BatchViewSet`**: Provides CRUD for `Batch`es.
    *   **Custom Actions**: `expiring_soon`, `expired`, `stats` (for inventory statistics).
*   **`PurchaseOrderViewSet`**: Provides CRUD for `PurchaseOrder`s.
    *   **Custom Actions**:
        *   `receive_items`: Marks items as received, updates batch quantities, and creates 'IN' `StockMovement` records.
        *   `return_items`: Initiates a return for items from a purchase order, creating `PurchaseReturn` and `PurchaseReturnItem` records, updating `returned_quantity` in `PurchaseOrderItem`, and performing stock deduction with `StockMovement` creation.
*   **`PurchaseReturnViewSet`**: Provides CRUD for `PurchaseReturn`s.
*   **`PurchaseOrderItemViewSet`**: Provides CRUD for `PurchaseOrderItem`s.

### Relationships and Flow:
The `inventory` module is crucial for supply chain management. `PurchaseOrder`s track incoming stock from `Supplier`s, which then updates `Batch` quantities. `StockMovement` provides a detailed audit trail for all inventory changes, including those from `OfflineSale`s and `PurchaseReturn`s. `StockAlert`s proactively notify staff about critical stock situations. The module ensures that inventory levels are accurately reflected across the system.

## 6. User Management (Relevant Parts)

The `usermanagement` module provides core user and address functionalities, which are integrated into other modules.

### Models:
*   **`User`**: Custom user model with `email` as `USERNAME_FIELD`, `first_name`, `last_name`, `phone_number`, `user_role` (ForeignKey to `UserRole`), `is_staff`, `is_superuser`.
*   **`Address`**: Stores user addresses.
    *   **Key Fields**: `user` (ForeignKey to `User`), `address_line1`, `address_line2`, `city`, `state`, `pincode`, `address_type`, `is_default`.

### Integration:
*   `Order` and `OfflineSale` models link to `User` for tracking who placed/created the order/sale.
*   `Order` models link to `Address` for delivery information.
*   `StockMovement`, `StockAlert`, `PurchaseOrder`, `PurchaseReturn`, `OfflineSale`, `BillReturn`, `Prescription` models all link to `User` for audit and responsibility tracking.

## 7. Overall System Flow and Relationships

The Pharmacy Web App demonstrates a well-integrated system for managing a pharmacy's operations:

*   **Product Lifecycle**: `Product`s are defined with `Composition`s, `Category`s, and `ProductUnit`s. `Batch`es track specific stock, expiry, and channel-specific pricing.
*   **Inventory Management**: `Supplier`s provide `PurchaseOrder`s, which update `Batch` quantities and generate `StockMovement` records. `PurchaseReturn`s handle returns to suppliers, reversing stock. `StockAlert`s ensure proactive inventory management.
*   **Sales Channels**:
    *   **Online Orders**: Handled by the `orders` module, supporting both regular and complex prescription-based orders. Prescription orders involve AI/OCR processing, verification, and integrated stock deduction.
    *   **Offline Sales**: Managed by the `offline_sales` module, including `OfflineCustomer` management, flexible discount application, and immediate stock deduction. `BillReturn`s handle customer returns.
*   **Prescription Workflow**: A sophisticated system for handling prescriptions, from mobile app upload and AI processing to pharmacist verification and order fulfillment.
*   **User Integration**: The `User` model is central to all modules, providing authentication, authorization (via `UserRole`), and audit trails for actions across the system. `Address` is crucial for delivery.
*   **Audit Trails**: `StockMovement`, `OrderStatusHistory`, `PrescriptionWorkflowLog` provide comprehensive audit trails for critical business processes.

## 8. Key Strengths and Areas for Improvement

### Strengths:
*   **Comprehensive Module Design**: The project is well-structured into logical modules (orders, prescriptions, products, offline sales, inventory, usermanagement), each with clear responsibilities.
*   **Robust Prescription Workflow**: The integration of AI/OCR for prescription processing, along with asynchronous tasks (Celery), multiple verification statuses, and audit logs, is a significant strength.
*   **Detailed Inventory Management**: The use of `Batch`es for granular stock tracking, `StockMovement` for audit trails, and `PurchaseOrder`/`PurchaseReturn` for supply chain management ensures high accuracy.
*   **Flexible Pricing and Discounts**: Channel-specific pricing in `Batch` and the `Discount` model allow for dynamic pricing strategies.
*   **Atomic Transactions**: Use of `@transaction.atomic` in critical views (e.g., `create_paid_order_for_prescription`, `return_items` in `PurchaseOrderViewSet`) ensures data consistency.
*   **Denormalization for Performance**: Fields like `customer_name`, `customer_phone`, `customer_address` in `OfflineSale` provide quick access without extra joins, potentially improving read performance for sales reports.
*   **Clear API Documentation**: The `API_DOCUMENTATION.md` provides a good starting point for understanding the endpoints.

### Areas for Improvement:
*   **Consistency in Unit Handling**: While `ProductUnit` is introduced, its consistent application across all stock-related operations (e.g., `StockMovement.quantity`, `Batch.quantity`, `OrderItem.quantity`, `OfflineSaleItem.quantity`, `PurchaseOrderItem.quantity`) needs careful review to ensure all quantities are correctly converted to/from base units for calculations and storage. The `deduct_inventory_from_batches` and `OfflineSaleSerializer`'s `create` method show good examples of this, but it should be verified across all relevant operations.
*   **Error Handling and Logging**: While `logger.error` and `logger.exception` are used, a more standardized and comprehensive error handling strategy (e.g., custom exception classes, centralized error reporting) could be beneficial.
*   **Performance Optimization**: For large datasets, further optimization might be needed, especially for complex queries involving `Sum`, `Count`, and `F` expressions. `select_related` and `prefetch_related` are used, which is good, but could be expanded.
*   **Security Review**: Ensure all endpoints have appropriate permissions. The `OfflineCustomerViewSet` temporarily uses `AllowAny`, which should be restricted in production.
*   **Test Coverage**: The `API_DOCUMENTATION.md` includes test cases, but actual unit and integration tests would be crucial to ensure the correctness and robustness of the complex business logic, especially around stock movements and pricing.
*   **Frontend Integration Clarity**: While the `ORDER_FLOW_REPORT.md` details mobile app interactions, a clearer mapping of frontend actions to backend API calls and expected data flows would be beneficial for full-stack development.
*   **Scalability of AI/OCR**: While Celery handles asynchronous processing, the scalability of the Google Gemini AI integration itself (rate limits, cost, latency) should be monitored and potentially optimized for high-volume usage.
*   **Data Archiving/Purging**: For `PrescriptionScanResult` and `MedicineSuggestion` models, consider a strategy for archiving or purging old data to manage database size, especially if many scans are performed.
*   **Reporting and Analytics**: While basic statistics are available, a dedicated reporting module or integration with a BI tool could provide deeper insights into sales, inventory, and prescription trends.

This report provides a solid foundation for understanding the Pharmacy Web App's backend. The system is designed to handle complex pharmacy operations with a focus on inventory accuracy, order fulfillment, and prescription management.
