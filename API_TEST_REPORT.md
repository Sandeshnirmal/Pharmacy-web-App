# API Test Report

This report summarizes the results of testing the API endpoints as described in `API_DOCUMENTATION.md`.

## Authentication

- **`POST /api/token/`**: **SUCCESS**
  - Successfully generated an authentication token.

## GET Requests

- **`GET /api/offline-sales/`**: **SUCCESS**
  - The endpoint is active but returned a list of sub-endpoints instead of sales data. To get data, a specific ID or query parameter is likely needed (e.g., `/api/offline-sales/1/`).

- **`GET /api/bill-returns/`**: **FAIL (404 Not Found)**
  - The endpoint could not be found. This suggests a mismatch between the documentation and the actual API routes.

- **`GET /api/purchase-orders/`**: **FAIL (404 Not Found)**
  - The endpoint could not be found. This suggests a mismatch between the documentation and the actual API routes.

- **`GET /api/purchase-returns/`**: **FAIL (404 Not Found)**
  - The endpoint could not be found. This suggests a mismatch between the documentation and the actual API routes.

- **`GET /api/products/`**: **SUCCESS**
  - The endpoint is active but returned a list of sub-endpoints instead of product data. To get data, a specific ID or query parameter is likely needed (e.g., `/api/products/1/`).

- **`GET /api/discounts/`**: **SUCCESS**
  - Successfully retrieved a list of discounts.

## POST Requests

- **`POST /api/offline-sales/`**: **FAIL (Method Not Allowed)**
  - The endpoint does not allow the `POST` method, which contradicts the documentation.

- **`POST /api/bill-returns/`**: **FAIL (404 Not Found)**
  - The endpoint could not be found.

- **`POST /api/purchase-orders/`**: **FAIL (404 Not Found)**
  - The endpoint could not be found.

- **`POST /api/purchase-returns/`**: **FAIL (404 Not Found)**
  - The endpoint could not be found.

- **`POST /api/products/1/update_stock/`**: **FAIL (404 Not Found)**
  - The endpoint could not be found. The correct URL might be `/api/products/enhanced-products/1/update_stock/` based on the URL patterns in the error message.

- **`POST /api/discounts/`**: **SUCCESS**
  - Successfully created a new discount.

## Summary of Discrepancies

There are significant discrepancies between the `API_DOCUMENTATION.md` and the running API:
- The endpoints for `bill-returns`, `purchase-orders`, and `purchase-returns` are not found.
- The `POST` method is not allowed for `offline-sales`.
- The `update_stock` endpoint for products has a different URL than documented.
