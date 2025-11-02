# API Endpoints Documentation

This document outlines the API endpoints related to sales bills, sales bill returns, purchase bills, purchase bill returns, rate master, and discount master. For each endpoint, the purpose, HTTP method, example payload, and a test case are provided.

## 1. Sales Bill (OfflineSaleViewSet)

**Base URL:** `/api/offline-sales/`

**Purpose:** Manages offline sales transactions.

**Endpoints:**

*   **`GET /api/offline-sales/`**
    *   **Purpose:** Retrieve a list of all offline sales.
    *   **Method:** GET
    *   **Query Parameters:** `sale_date`, `customer_name`, `customer_phone`, `payment_method` for filtering.
    *   **Test Case:**
        *   **Request:** `GET /api/offline-sales/?customer_name=John%20Doe`
        *   **Expected Response:** A list of offline sales where the customer name contains "John Doe".
    *   **Payload (Response Example):**
        ```json
        [
            {
                "id": 1,
                "customer": 1,
                "customer_name": "John Doe",
                "customer_phone": "1234567890",
                "customer_address": "123 Main St",
                "total_amount": "150.00",
                "paid_amount": "200.00",
                "change_amount": "50.00",
                "payment_method": "Cash",
                "sale_date": "2025-10-29",
                "status": "COMPLETED",
                "notes": "Customer paid with cash.",
                "cancellation_reason": null,
                "created_at": "2025-10-29T09:00:00Z",
                "updated_at": "2025-10-29T09:00:00Z",
                "created_by": 1,
                "updated_by": 1,
                "created_by_username": "admin",
                "customer_details": {
                    "id": 1,
                    "name": "John Doe",
                    "phone_number": "1234567890",
                    "address": "123 Main St",
                    "created_at": "2025-10-29T08:50:00Z",
                    "updated_at": "2025-10-29T08:50:00Z"
                },
                "items": [
                    {
                        "id": 1,
                        "product": 1,
                        "batch": 1,
                        "quantity": 2,
                        "price_per_unit": "75.00",
                        "discount_percentage": "10.00",
                        "discount_amount": "15.00",
                        "subtotal": "150.00",
                        "sale": 1,
                        "product_details": { /* Product details */ },
                        "batch_details": { /* Batch details */ }
                    }
                ]
            }
        ]
        ```

*   **`POST /api/offline-sales/offline-sales/`**
    *   **Purpose:** Create a new offline sale.
    *   **Method:** POST
    *   **Test Case:**
        *   **Request:** `POST /api/offline-sales/` with a valid sales payload.
        *   **Expected Response:** HTTP 201 Created, with the newly created sale data.
    *   **Payload (Request Example):**
        ```json
        {
            "customer": 1,
            "paid_amount": "200.00",
            "payment_method": "Cash",
            "notes": "New sale transaction.",
            "items": [
                {
                    "product": 1,
                    "batch": 1,
                    "quantity": 2,
                    "price_per_unit": "75.00"
                }
            ]
        }
        ```

*   **`GET /api/offline-sales/offline-sales/{id}/`**
    *   **Purpose:** Retrieve details of a specific offline sale.
    *   **Method:** GET
    *   **Test Case:**
        *   **Request:** `GET /api/offline-sales/1/`
        *   **Expected Response:** Details of the offline sale with ID 1.
    *   **Payload (Response Example):** Same as `GET /api/offline-sales/` but for a single object.

*   **`PUT /api/offline-sales/{id}/`**
    *   **Purpose:** Update an existing offline sale.
    *   **Method:** PUT
    *   **Test Case:**
        *   **Request:** `PUT /api/offline-sales/1/` with updated sales data.
        *   **Expected Response:** HTTP 200 OK, with the updated sale data.
    *   **Payload (Request Example):**
        ```json
        {
            "customer": 1,
            "paid_amount": "250.00",
            "payment_method": "Card",
            "notes": "Updated sale transaction.",
            "items": [
                {
                    "product": 1,
                    "batch": 1,
                    "quantity": 3,
                    "price_per_unit": "75.00"
                }
            ]
        }
        ```

