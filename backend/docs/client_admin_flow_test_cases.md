# Client and Admin Side Order & Courier Flow with Test Cases

This document separates the order and courier flow into client (customer) and admin perspectives, detailing their interactions and specific test cases for each role.

## I. Client (Customer) Side Flow

The client-side flow focuses on the customer's journey from placing an order to tracking its delivery, especially for prescription-based orders.

### A. Client Actions & Interactions

1.  **Browse Products & Add to Cart:**
    *   Client views available products.
    *   Adds desired items to their shopping cart.

2.  **Initiate Order (Create Pending Order):**
    *   Client proceeds to checkout.
    *   **API Call:** `POST /api/order/create-pending-order/`
    *   **Purpose:** Creates a temporary order with `order_status='Pending'` and `payment_status='Pending'`.
    *   **Key Interaction:** Provides initial cart items and delivery address details.

3.  **Make Payment:**
    *   Client selects a payment method (e.g., online payment, COD).
    *   **API Call:** `POST /api/order/create-paid-order-for-prescription/`
    *   **Purpose:** Confirms the order after successful payment.
    *   **Key Interaction:** If online payment, payment gateway interaction. If COD, order is marked `payment_status='Pending'`. Order status becomes `payment_completed`.

4.  **Upload Prescription (If Required):**
    *   If the order contains prescription-required items, the client is prompted to upload a prescription.
    *   **API Call:** `POST /api/order/{order_id}/link-prescription/`
    *   **Purpose:** Links the uploaded prescription to the paid order.
    *   **Key Interaction:** Client provides `prescription_id` (from a separate prescription upload process). Order status becomes `prescription_uploaded`.

5.  **Track Order Status:**
    *   Client can view the current status of their orders.
    *   **API Call:** `GET /api/order/{order_id}/tracking/`
    *   **Purpose:** Retrieves detailed tracking information for a specific order.
    *   **Key Interaction:** Client views order status, tracking updates, and potentially courier tracking number.

6.  **View Invoices:**
    *   Client can access and download invoices for their orders.
    *   **API Call:** `GET /api/order/invoices/my-invoices/` or `GET /api/order/invoices/{order_id}/`
    *   **Key Interaction:** Client views invoice details or downloads PDF.

