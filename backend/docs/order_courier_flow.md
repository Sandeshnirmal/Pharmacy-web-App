# Overall Order and Courier Flow

This document outlines the end-to-end flow for orders, including payment, prescription handling, and courier integration, along with various test cases. The primary flow described here is the "Enhanced Order Flow" which prioritizes payment first.

## I. Core Components

The system is built using Django REST Framework and integrates with an external TPC Courier Service.

1.  **`Order` Model (`backend/orders/models.py`):**
    *   Central model for customer orders.
    *   Tracks `order_status` (e.g., 'Pending', 'payment_completed', 'verified', 'Shipped', 'Delivered', 'Cancelled', 'Aborted').
    *   Manages `payment_status` (e.g., 'Pending', 'Paid', 'Refunded', 'Aborted').
    *   Includes fields for prescription handling (`is_prescription_order`, `prescription_image_base64`, `prescription_status`).
    *   Contains `tracking_number` for courier integration.

2.  **`OrderItem` Model (`backend/orders/models.py`):**
    *   Represents individual products within an `Order`.

3.  **`OrderTracking` Model (`backend/orders/models.py`):**
    *   Provides detailed, granular tracking updates for an order's journey.

4.  **`OrderStatusHistory` Model (`backend/orders/models.py`):**
    *   Logs every status change of an `Order` for auditing and traceability.

5.  **`Prescription` Model (from `prescriptions.models` - referenced):**
    *   Stores prescription details, linked to a user and an order.

6.  **`CourierShipment` Model (`backend/courier/models.py`):**
    *   Stores details of a shipment created with the external TPC courier service.
    *   Linked to an `Order` via a OneToOneField.
    *   Contains `tracking_number`, `tpc_order_id`, `status`, `pickup_address`, `delivery_address`, and raw `tpc_response`.

7.  **`TPCCourierService` (`backend/courier/services.py`):**
    *   Encapsulates all direct interactions with the external TPC Courier API.
    *   Handles API calls for creating shipments, cancelling, tracking, checking serviceability, etc.
    *   Uses `TPCPickupRequestSerializer` and `TPCCODBookingSerializer` for TPC-specific data formatting.

8.  **`EnhancedOrderFlow` (`backend/orders/enhanced_order_flow.py`):**
    *   Orchestrates the multi-step order process: Payment First → Prescription Upload → Verification → Confirmation → Courier Pickup.
    *   Contains static methods for each major step.

9.  **`OrderViewSet` (`backend/orders/views.py`):**
    *   Provides RESTful endpoints for managing `Order` objects, including filtering and status updates.
    *   Includes custom actions for order statistics.

10. **Invoice Models & Service (`backend/orders/invoice_service.py`, `backend/orders/invoice_views.py`):**
    *   `Invoice` and `InvoiceItem` models for billing.
    *   `InvoiceService` handles creation, marking as paid, and PDF generation.
    *   API endpoints for creating, retrieving, and downloading invoices.

## II. Overall Order and Courier Flow (Enhanced Flow)

The flow is designed for a "Payment First" approach, especially for prescription orders.

### A. Initial Order Creation (Pre-Payment)

1.  **User adds items to cart.**
2.  **User proceeds to checkout.**
3.  **API Call:** `POST /api/order/create-pending-order/` (from `orders/views.py`)
    *   **Purpose:** Creates a temporary `Order` with `order_status='Pending'` and `payment_status='Pending'`.
    *   **Logic:**
        *   Validates items and delivery address.
        *   Checks for an existing pending order with the same cart items. If found, it re-uses it.
        *   If cart items differ, the old pending order is `Aborted`, and a new one is created.
        *   `OrderStatusHistory` is recorded.
    *   **Output:** Returns the `order_id` of the pending order.

### B. Payment & Initial Order Confirmation

1.  **User makes payment** (e.g., via Razorpay).
2.  **API Call:** `POST /api/order/create-paid-order-for-prescription/` (from `orders/views.py`, internally uses `EnhancedOrderFlow.create_paid_order_for_prescription_review`)
    *   **Purpose:** Finalizes the order after successful payment.
    *   **Logic:**
        *   Takes `order_id` (from pending order), `items`, `delivery_address`, `payment_data`, and optionally `prescription_image_base64`.
        *   Validates inputs, calculates totals (including shipping/discount).
        *   Updates the pending order (or creates a new one if no pending order was re-used) to `order_status='payment_completed'` and `payment_status='Paid'`.
        *   Sets `is_prescription_order` based on products.
        *   If `is_prescription_order` is true, `prescription_status` is set to `'pending_review'`. Otherwise, it's `'verified'`.
        *   `OrderStatusHistory` is recorded.
        *   **Invoice Creation:** `InvoiceService.create_invoice_for_order` is typically called here (or shortly after) to generate the invoice.
    *   **Output:** Returns the `order_id`, current `status`, `total_amount`, `is_prescription_order`, and `prescription_status`.

### C. Prescription Handling (If `is_prescription_order` is True)

