## Pharmacy Web App Backend Analysis Report

**Date:** November 11, 2025
**Prepared By:** Cline

### 1. Executive Summary

This report provides an in-depth analysis of the Pharmacy Web App's backend, identifying critical bugs, design flaws, and broken logic across key modules, including security, authentication, user management, prescription OCR, order processing, and inventory management. While the project demonstrates a robust feature set, several areas require immediate attention to enhance security, improve data integrity, streamline workflows, and ensure system stability.

### 2. General Backend Architecture & Configuration

#### 2.1. Security Vulnerabilities & Best Practices

*   **CSRF Protection Disabled:** The `django.middleware.csrf.CsrfViewMiddleware` is commented out in `backend/backend/settings.py`, and `@csrf_exempt` is used on authentication views. This is a significant security risk if any session-based views or forms are introduced, as it leaves endpoints vulnerable to Cross-Site Request Forgery attacks.
*   **SQLite in Production:** The `DATABASES` setting in `backend/backend/settings.py` uses `django.db.backends.sqlite3`. SQLite is unsuitable for production environments, especially for applications with concurrent transactions, due to limitations in scalability, performance, and data integrity under heavy load.
*   **Default `AllowAny` Permissions:** `REST_FRAMEWORK.DEFAULT_PERMISSION_CLASSES` is set to `AllowAny` in `backend/backend/settings.py`. This broad default means all API endpoints are publicly accessible unless explicitly restricted, posing a significant security risk for sensitive data and actions.
*   **Media Files Served by Django in Production:** `urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)` in `backend/backend/urls.py` serves media files directly through Django. This is inefficient and insecure for production; a dedicated web server (e.g., Nginx, Apache) or CDN should be used.
*   **`ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`:** While environment variables are used, relying on `*` for `ALLOWED_HOSTS` in production or improperly configuring `CORS_ALLOWED_ORIGINS` can lead to host header poisoning and other security vulnerabilities.
*   **`SIMPLE_JWT_SIGNING_KEY`:** Although fetched from an environment variable, it is best practice to use a separate, strong key for JWT signing, distinct from `SECRET_KEY`, to enhance security.

#### 2.2. Code Structure & Maintainability

*   **Duplicate URL Patterns:** `backend/backend/urls.py` contains redundant "API endpoints" and "Legacy endpoints" pointing to the same app URLs. This creates confusion and maintenance overhead.
*   **Inconsistent API Prefixing:** API endpoints lack consistent prefixing (e.g., some use `/api/`, others do not). The `cart` app's inclusion directly under `/api/` could lead to URL clashes.
*   **Generic Exception Handling:** Broad `except Exception as e` blocks are used in several views (e.g., `authentication/views.py`, `orders/views.py`). This can obscure specific errors, making debugging challenging.

### 3. Authentication & User Management

#### 3.1. Inconsistent Authentication Strategy

*   **Critical Flaw:** The backend employs two incompatible authentication mechanisms:
    *   `backend/authentication/views.py` (likely for mobile) uses `rest_framework.authtoken.models.Token`, returning a simple, long-lived token. It incorrectly returns the same token key for both `access` and `refresh` fields.
    *   `backend/backend/settings.py` and `backend/backend/urls.py` are configured for `rest_framework_simplejwt`, providing JWT endpoints with proper access/refresh token lifetimes and rotation.
*   This inconsistency undermines security (due to long-lived tokens) and creates a fragmented authentication system.

#### 3.2. User Profile & Data Mismatch

*   **Broken Logic in `get_user_profile`:** In `backend/authentication/views.py`, there are two `get_user_profile` functions, with the second overwriting the first. The active function attempts to retrieve numerous fields (e.g., `date_of_birth`, `address`, `allergies`, `insurance_provider`) directly from the `request.user` object.
*   **Model Discrepancy:** `backend/usermanagement/models.py` shows that fields like `birth_date` are in `UserProfile`, and address details are in `Address` models. Many fields accessed by the view (e.g., `blood_group`, `allergies`) are not defined in any user-related model. This leads to incomplete or incorrect profile data being returned.

### 4. Prescriptions OCR & Medicine Suggestions

#### 4.1. OCR Process & Dependencies

*   **Text-Based OCR:** The `PrescriptionScanner` (`backend/prescriptions/prescription_scanner.py`) operates on `prescription_text`, indicating that the actual image-to-text OCR is an external process (likely frontend or a separate service using `GOOGLE_API_KEY`). The overall accuracy depends heavily on the quality of this external OCR.
*   **Basic Medicine Extraction:** The `_extract_medicines_from_text` and `_parse_medicine_line` methods use basic regex patterns. These patterns may be brittle and insufficient for handling diverse or complex prescription formats, potentially leading to inaccurate medicine extraction.

#### 4.2. Flawed Confidence Scoring

*   **Broken Logic:** In `PrescriptionScanner._calculate_confidence_score`, the score is boosted if `product.stock_quantity > 100`. This is a significant flaw as it conflates product availability/popularity with the confidence of a match to a prescription. This could lead to less accurate but highly stocked items being ranked higher, compromising the integrity of the suggestion system.