*   **`PATCH /api/offline-sales/{id}/`**
    *   **Purpose:** Partially update an existing offline sale.
    *   **Method:** PATCH
    *   **Test Case:**
        *   **Request:** `PATCH /api/offline-sales/1/` with partial sales data.
        *   **Expected Response:** HTTP 200 OK, with the partially updated sale data.
    *   **Payload (Request Example):**
        ```json
        {
            "notes": "Only updating notes."
        }
        ```

*   **`DELETE /api/offline-sales/{id}/`**
    *   **Purpose:** Delete an offline sale.
    *   **Method:** DELETE
    *   **Test Case:**
        *   **Request:** `DELETE /api/offline-sales/1/`
        *   **Expected Response:** HTTP 204 No Content.

*   **`POST /api/offline-sales/{id}/cancel-bill/`**
    *   **Purpose:** Cancel an offline sale bill.
    *   **Method:** POST
    *   **Test Case:**
        *   **Request:** `POST /api/offline-sales/1/cancel-bill/` with cancellation reason.
        *   **Expected Response:** HTTP 200 OK, with the updated sale status.
    *   **Payload (Request Example):**
        ```json
        {
            "cancellation_reason": "Customer changed mind."
        }
        ```

*   **`GET /api/offline-sales/{id}/generate-bill-pdf/`**
    *   **Purpose:** Generate a PDF for an offline sale bill.
    *   **Method:** GET
    *   **Test Case:**
        *   **Request:** `GET /api/offline-sales/1/generate-bill-pdf/`
        *   **Expected Response:** A PDF file download.

## 2. Sales Bill Return (BillReturnViewSet)

**Base URL:** `/api/bill-returns/`

**Purpose:** Manages returns for offline sales.

**Endpoints:**

*   **`GET /api/bill-returns/`**
    *   **Purpose:** Retrieve a list of all sales bill returns.
    *   **Method:** GET
    *   **Test Case:**
        *   **Request:** `GET /api/bill-returns/`
        *   **Expected Response:** A list of sales bill returns.
    *   **Payload (Response Example):**
        ```json
        [
            {
                "id": 1,
                "sale": 1,
                "return_date": "2025-10-30",
                "reason": "Damaged product",
                "notes": "Customer returned damaged item.",
                "total_return_amount": "75.00",
                "status": "PROCESSED",
                "created_at": "2025-10-30T09:00:00Z",
                "updated_at": "2025-10-30T09:00:00Z",
                "returned_by": 1,
                "returned_by_username": "admin",
                "returned_items": [
                    {
                        "id": 1,
                        "bill_return": 1,
                        "offline_sale_item": 1,
                        "returned_quantity": 1,
                        "price_per_unit": "75.00",
                        "subtotal": "75.00",
                        "product_name": "Product A",
                        "batch_number": "BATCH001"
                    }
                ]
            }
        ]
        ```

*   **`POST /api/bill-returns/`**
    *   **Purpose:** Create a new sales bill return.
    *   **Method:** POST
    *   **Test Case:**
        *   **Request:** `POST /api/bill-returns/` with a valid return payload.
        *   **Expected Response:** HTTP 201 Created, with the newly created return data.
    *   **Payload (Request Example):**
        ```json
        {
            "sale": 1,
            "return_date": "2025-10-30",
            "reason": "Customer changed mind",
            "notes": "Item no longer needed.",
            "returned_items": [
                {
                    "offline_sale_item": 1,
                    "returned_quantity": 1,
                    "price_per_unit": "75.00"
                }
            ]
        }
        ```

*   **`GET /api/bill-returns/{id}/`**
    *   **Purpose:** Retrieve details of a specific sales bill return.
    *   **Method:** GET
    *   **Test Case:**
        *   **Request:** `GET /api/bill-returns/1/`
        *   **Expected Response:** Details of the sales bill return with ID 1.
    *   **Payload (Response Example):** Same as `GET /api/bill-returns/` but for a single object.