1.  **Customer uploads prescription.** (This might be a separate API call to `prescriptions` module, which then provides a `prescription_id`).
2.  **API Call:** `POST /api/order/{order_id}/link-prescription/` (from `orders/views.py`, internally uses `EnhancedOrderFlow.link_prescription_to_paid_order`)
    *   **Purpose:** Links an uploaded prescription to the `payment_completed` order.
    *   **Logic:**
        *   Requires `order_id` and `prescription_id`.
        *   Changes `order.order_status` to `'prescription_uploaded'`.
        *   Updates the linked `Prescription` object's status to `'pending_verification'`.
        *   `OrderStatusHistory` is recorded.
    *   **Output:** Confirmation of linking, updated order status.

3.  **Admin Review & Verification:**
    *   **API Call:** `GET /api/order/prescription-review/` (from `orders/views.py`, internally uses `EnhancedOrderFlow.get_orders_for_prescription_review`)
        *   **Purpose:** Admin retrieves a list of orders awaiting prescription review.
    *   **API Call:** `POST /api/order/{order_id}/verify-prescription/` (from `orders/views.py`, internally uses `EnhancedOrderFlow.verify_prescription_and_confirm_order`)
        *   **Purpose:** Admin approves or rejects the prescription.
        *   **Logic:**
            *   Requires `order_id`, `approved` (boolean), and `verification_notes`.
            *   If `approved=True`:
                *   `order.order_status` becomes `'verified'`.
                *   `order.prescription.status` becomes `'verified'`.
                *   **Crucially, `EnhancedOrderFlow._schedule_courier_pickup(order)` is called.**
            *   If `approved=False`:
                *   `order.order_status` becomes `'prescription_rejected'`.
                *   `order.prescription.status` becomes `'rejected'`.
                *   Stock for order items might be restored (as seen in `CartService`, though not explicitly in `EnhancedOrderFlow` for rejection).
            *   `OrderStatusHistory` is recorded.
        *   **Output:** Confirmation of verification, updated order status, and `courier_scheduled` status.

### D. Courier Integration & Shipment