#### 4.3. Model Redundancy & Inconsistencies

*   **Dual Status Fields in `Prescription`:** The `Prescription` model (`backend/prescriptions/models.py`) has both `status` (detailed workflow) and `verification_status` (legacy). This redundancy can cause inconsistencies if not carefully synchronized.
*   **Redundant Product Suggestion Fields in `PrescriptionMedicine`:** The `PrescriptionMedicine` model has `suggested_medicine` (ForeignKey), `suggested_products` (ManyToManyField), and a legacy `mapped_product` field. This redundancy suggests an uncleaned design, leading to potential data inconsistencies.

### 5. Order Flow

#### 5.1. Dual Order Creation Endpoints

*   **Confusion & Inconsistency:** The presence of `create_paid_order_for_prescription` and `create_pending_order` in `backend/orders/views.py` with overlapping logic for handling existing orders and prescription uploads creates a complex and potentially inconsistent order lifecycle.

#### 5.2. Prescription Handling in Order Creation

*   **Broken Logic in `create_paid_order_for_prescription`:** If an order is *not* a prescription order, `order.prescription_status` is incorrectly reset to `'verified'`. It should be `None` or "not applicable."
*   **Broken Logic in `create_pending_order`:** `is_prescription_order` is *always* set to `True`, and `prescription_status` to `'pending_review'`, regardless of whether the items actually require a prescription. This can incorrectly flag non-prescription orders for verification.

#### 5.3. Hardcoded Business Logic

*   **Shipping & Discount:** `shipping_fee` and `discount_amount` are hardcoded based on `total_amount_calculated` in `create_paid_order_for_prescription`. This logic should be externalized or made configurable for flexibility.

### 6. Inventory Management & Stock Deductions

#### 6.1. Stock Deduction Logic (`deduct_inventory_from_batches`)

*   **Robustness:** The `deduct_inventory_from_batches` function in `backend/orders/views.py` correctly prioritizes batches with the earliest expiry dates and records `StockMovement`. This is a good implementation.
*   **Error Handling:** It raises a `ValueError` for insufficient stock, which is appropriate.

#### 6.2. Stock Return Logic (`return_inventory_to_batches`)

*   **Batch Prioritization:** The `return_inventory_to_batches` function prioritizes batches with the *latest* expiry dates for returns. While this might be a business decision, it's less common than returning to the original batch or the earliest expiring batch to ensure older stock is still moved first.
*   **Handling No Suitable Batch:** If no suitable active batch is found for a return, it logs a warning and creates a `StockMovement` without a specific batch. A more robust system might require creating a new batch or a dedicated "returned stock" mechanism.
*   **Missing `product_unit_id`:** The `cancel_order` action calls `return_inventory_to_batches` with a `product_unit_id` parameter, but the `return_inventory_to_batches` function itself does not accept this parameter. This will cause a `TypeError` when `cancel_order` is invoked.

### 7. Recommendations

1.  **Unify Authentication:** Standardize on `rest_framework_simplejwt` for all client applications. Implement proper JWT access/refresh token handling and deprecate `rest_framework.authtoken`.
2.  **Database Upgrade:** Migrate from SQLite to a production-grade database (e.g., PostgreSQL) for improved scalability, performance, and data integrity.
3.  **Refine Permissions:** Implement more restrictive default permissions in `REST_FRAMEWORK` and apply `AllowAny` only to specific public endpoints.
4.  **Fix User Profile Retrieval:** Correct the `get_user_profile` view to accurately fetch data from `User`, `UserProfile`, and `Address` models. Remove duplicate view definitions and ensure all accessed fields exist in the models.
5.  **Improve OCR Confidence Scoring:** Remove `stock_quantity` as a factor in `PrescriptionScanner._calculate_confidence_score` to ensure suggestions are based purely on matching accuracy.
6.  **Streamline Order Creation:** Consolidate order creation logic into a single, robust endpoint that handles different payment and prescription scenarios more consistently.
7.  **Correct Prescription Status Logic:** Ensure `is_prescription_order` and `prescription_status` are accurately set based on product requirements in order creation flows. Avoid setting `'verified'` status for non-prescription orders.
8.  **Address `return_inventory_to_batches` `TypeError`:** Modify the `return_inventory_to_batches` function signature to accept `product_unit_id` or remove the parameter from the `cancel_order` call if it's not needed.
9.  **Externalize Business Logic:** Move hardcoded shipping and discount calculations into a configurable service or settings.
10. **Production Deployment Best Practices:** Configure a dedicated web server for static/media files, explicitly define `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`, and re-evaluate CSRF protection if session-based authentication is ever used.
11. **Refactor Models:** Clean up redundant status and product suggestion fields in `Prescription` and `PrescriptionMedicine` models for clarity and consistency.
12. **Improve Error Handling:** Replace broad `except Exception as e` blocks with more specific exception handling for better debugging and robustness.