*   **`PUT /api/bill-returns/{id}/`**
    *   **Purpose:** Update an existing sales bill return.
    *   **Method:** PUT
    *   **Test Case:**
        *   **Request:** `PUT /api/bill-returns/1/` with updated return data.
        *   **Expected Response:** HTTP 200 OK, with the updated return data.
    *   **Payload (Request Example):**
        ```json
        {
            "sale": 1,
            "return_date": "2025-10-30",
            "reason": "Product faulty",
            "notes": "Updated reason for return.",
            "returned_items": [
                {
                    "id": 1,
                    "offline_sale_item": 1,
                    "returned_quantity": 1,
                    "price_per_unit": "75.00"
                }
            ]
        }
        ```

*   **`PATCH /api/bill-returns/{id}/`**
    *   **Purpose:** Partially update an existing sales bill return.
    *   **Method:** PATCH
    *   **Test Case:**
        *   **Request:** `PATCH /api/bill-returns/1/` with partial return data.
        *   **Expected Response:** HTTP 200 OK, with the partially updated return data.
    *   **Payload (Request Example):**
        ```json
        {
            "notes": "Only updating notes."
        }
        ```

*   **`DELETE /api/bill-returns/{id}/`**
    *   **Purpose:** Delete a sales bill return.
    *   **Method:** DELETE
    *   **Test Case:**
        *   **Request:** `DELETE /api/bill-returns/1/`
        *   **Expected Response:** HTTP 204 No Content.

## 3. Purchase Bill (PurchaseOrderViewSet)

**Base URL:** `/api/purchase-orders/`

**Purpose:** Manages purchase orders from suppliers.

**Endpoints:**

*   **`GET /api/purchase-orders/`**
    *   **Purpose:** Retrieve a list of all purchase orders.
    *   **Method:** GET
    *   **Query Parameters:** `supplier`, `status` for filtering.
    *   **Test Case:**
        *   **Request:** `GET /api/purchase-orders/?status=RECEIVED`
        *   **Expected Response:** A list of purchase orders with status 'RECEIVED'.
    *   **Payload (Response Example):**
        ```json
        [
            {
                "id": 1,
                "supplier": 1,
                "supplier_name": "Supplier A",
                "order_date": "2025-10-25",
                "delivery_date": "2025-10-28",
                "total_amount": "500.00",
                "status": "RECEIVED",
                "invoice_number": "INV-001",
                "invoice_date": "2025-10-27",
                "notes": "Initial stock purchase.",
                "created_at": "2025-10-25T10:00:00Z",
                "updated_at": "2025-10-28T11:00:00Z",
                "created_by": 1,
                "updated_by": 1,
                "created_by_username": "admin",
                "items": [
                    {
                        "id": 1,
                        "purchase_order": 1,
                        "product": 1,
                        "product_details": { /* Product details */ },
                        "quantity": 10,
                        "unit_price": "50.00",
                        "discount_percentage": "0.00",
                        "tax_percentage": "5.00",
                        "subtotal": "525.00",
                        "received_quantity": 10,
                        "returned_quantity": 0,
                        "batch_number": "BATCH001",
                        "expiry_date": "2026-10-25"
                    }
                ]
            }
        ]
        ```

*   **`POST /api/purchase-orders/`**
    *   **Purpose:** Create a new purchase order.
    *   **Method:** POST
    *   **Test Case:**
        *   **Request:** `POST /api/purchase-orders/` with a valid purchase order payload.
        *   **Expected Response:** HTTP 201 Created, with the newly created purchase order data.
    *   **Payload (Request Example):**
        ```json
        {
            "supplier": 1,
            "order_date": "2025-10-29",
            "status": "PENDING",
            "notes": "Order for new products.",
            "items": [
                {
                    "product": 1,
                    "quantity": 5,
                    "unit_price": "60.00",
                    "tax_percentage": "5.00",
                    "batch_number": "BATCH002",
                    "expiry_date": "2027-01-01"
                }
            ]
        }
        ```