7.  **Order Cancellation:**
    *   Client may request to cancel an order (typically before it's shipped).
    *   **Key Interaction:** Client initiates cancellation request (handled by admin or automated process).

### B. Client-Side Test Cases

1.  **Successful Online Payment Order (No Prescription):**
    *   **Scenario:** User orders non-prescription items, pays online.
    *   **Expected:** Order created, `payment_completed`, `verified` (prescription status), `Processing` (after courier booking), `Shipped`, `Delivered`. Tracking available.

2.  **Successful Online Payment Order (With Prescription, Uploaded & Approved):**
    *   **Scenario:** User orders prescription items, pays online, uploads prescription.
    *   **Expected:** Order created, `payment_completed`, `pending_review` (prescription status). After upload, `prescription_uploaded`. After admin approval, `verified`, `Processing`, `Shipped`, `Delivered`. Tracking available.

3.  **Successful COD Order (No Prescription):**
    *   **Scenario:** User orders non-prescription items, selects COD.
    *   **Expected:** Order created, `payment_completed`, `verified` (prescription status), `Pending` (payment status). `Processing`, `Shipped`, `Delivered`. Payment status updates to `Paid` after delivery.

4.  **Order with Insufficient Stock:**
    *   **Scenario:** User tries to order more quantity than available.
    *   **Expected:** Error message during `create-pending-order` or `create-paid-order-for-prescription`.

5.  **Order with Invalid Delivery Address:**
    *   **Scenario:** User provides an incomplete or invalid delivery address.
    *   **Expected:** Error message during order creation.

6.  **Prescription Order - Missing Upload:**
    *   **Scenario:** User orders prescription items, pays, but does not upload prescription.
    *   **Expected:** Order remains `payment_completed`, `prescription_status` is `pending_review`. User is prompted to upload prescription.

7.  **Order Cancellation by Client (Before Shipment):**
    *   **Scenario:** Client cancels a `payment_completed` or `prescription_uploaded` order.
    *   **Expected:** Order status changes to `Cancelled`. If prescription was linked, stock is restored.

8.  **Re-using Pending Order:**
    *   **Scenario:** Client creates a pending order, then navigates away and returns to checkout with the *same* cart items.
    *   **Expected:** The existing pending order is re-used, no new order ID generated.

9.  **Aborting Pending Order:**
    *   **Scenario:** Client creates a pending order, then modifies cart items and returns to checkout.
    *   **Expected:** The previous pending order is marked `Aborted`, and a new pending order is created.

## II. Admin Side Flow

The admin-side flow focuses on managing orders, verifying prescriptions, and overseeing courier operations.

### A. Admin Actions & Interactions

1.  **View All Orders:**
    *   Admin accesses a dashboard to view all orders.
    *   **API Call:** `GET /api/order/orders/` (with appropriate filters)
    *   **Purpose:** Overview of all orders, their statuses, and payment details.

2.  **Manage Order Status:**
    *   Admin can manually update the status of an order.
    *   **API Call:** `PATCH /api/order/orders/{order_id}/update_status/`
    *   **Purpose:** Transition orders through their lifecycle (e.g., from `Processing` to `Shipped`).

3.  **Review Prescription Orders:**
    *   Admin identifies orders requiring prescription verification.
    *   **API Call:** `GET /api/order/prescription-review/`
    *   **Purpose:** Lists orders with `order_status='prescription_uploaded'` or `payment_completed` and `is_prescription_order=True`.

4.  **Verify/Reject Prescription:**
    *   Admin reviews the uploaded prescription image and decides to approve or reject it.
    *   **API Call:** `POST /api/order/{order_id}/verify-prescription/`
    *   **Purpose:** Updates prescription status and triggers courier booking if approved.
    *   **Key Interaction:** Admin provides `approved` (boolean) and `verification_notes`.

5.  **Add Manual Tracking Updates:**
    *   Admin can manually add tracking events to an order, potentially based on external courier updates.
    *   **API Call:** `POST /api/order/{order_id}/add-tracking-update/`
    *   **Purpose:** Updates `OrderTracking` and `Order` status.
    *   **Key Interaction:** Admin provides `status`, `message`, `location`, `tracking_number`, etc.

6.  **Manage Courier Shipments:**
    *   Admin can view and manage courier shipments directly.
    *   **API Call:** `GET /api/courier/shipments/` (list all shipments)
    *   **API Call:** `POST /api/courier/shipments/{pk}/cancel_shipment/` (cancel a shipment)
    *   **API Call:** `GET /api/courier/shipments/track/` (track a shipment)
    *   **Key Interaction:** Admin monitors courier status, initiates cancellations, or retrieves tracking URLs.

7.  **Check Pincode Serviceability:**
    *   Admin can check if a delivery pincode is serviceable by the courier.
    *   **API Call:** `GET /api/courier/shipments/check_pincode_serviceability/`
    *   **Key Interaction:** Admin provides a pincode.

8.  **View Order Status History:**
    *   Admin can view the complete history of status changes for any order.
    *   **API Call:** `GET /api/order/{order_id}/status-history/`
    *   **Purpose:** Auditing and troubleshooting.

### B. Admin-Side Test Cases

1.  **Approve Prescription & Trigger Courier:**
    *   **Scenario:** Admin approves a `prescription_uploaded` order.
    *   **Expected:** Order status changes to `verified`, then `Processing`. `CourierShipment` is created, `order.tracking_number` is set.

2.  **Reject Prescription & Restore Stock:**
    *   **Scenario:** Admin rejects a `prescription_uploaded` order.
    *   **Expected:** Order status changes to `prescription_rejected`. Stock for order items is restored. No courier booking.

3.  **Manual Order Status Update:**
    *   **Scenario:** Admin manually changes an order from `Processing` to `Shipped`.
    *   **Expected:** `order.order_status` updates, `OrderStatusHistory` is recorded.

4.  **Add Tracking Update:**
    *   **Scenario:** Admin adds a tracking update for an order (e.g., "Out for delivery").
    *   **Expected:** `OrderTracking` record is created, `order.order_status` updates accordingly (e.g., to `Shipped`).

5.  **Cancel Courier Shipment:**
    *   **Scenario:** Admin cancels a courier shipment for an order (e.g., due to customer request or issue).
    *   **Expected:** `CourierShipment` status updates to `cancelled`. `order.order_status` might also be updated to `Cancelled`.

6.  **Check Pincode Serviceability:**
    *   **Scenario:** Admin checks a valid and an invalid pincode.
    *   **Expected:** For valid, returns serviceable status. For invalid, returns not serviceable.

7.  **View Order Statistics:**
    *   **Scenario:** Admin accesses order statistics.
    *   **Expected:** Returns correct counts for total, pending, processing, delivered, and prescription orders, along with total revenue.

This document provides a clear distinction between client and admin responsibilities and interactions within the Pharmacy Web App's order and courier system.