1.  **Courier Pickup Scheduling:** (Triggered by `EnhancedOrderFlow._schedule_courier_pickup` after prescription verification or initial order confirmation for non-prescription orders).
    *   **Logic:**
        *   Retrieves `TPCCourierService`.
        *   Prepares `pickup_address` (pharmacy's address) and `delivery_address` (from `order.delivery_address`).
        *   Calculates `total_weight`, `total_pieces`, `declared_value`, `cod_amount` based on order items and payment method.
        *   Constructs TPC-specific `shipment_data` (using `TPCPickupRequestSerializer` or `TPCCODBookingSerializer`).
        *   Calls `courier_service.create_shipment` or `courier_service.create_cod_booking` to the external TPC API.
        *   If successful:
            *   Extracts `tracking_number` and `ref_no` from TPC response.
            *   Creates a `CourierShipment` record in the local database.
            *   Updates `order.order_status` to `'Processing'` (or 'Shipped') and sets `order.tracking_number`.
            *   `OrderStatusHistory` and `CourierShipment.tracking_history` are updated.
        *   If failed: Logs error, returns failure status.

2.  **Shipment Tracking:**
    *   **API Call:** `GET /api/courier/shipments/track/` (from `courier/views.py`)
        *   **Purpose:** Allows users/admins to track a shipment using the `tracking_number`.
        *   **Logic:** Calls `tpc_service.track_shipment` and returns formatted tracking data. Updates `CourierShipment` and `OrderTracking` with the latest status.
    *   **API Call:** `POST /api/order/{order_id}/add-tracking-update/` (Admin only, from `orders/views.py`)
        *   **Purpose:** Admin can manually add tracking updates, which also updates the `Order` status.

3.  **Delivery:**
    *   As tracking updates progress, `order.order_status` eventually changes to `'Delivered'`.

## III. Test Cases

Here are various test cases covering the order and courier flow:

### A. Successful Order Flows

1.  **Standard Order (No Prescription, Paid Online):**
    *   **Steps:**
        1.  User adds non-prescription items to cart.
        2.  `create_pending_order` is called.
        3.  User makes online payment.
        4.  `create_paid_order_for_prescription` is called.
        5.  Order status becomes `payment_completed`. `is_prescription_order` is `False`, `prescription_status` is `verified`.
        6.  `_schedule_courier_pickup` is triggered immediately.
        7.  `CourierShipment` is created, `order.tracking_number` is set, `order.order_status` becomes `Processing`.
        8.  Tracking updates are received/added, `order.order_status` progresses to `Shipped`, then `Delivered`.
    *   **Expected Outcome:** Order successfully created, paid, shipped, and delivered with tracking.

2.  **Prescription Order (Paid Online, Approved):**
    *   **Steps:**
        1.  User adds prescription-required items to cart.
        2.  `create_pending_order` is called.
        3.  User makes online payment.
        4.  `create_paid_order_for_prescription` is called.
        5.  Order status becomes `payment_completed`. `is_prescription_order` is `True`, `prescription_status` is `pending_review`.
        6.  User uploads prescription.
        7.  `link_prescription_to_order` is called. `order.order_status` becomes `prescription_uploaded`.
        8.  Admin reviews and approves prescription via `verify_prescription_and_confirm_order`.
        9.  `order.order_status` becomes `verified`.
        10. `_schedule_courier_pickup` is triggered.
        11. `CourierShipment` is created, `order.tracking_number` is set, `order.order_status` becomes `Processing`.
        12. Tracking updates are received/added, `order.order_status` progresses to `Shipped`, then `Delivered`.
    *   **Expected Outcome:** Prescription order successfully created, paid, verified, shipped, and delivered with tracking.

3.  **COD Order (No Prescription):**
    *   **Steps:**
        1.  User adds non-prescription items to cart.
        2.  `create_pending_order` is called with `payment_method='COD'`.
        3.  `create_paid_order_for_prescription` is called (with `payment_method='COD'`).
        4.  Order status becomes `payment_completed`. `is_prescription_order` is `False`, `prescription_status` is `verified`. `payment_status` is `Pending`.
        5.  `_schedule_courier_pickup` is triggered, calling `create_cod_booking` on TPC service.
        6.  `CourierShipment` is created, `order.tracking_number` is set, `order.order_status` becomes `Processing`.
        7.  Tracking updates are received/added, `order.order_status` progresses to `Shipped`, then `Delivered`.
        8.  Upon delivery, `payment_status` is updated to `Paid` (manual or via webhook).
    *   **Expected Outcome:** COD order successfully created, shipped, delivered, and payment status updated.

### B. Edge Cases & Failure Scenarios

1.  **Insufficient Stock:**
    *   **Steps:** User tries to order more quantity than available in stock.
    *   **Expected Outcome:** `create_pending_order` or `create_paid_order_for_prescription` fails with an "Insufficient stock" error.

2.  **Invalid Delivery Address/Pincode:**
    *   **Steps:** User provides an incomplete or invalid delivery address/pincode.
    *   **Expected Outcome:** `validate_delivery_address` (in `EnhancedOrderFlow` or `CartService`) or `check_pincode_serviceability` (via courier API) fails, returning an error.

3.  **Prescription Order (Paid Online, Rejected):**
    *   **Steps:** (Same as Prescription Order, Paid Online, Approved, up to Admin Review).
        1.  Admin reviews and *rejects* prescription via `verify_prescription_and_confirm_order`.
        2.  `order.order_status` becomes `prescription_rejected`. `order.prescription.status` becomes `rejected`.
        3.  Stock for order items is restored.
        4.  No courier pickup is scheduled.
    *   **Expected Outcome:** Order is marked as rejected, stock is returned, no shipment.

4.  **Courier Service Failure (Shipment Creation):**
    *   **Steps:** `_schedule_courier_pickup` attempts to call TPC API, but the API returns an error (e.g., invalid data, service unavailable).
    *   **Expected Outcome:** `_schedule_courier_pickup` returns `success=False`, `order.order_status` remains `verified` (or previous status), and an error message is logged/returned. Admin might need to manually intervene.

5.  **Order Cancellation (Before Shipment):**
    *   **Steps:** User or Admin cancels an order before it's shipped (e.g., `payment_completed`, `prescription_uploaded`, `verified`).
    *   **Expected Outcome:** `order.order_status` becomes `Cancelled`. If prescription was approved, stock is restored. If courier was booked, `cancel_shipment` on TPC service is called.

6.  **Order Cancellation (After Shipment):**
    *   **Steps:** User or Admin cancels an order after it's shipped (`Processing`, `Shipped`).
    *   **Expected Outcome:** `order.order_status` becomes `Cancelled`. `cancel_shipment` on TPC service is called. Courier might still attempt delivery if cancellation is too late.

7.  **Duplicate Pending Order Handling:**
    *   **Steps:** User creates a pending order, then tries to create another pending order with the *same* cart items.
    *   **Expected Outcome:** The existing pending order is re-used, no new order is created.
    *   **Steps:** User creates a pending order, then tries to create another pending order with *different* cart items.
    *   **Expected Outcome:** The first pending order is `Aborted`, and a new pending order is created.

8.  **Payment Failure/Abortion:**
    *   **Steps:** User initiates payment but it fails or is aborted.
    *   **Expected Outcome:** The pending order remains `Pending` or is marked `Aborted` if the payment gateway explicitly signals an abortion. `create_paid_order_for_prescription` is not called or returns an error.

9.  **Admin Adding Tracking Update:**
    *   **Steps:** Admin uses `add_tracking_update` to update an order's status to 'out_for_delivery' with a tracking number.
    *   **Expected Outcome:** `OrderTracking` record is created, `order.order_status` changes to `Shipped`, `order.tracking_number` is updated, and `OrderStatusHistory` is recorded.

This comprehensive flow and test cases cover the major interactions and states within the order and courier management system.