*   **`GET /api/purchase-orders/{id}/`**
    *   **Purpose:** Retrieve details of a specific purchase order.
    *   **Method:** GET
    *   **Test Case:**
        *   **Request:** `GET /api/purchase-orders/1/`
        *   **Expected Response:** Details of the purchase order with ID 1.
    *   **Payload (Response Example):** Same as `GET /api/purchase-orders/` but for a single object.

*   **`PUT /api/purchase-orders/{id}/`**
    *   **Purpose:** Update an existing purchase order.
    *   **Method:** PUT
    *   **Test Case:**
        *   **Request:** `PUT /api/purchase-orders/1/` with updated purchase order data.
        *   **Expected Response:** HTTP 200 OK, with the updated purchase order data.
    *   **Payload (Request Example):**
        ```json
        {
            "supplier": 1,
            "order_date": "2025-10-29",
            "delivery_date": "2025-11-01",
            "status": "RECEIVED",
            "invoice_number": "INV-001-UPDATED",
            "invoice_date": "2025-10-30",
            "notes": "Updated order details.",
            "items": [
                {
                    "product": 1,
                    "quantity": 10,
                    "unit_price": "50.00",
                    "tax_percentage": "5.00",
                    "batch_number": "BATCH001",
                    "expiry_date": "2026-10-25"
                }
            ]
        }
        ```

*   **`PATCH /api/purchase-orders/{id}/`**
    *   **Purpose:** Partially update an existing purchase order.
    *   **Method:** PATCH
    *   **Test Case:**
        *   **Request:** `PATCH /api/purchase-orders/1/` with partial purchase order data.
        *   **Expected Response:** HTTP 200 OK, with the partially updated purchase order data.
    *   **Payload (Request Example):**
        ```json
        {
            "notes": "Only updating notes."
        }
        ```

*   **`DELETE /api/purchase-orders/{id}/`**
    *   **Purpose:** Delete a purchase order.
    *   **Method:** DELETE
    *   **Test Case:**
        *   **Request:** `DELETE /api/purchase-orders/1/`
        *   **Expected Response:** HTTP 204 No Content.

*   **`POST /api/purchase-orders/{id}/receive-items/`**
    *   **Purpose:** Mark items as received for a purchase order.
    *   **Method:** POST
    *   **Test Case:**
        *   **Request:** `POST /api/purchase-orders/1/receive-items/` with items and quantities.
        *   **Expected Response:** HTTP 200 OK, with the updated purchase order data.
    *   **Payload (Request Example):**
        ```json
        {
            "items": [
                {
                    "id": 1,
                    "received_quantity": 5
                }
            ]
        }
        ```

*   **`POST /api/purchase-orders/{id}/return-items/`**
    *   **Purpose:** Initiate a return for items from a purchase order.
    *   **Method:** POST
    *   **Test Case:**
        *   **Request:** `POST /api/purchase-orders/1/return-items/` with return details.
        *   **Expected Response:** HTTP 201 Created, with the new purchase return data.
    *   **Payload (Request Example):**
        ```json
        {
            "reason": "Defective items",
            "notes": "Some items were found to be defective upon inspection.",
            "items": [
                {
                    "product": 1,
                    "purchase_order_item": 1,
                    "quantity": 2,
                    "unit_price": "50.00"
                }
            ]
        }
        ```

## 4. Purchase Bill Return (PurchaseReturnViewSet)

**Base URL:** `/api/purchase-returns/`

**Purpose:** Manages returns to suppliers for purchase orders.

**Endpoints:**

*   **`GET /api/purchase-returns/`**
    *   **Purpose:** Retrieve a list of all purchase returns.
    *   **Method:** GET
    *   **Query Parameters:** `purchase_order`, `status` for filtering.
    *   **Test Case:**
        *   **Request:** `GET /api/purchase-returns/?status=PENDING`
        *   **Expected Response:** A list of purchase returns with status 'PENDING'.
    *   **Payload (Response Example):**
        ```json
        [
            {
                "id": 1,
                "purchase_order": 1,
                "purchase_order_id": 1,
                "supplier_name": "Supplier A",
                "return_date": "2025-10-30",
                "reason": "Defective items",
                "notes": "Items were damaged during transit.",
                "total_amount": "100.00",
                "status": "PENDING",
                "created_at": "2025-10-30T10:00:00Z",
                "updated_at": "2025-10-30T10:00:00Z",
                "created_by": 1,
                "updated_by": 1,
                "created_by_username": "admin",
                "items": [
                    {
                        "id": 1,
                        "purchase_return": 1,
                        "purchase_order_item": 1,
                        "product": 1,
                        "product_name": "Product A",
                        "quantity": 2,
                        "unit_price": "50.00"
                    }
                ]
            }
        ]
        ```

*   **`POST /api/purchase-returns/`**
    *   **Purpose:** Create a new purchase return.
    *   **Method:** POST
    *   **Test Case:**
        *   **Request:** `POST /api/purchase-returns/` with a valid return payload.
        *   **Expected Response:** HTTP 201 Created, with the newly created return data.
    *   **Payload (Request Example):**
        ```json
        {
            "purchase_order": 1,
            "return_date": "2025-10-30",
            "reason": "Wrong product delivered",
            "notes": "Received incorrect product variant.",
            "items": [
                {
                    "product": 1,
                    "purchase_order_item": 1,
                    "quantity": 1,
                    "unit_price": "50.00"
                }
            ]
        }
        ```

*   **`GET /api/purchase-returns/{id}/`**
    *   **Purpose:** Retrieve details of a specific purchase return.
    *   **Method:** GET
    *   **Test Case:**
        *   **Request:** `GET /api/purchase-returns/1/`
        *   **Expected Response:** Details of the purchase return with ID 1.
    *   **Payload (Response Example):** Same as `GET /api/purchase-returns/` but for a single object.

*   **`PUT /api/purchase-returns/{id}/`**
    *   **Purpose:** Update an existing purchase return.
    *   **Method:** PUT
    *   **Test Case:**
        *   **Request:** `PUT /api/purchase-returns/1/` with updated return data.
        *   **Expected Response:** HTTP 200 OK, with the updated return data.
    *   **Payload (Request Example):**
        ```json
        {
            "purchase_order": 1,
            "return_date": "2025-10-30",
            "reason": "Defective items (updated)",
            "notes": "Updated notes for return.",
            "status": "PROCESSED",
            "items": [
                {
                    "id": 1,
                    "product": 1,
                    "purchase_order_item": 1,
                    "quantity": 2,
                    "unit_price": "50.00"
                }
            ]
        }
        ```

*   **`PATCH /api/purchase-returns/{id}/`**
    *   **Purpose:** Partially update an existing purchase return.
    *   **Method:** PATCH
    *   **Test Case:**
        *   **Request:** `PATCH /api/purchase-returns/1/` with partial return data.
        *   **Expected Response:** HTTP 200 OK, with the partially updated return data.
    *   **Payload (Request Example):**
        ```json
        {
            "notes": "Only updating notes."
        }
        ```

*   **`DELETE /api/purchase-returns/{id}/`**
    *   **Purpose:** Delete a purchase return.
    *   **Method:** DELETE
    *   **Test Case:**
        *   **Request:** `DELETE /api/purchase-returns/1/`
        *   **Expected Response:** HTTP 204 No Content.

## 5. Rate Master (ProductViewSet & BatchViewSet)

**Purpose:** Manages product pricing and batch-specific rates. Rates are primarily handled within `Product` and `Batch` models.

**Endpoints (relevant to rates):**

*   **`GET /api/products/`**
    *   **Purpose:** Retrieve a list of products with their current selling prices.
    *   **Method:** GET
    *   **Query Parameters:** `channel` (e.g., `online`, `offline`) to get channel-specific pricing. `min_price`, `max_price` for filtering.
    *   **Test Case:**
        *   **Request:** `GET /api/products/?channel=online&min_price=100`
        *   **Expected Response:** A list of products with their online selling prices, filtered by price.
    *   **Payload (Response Example - ProductSerializer):**
        ```json
        [
            {
                "id": 1,
                "name": "Product A",
                "brand_name": "Brand X",
                "current_selling_price": "75.00",
                "current_cost_price": "40.00",
                "stock_quantity": 100,
                "stock_status": "In Stock",
                "is_prescription_required": false,
                "batches": [
                    {
                        "id": 1,
                        "product": 1,
                        "product_name": "Product A",
                        "batch_number": "BATCH001",
                        "expiry_date": "2026-10-25",
                        "quantity": 100,
                        "current_quantity": 100,
                        "cost_price": "40.00",
                        "mrp_price": "100.00",
                        "discount_percentage": "10.00",
                        "selling_price": "90.00",
                        "online_mrp_price": "95.00",
                        "online_discount_percentage": "15.00",
                        "online_selling_price": "80.75",
                        "offline_mrp_price": "100.00",
                        "offline_discount_percentage": "10.00",
                        "offline_selling_price": "90.00",
                        "expiry_status": "Good",
                        "days_to_expiry": 365,
                        "is_expired": false
                    }
                ]
            }
        ]
        ```

*   **`PUT /api/products/{id}/` or `PATCH /api/products/{id}/`**
    *   **Purpose:** Update product details, which might indirectly affect pricing (e.g., `min_stock_level`).
    *   **Method:** PUT/PATCH
    *   **Payload (Request Example - ProductSerializer):**
        ```json
        {
            "min_stock_level": 20
        }
        ```

*   **`POST /api/products/{id}/update_stock/`**
    *   **Purpose:** Add a new batch or update an existing batch for a product, including its pricing details (`mrp_price`, `discount_percentage`, `online_mrp_price`, `online_discount_percentage`, `offline_mrp_price`, `offline_discount_percentage`).
    *   **Method:** POST
    *   **Test Case:**
        *   **Request:** `POST /api/products/1/update_stock/` with batch pricing data.
        *   **Expected Response:** HTTP 200 OK or 201 Created, with the updated batch data.
    *   **Payload (Request Example):**
        ```json
        {
            "batch_number": "BATCH003",
            "expiry_date": "2028-01-01",
            "quantity": 50,
            "cost_price": "35.00",
            "mrp_price": "90.00",
            "discount_percentage": "5.00",
            "online_mrp_price": "85.00",
            "online_discount_percentage": "10.00",
            "offline_mrp_price": "92.00",
            "offline_discount_percentage": "7.00",
            "is_primary": true
        }
        ```

*   **`GET /api/batches/`**
    *   **Purpose:** Retrieve a list of all batches, including their specific pricing.
    *   **Method:** GET
    *   **Test Case:**
        *   **Request:** `GET /api/batches/?product=1`
        *   **Expected Response:** A list of batches for product ID 1, with their pricing details.
    *   **Payload (Response Example - BatchSerializer):**
        ```json
        [
            {
                "id": 1,
                "product": 1,
                "product_name": "Product A",
                "batch_number": "BATCH001",
                "manufacturing_date": "2024-10-25",
                "expiry_date": "2026-10-25",
                "quantity": 100,
                "current_quantity": 100,
                "cost_price": "40.00",
                "mrp_price": "100.00",
                "discount_percentage": "10.00",
                "selling_price": "90.00",
                "online_mrp_price": "95.00",
                "online_discount_percentage": "15.00",
                "online_selling_price": "80.75",
                "offline_mrp_price": "100.00",
                "offline_discount_percentage": "10.00",
                "offline_selling_price": "90.00",
                "mfg_license_number": "LIC123",
                "created_at": "2024-10-25T08:00:00Z",
                "updated_at": "2024-10-25T08:00:00Z",
                "days_to_expiry": 365,
                "is_expired": false,
                "expiry_status": "Good"
            }
        ]
        ```

## 6. Discount Master (DiscountViewSet)

**Base URL:** `/api/discounts/`

**Purpose:** Manages product and category-specific discounts.

**Endpoints:**

*   **`GET /api/discounts/`**
    *   **Purpose:** Retrieve a list of all active and inactive discounts.
    *   **Method:** GET
    *   **Query Parameters:** `search` (by name, description, product name, category name), `ordering` (by name, percentage, start_date, end_date, created_at).
    *   **Test Case:**
        *   **Request:** `GET /api/discounts/?is_active=true&ordering=-percentage`
        *   **Expected Response:** A list of active discounts, ordered by percentage descending.
    *   **Payload (Response Example):**
        ```json
        [
            {
                "id": 1,
                "name": "Diwali Sale",
                "percentage": "15.00",
                "description": "Special discount for Diwali.",
                "target_type": "category",
                "target_id": null,
                "product": null,
                "category": 1,
                "start_date": "2025-10-20",
                "end_date": "2025-11-05",
                "is_active": true,
                "created_at": "2025-10-15T10:00:00Z",
                "updated_at": "2025-10-15T10:00:00Z",
                "created_by": 1,
                "created_by_username": "admin",
                "product_name": null,
                "category_name": "Painkillers"
            },
            {
                "id": 2,
                "name": "Product Launch Offer",
                "percentage": "10.00",
                "description": "Introductory offer for new product.",
                "target_type": "product",
                "target_id": null,
                "product": 2,
                "category": null,
                "start_date": "2025-10-28",
                "end_date": "2025-11-15",
                "is_active": true,
                "created_at": "2025-10-27T14:30:00Z",
                "updated_at": "2025-10-27T14:30:00Z",
                "created_by": 1,
                "created_by_username": "admin",
                "product_name": "New Product X",
                "category_name": null
            }
        ]
        ```

*   **`POST /api/discounts/`**
    *   **Purpose:** Create a new discount.
    *   **Method:** POST
    *   **Test Case:**
        *   **Request:** `POST /api/discounts/` with a valid discount payload.
        *   **Expected Response:** HTTP 201 Created, with the newly created discount data.
    *   **Payload (Request Example - Product-wise discount):**
        ```json
        {
            "name": "Holiday Special",
            "percentage": "20.00",
            "description": "Holiday season discount on specific product.",
            "target_type": "product",
            "target_id": 1,
            "start_date": "2025-12-01",
            "end_date": "2025-12-31",
            "is_active": true
        }
        ```
    *   **Payload (Request Example - Category-wise discount):**
        ```json
        {
            "name": "Winter Sale",
            "percentage": "10.00",
            "description": "Winter discount on all products in a category.",
            "target_type": "category",
            "target_id": 2,
            "start_date": "2025-12-01",
            "end_date": "2025-12-31",
            "is_active": true
        }
        ```

*   **`GET /api/discounts/{id}/`**
    *   **Purpose:** Retrieve details of a specific discount.
    *   **Method:** GET
    *   **Test Case:**
        *   **Request:** `GET /api/discounts/1/`
        *   **Expected Response:** Details of the discount with ID 1.
    *   **Payload (Response Example):** Same as `GET /api/discounts/` but for a single object.

*   **`PUT /api/discounts/{id}/`**
    *   **Purpose:** Update an existing discount.
    *   **Method:** PUT
    *   **Test Case:**
        *   **Request:** `PUT /api/discounts/1/` with updated discount data.
        *   **Expected Response:** HTTP 200 OK, with the updated discount data.
    *   **Payload (Request Example):**
        ```json
        {
            "name": "Diwali Sale Extended",
            "percentage": "15.00",
            "description": "Special discount for Diwali (extended).",
            "target_type": "category",
            "target_id": 1,
            "start_date": "2025-10-20",
            "end_date": "2025-11-15",
            "is_active": true
        }
        ```

*   **`PATCH /api/discounts/{id}/`**
    *   **Purpose:** Partially update an existing discount.
    *   **Method:** PATCH
    *   **Test Case:**
        *   **Request:** `PATCH /api/discounts/1/` with partial discount data.
        *   **Expected Response:** HTTP 200 OK, with the partially updated discount data.
    *   **Payload (Request Example):**
        ```json
        {
            "is_active": false
        }
        ```

*   **`DELETE /api/discounts/{id}/`**
    *   **Purpose:** Delete a discount.
    *   **Method:** DELETE
    *   **Test Case:**
        *   **Request:** `DELETE /api/discounts/1/`
        *   **Expected Response:** HTTP 204 No Content.
