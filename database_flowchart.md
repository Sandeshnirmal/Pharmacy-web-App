# Pharmacy Web Application Database Flowchart (ERD)

This document outlines the Entity-Relationship Diagram (ERD) for the Pharmacy Web Application's backend database, based on the Django `models.py` files.

```
+---------------------+       +---------------------+       +---------------------+
|       UserRole      |       |         User        |       |       Address       |
+---------------------+       +---------------------+       +---------------------+
| PK: id              |       | PK: id (UUID)       |       | PK: id              |
| name (unique)       |       | first_name          |       | user_id (FK) -------> User
| display_name        |       | last_name           |       | address_line1       |
| description         |       | email (unique)      |       | city                |
| permissions (JSON)  |       | phone_number (unique)|       | state               |
| is_active           |       | date_of_birth       |       | pincode             |
| created_at          |       | gender              |       | address_type        |
| updated_at          |       | role                |       | is_default          |
+---------------------+       | user_role_id (FK) ---> UserRole | +---------------------+
                               | license_number      |       |
                               | verification_status |       |
                               | profile_picture_url |       |
                               | date_joined         |       |
                               | is_active           |       |
                               | is_staff            |       |
                               | is_superuser        |       |
                               | last_login          |       |
                               +---------------------+       |
                                        | 1                  |
                                        |                    |
                                        | 1                  |
                               +---------------------+       |
                               |     UserProfile     |       |
                               +---------------------+       |
                               | PK: id              |       |
                               | user_id (FK) -------> User |
                               | bio                 |       |
                               | location            |       |
                               | birth_date          |       |
                               | avatar              |       |
                               | phone_verified      |       |
                               | email_verified      |       |
                               | newsletter_sub      |       |
                               | sms_notifications   |       |
                               | email_notifications |       |
                               | preferred_language  |       |
                               | timezone            |       |
                               | created_at          |       |
                               | updated_at          |       |
                               +---------------------+       |
                                        | 1                  |
                                        |                    |
                                        | 1                  |
                               +---------------------+       |
                               |   UserPreferences   |       |
                               +---------------------+       |
                               | PK: id              |       |
                               | user_id (FK) -------> User |
                               | preferred_categories|       |
                               | favorite_brands     |       |
                               | price_range_min     |       |
                               | price_range_max     |       |
                               | delivery_time_pref  |       |
                               | created_at          |       |
                               | updated_at          |       |
                               +---------------------+       |
                                        | *                  |
                                        |                    |
                                        | 1                  |
                               +---------------------+       |
                               |    UserActivity     |       |
                               +---------------------+       |
                               | PK: id              |       |
                               | user_id (FK) -------> User |
                               | activity_type       |       |
                               | description         |       |
                               | metadata (JSON)     |       |
                               | ip_address          |       |
                               | user_agent          |       |
                               | created_at          |       |
                               +---------------------+       |
                                                              |
+---------------------+       +---------------------+       |
|   CompanyDetails    |       |     TPCRecipient    |       |
+---------------------+       +---------------------+       |
| PK: id              |       | PK: id              |       |
| name (unique)       |       | address_id (FK) ------> Address |
| address_line1       |       | recipient_name      |       |
| city                |       | recipient_company   |       |
| state               |       | recipient_mobile    |       |
| postal_code         |       | recipient_email     |       |
| country             |       | recipient_gstin     |       |
| phone_number        |       +---------------------+       |
| email               |                                     |
| gstin               |                                     |
| bank_name           |                                     |
| bank_account_number |                                     |
| bank_ifsc_code      |                                     |
+---------------------+                                     |
                                                              |
+---------------------+       +---------------------+       |
| TPCServiceableArea  |       |     CourierShipment |       |
+---------------------+       +---------------------+       |
| PK: id              |       | PK: id (UUID)       |       |
| pincode (unique)    |       | order_id (FK) -------> Order |
| area_name           |       | tracking_number (unique)|   |
| city                |       | tpc_order_id        |       |
| state               |       | status              |       |
| station_code        |       | current_location    |       |
| sub_branch_code     |       | estimated_delivery  |       |
| doc_delivery        |       | actual_delivery     |       |
| parcel_delivery     |       | pickup_scheduled    |       |
| propremium_delivery |       | pickup_completed    |       |
| doc_delivery_schedule|      | pickup_address (JSON)|      |
| parcel_delivery_schedule|   | delivery_address (JSON)|    |
| prodlyschedule      |       | delivery_instructions|     |
| cod_delivery        |       | delivery_contact    |       |
| is_serviceable      |       | weight              |       |
| last_updated        |       | dimensions (JSON)   |       |
+---------------------+       | declared_value      |       |
                               | shipping_charges    |       |
                               | cod_charges         |       |
                               | total_charges       |       |
                               | tpc_response (JSON) |       |
                               | tracking_history (JSON)|    |
                               | created_at          |       |
                               | updated_at          |       |
                               +---------------------+       |
                                                              |
+---------------------+       +---------------------+       |
|      Category       |       |     GenericName     |       |
+---------------------+       +---------------------+       |
| PK: id              |       | PK: id              |       |
| name (unique)       |       | name (unique)       |       |
| description         |       | description         |       |
| parent_category_id (FK) -> Category | +---------------------+
| created_at          |                                     |
| updated_at          |                                     |
+---------------------+                                     |
                                                              |
+---------------------+       +---------------------+       |
|     Composition     |       |        Product      |       |
+---------------------+       +---------------------+       |
| PK: id              |       | PK: id              |       |
| name (unique)       |       | name                |       |
| scientific_name     |       | brand_name          |       |
| description         |       | generic_name_id (FK) -> GenericName |
| category            |       | manufacturer        |       |
| side_effects        |       | medicine_type       |       |
| contraindications   |       | prescription_type   |       |
| aliases (JSON)      |       | strength            |       |
| therapeutic_class   |       | form                |       |
| mechanism_of_action |       | is_prescription_req |       |
| is_active           |       | price               |       |
| created_at          |       | mrp                 |       |
| updated_at          |       | stock_quantity      |       |
| created_by_id (FK) --> User | min_stock_level     |       |
+---------------------+       | dosage_form         |       |
                               | pack_size           |       |
                               | packaging_unit      |       |
                               | description         |       |
                               | composition (legacy)|       |
                               | uses                |       |
                               | side_effects        |       |
                               | how_to_use          |       |
                               | precautions         |       |
                               | storage             |       |
                               | image_url           |       |
                               | hsn_code            |       |
                               | category_id (FK) ----> Category |
                               | is_active           |       |
                               | is_featured         |       |
                               | created_at          |       |
                               | updated_at          |       |
                               | created_by_id (FK) --> User |
                               +---------------------+       |
                                        | *                  |
                                        |                    |
                                        | *                  |
                               +---------------------+       |
                               | ProductComposition  |       |
                               +---------------------+       |
                               | PK: id              |       |
                               | product_id (FK) ----> Product |
                               | composition_id (FK) -> Composition |
                               | strength            |       |
                               | unit                |       |
                               | percentage          |       |
                               | is_primary          |       |
                               | is_active           |       |
                               | notes               |       |
                               | created_at          |       |
                               +---------------------+       |
                                                              |
+---------------------+       +---------------------+       |
|        Batch        |       |      Inventory      |       |
+---------------------+       +---------------------+       |
| PK: id              |       | PK: id              |       |
| product_id (FK) ----> Product | product_id (FK) ----> Product |
| batch_number        |       | quantity_on_hand    |       |
| manufacturing_date  |       | reorder_point       |       |
| expiry_date         |       | last_restock_date   |       |
| quantity            |       +---------------------+       |
| current_quantity    |                                     |
| cost_price          |                                     |
| selling_price       |                                     |
| mfg_license_number  |                                     |
| created_at          |                                     |
| updated_at          |                                     |
+---------------------+                                     |
                                                              |
+---------------------+       +---------------------+       |
|    StockMovement    |       |     StockAlert      |       |
+---------------------+       +---------------------+       |
| PK: id              |       | PK: id              |       |
| product_id (FK) ----> Product | product_id (FK) ----> Product |
| batch_id (FK) ------> Batch | batch_id (FK) ------> Batch |
| movement_type       |       | alert_type          |       |
| quantity            |       | message             |       |
| reference_number    |       | is_resolved         |       |
| notes               |       | resolved_by_id (FK) -> User |
| created_by_id (FK) --> User | resolved_at         |       |
| created_at          |       | created_at          |       |
+---------------------+       +---------------------+       |
                                                              |
+---------------------+                                       |
|       Supplier      |                                       |
+---------------------+                                       |
| PK: id              |                                       |
| name                |                                       |
| contact_person      |                                       |
| email               |                                       |
| phone               |                                       |
| address             |                                       |
| gst_number          |                                       |
| is_active           |                                       |
| created_at          |                                       |
| updated_at          |                                       |
+---------------------+                                       |
                                                              |
+---------------------+       +---------------------+       |
|    ProductReview    |       |     ProductImage    |       |
+---------------------+       +---------------------+       |
| PK: id              |       | PK: id              |       |
| product_id (FK) ----> Product | product_id (FK) ----> Product |
| user_id (FK) -------> User | image_url           |       |
| rating              |       | alt_text            |       |
| title               |       | is_verified_purchase|       |
| comment             |       | is_primary          |       |
| helpful_count       |       | order               |       |
| created_at          |       | created_at          |       |
| updated_at          |       +---------------------+       |
+---------------------+                                     |
                                                              |
+---------------------+       +---------------------+       |
|      Wishlist       |       |      ProductTag     |       |
+---------------------+       +---------------------+       |
| PK: id              |       | PK: id              |       |
| user_id (FK) -------> User | name (unique)       |       |
| product_id (FK) ----> Product | color               |       |
| created_at          |       | created_at          |       |
+---------------------+       +---------------------+       |
                                        | *                  |
                                        |                    |
                                        | *                  |
                               +---------------------+       |
                               | ProductTagAssignment|       |
                               +---------------------+       |
                               | PK: id              |       |
                               | product_id (FK) ----> Product |
                               | tag_id (FK) --------> ProductTag |
                               | created_at          |       |
                               +---------------------+       |
                                                              |
+---------------------+                                       |
| ProductViewHistory  |                                       |
+---------------------+                                       |
| PK: id              |                                       |
| user_id (FK) -------> User |                               |
| product_id (FK) ----> Product |                             |
| viewed_at           |                                       |
+---------------------+                                       |
                                                              |
+---------------------+       +---------------------+       |
|        Order        |       |      OrderItem      |       |
+---------------------+       +---------------------+       |
| PK: id              |       | PK: id              |       |
| user_id (FK) -------> User | order_id (FK) -------> Order |
| address_id (FK) ----> Address | product_id (FK) ----> Product |
| order_date          |       | quantity            |       |
| total_amount        |       | unit_price          |       |
| discount_amount     |       | unit_price_at_order |       |
| shipping_fee        |       | prescription_detail_id (FK) -> PrescriptionMedicine |
| payment_method      |       | batch_id (FK) ------> Batch |
| payment_status      |       +---------------------+       |
| order_status        |                                     |
| is_prescription_order|                                    |
| prescription_image_base64|                                |
| prescription_status |                                     |
| delivery_method     |                                     |
| expected_delivery_date|                                   |
| notes               |                                     |
| delivery_address (JSON)|                                  |
| tracking_number     |                                     |
| created_at          |                                     |
| updated_at          |                                     |
+---------------------+                                     |
         | *                                                |
         |                                                  |
         | 1                                                |
+---------------------+                                     |
|    OrderTracking    |                                     |
+---------------------+                                     |
| PK: id              |                                     |
| order_id (FK) -------> Order |                            |
| status              |                                     |
| message             |                                     |
| location            |                                     |
| estimated_delivery  |                                     |
| actual_delivery     |                                     |
| delivery_person_name|                                     |
| delivery_person_phone|                                    |
| tracking_number     |                                     |
| notes               |                                     |
| created_at          |                                     |
| updated_by_id (FK) --> User |                             |
+---------------------+                                     |
         | *                                                |
         |                                                  |
         | 1                                                |
+---------------------+                                     |
| OrderStatusHistory  |                                     |
+---------------------+                                     |
| PK: id              |                                     |
| order_id (FK) -------> Order |                            |
| old_status          |                                     |
| new_status          |                                     |
| changed_by_id (FK) --> User |                             |
| reason              |                                     |
| timestamp           |                                     |
+---------------------+                                     |
                                                              |
+---------------------+                                       |
|       Payment       |                                       |
+---------------------+                                       |
| PK: id              |                                       |
| order_id (FK) -------> Order |                            |
| user_id (FK) -------> User |                               |
| razorpay_order_id   |                                       |
| razorpay_payment_id |                                       |
| razorpay_signature  |                                       |
| amount              |                                       |
| currency            |                                       |
| payment_method      |                                       |
| status              |                                       |
| payment_date        |                                       |
| updated_at          |                                       |
| notes               |                                       |
+---------------------+                                       |
                                                              |
+---------------------+       +---------------------+       |
|     Prescription    |       | PrescriptionMedicine|       |
+---------------------+       +---------------------+       |
| PK: id (UUID)       |       | PK: id (UUID)       |       |
| prescription_number |       | prescription_id (FK) -> Prescription |
| patient_name        |       | line_number         |       |
| patient_age         |       | recognized_text_raw |       |
| patient_gender      |       | extracted_medicine_name|    |
| doctor_name         |       | extracted_dosage    |       |
| doctor_license      |       | extracted_frequency |       |
| hospital_clinic     |       | extracted_duration  |       |
| prescription_date   |       | extracted_quantity  |       |
| status              |       | extracted_instructions|     |
| verification_status |       | extracted_form      |       |
| image_url           |       | suggested_medicine_id (FK) -> Product |
| image_file          |       | suggested_products (M2M) -> Product |
| ocr_text            |       | ai_confidence_score |       |
| ai_confidence_score |       | verification_status |       |
| ai_processing_time  |       | mapping_status      |       |
| ai_processed        |       | verified_medicine_id (FK) -> Product |
| rejection_reason    |       | verified_medicine_name|     |
| clarification_notes |       | verified_dosage     |       |
| pharmacist_notes    |       | verified_frequency  |       |
| verification_notes  |       | verified_duration   |       |
| user_id (FK) -------> User | verified_quantity   |       |
| verified_by_admin_id (FK) -> User | verified_instructions| |
| upload_date         |       | quantity_prescribed |       |
| verification_date   |       | quantity_dispensed  |       |
| created_at          |       | unit_price          |       |
| updated_at          |       | total_price         |       |
+---------------------+       | is_valid_for_order  |       |
         | *                  | customer_approved   |       |
         |                    | pharmacist_comment  |       |
         | 1                  | clarification_notes |       |
+---------------------+       | created_at          |       |
| PrescriptionWorkflowLog |   | updated_at          |       |
+---------------------+       | verified_by_id (FK) -> User |
| PK: id (UUID)       |       +---------------------+
| prescription_id (FK) -> Prescription |
| from_status         |
| to_status           |
| action_taken        |
| notes               |
| system_generated    |
| performed_by_id (FK) -> User |
| timestamp           |
+---------------------+

+---------------------+       +---------------------+
| PrescriptionScanResult|       | MedicineSuggestion  |
+---------------------+       +---------------------+
| PK: id              |       | PK: id              |
| user_id (FK) -------> User | scan_result_id (FK) -> PrescriptionScanResult |
| scanned_text        |       | product_id          |
| extracted_medicines |       | product_name        |
| total_suggestions   |       | match_type          |
| scan_type           |       | confidence_score    |
| created_at          |       | search_term         |
+---------------------+       | created_at          |
                               +---------------------+
```

**Key Relationships:**

*   **User Management:**
    *   `User` is the central entity, linked to `UserRole` (many-to-one), `UserProfile` (one-to-one), `UserPreferences` (one-to-one), `UserActivity` (one-to-many), and `Address` (one-to-many).
*   **Company Details:**
    *   `CompanyDetails` is a standalone entity.
*   **Courier:**
    *   `CourierShipment` has a one-to-one relationship with `Order`.
    *   `TPCRecipient` has a many-to-one relationship with `Address`.
    *   `TPCServiceableArea` is a standalone entity for pincode serviceability.
*   **Product & Inventory:**
    *   `Product` is linked to `GenericName` (many-to-one), `Category` (many-to-one), and `User` (for `created_by`).
    *   `Product` has a many-to-many relationship with `Composition` through `ProductComposition`.
    *   `Batch` has a many-to-one relationship with `Product`.
    *   `Inventory` has a one-to-one relationship with `Product`.
    *   `StockMovement` and `StockAlert` are linked to `Product` and `Batch`, and `User` (for `created_by`/`resolved_by`).
    *   `Supplier` is a standalone entity.
    *   `ProductReview`, `ProductImage`, `Wishlist`, `ProductTagAssignment`, and `ProductViewHistory` are all linked to `Product` and/or `User`.
*   **Orders:**
    *   `Order` is linked to `User` (many-to-one) and `Address` (many-to-one).
    *   `OrderItem` has a many-to-one relationship with `Order`, `Product`, `Batch`, and `PrescriptionMedicine`.
    *   `OrderTracking` and `OrderStatusHistory` have many-to-one relationships with `Order` and `User`.
*   **Payment:**
    *   `Payment` has a many-to-one relationship with `Order` and `User`.
*   **Prescriptions:**
    *   `Prescription` is linked to `User` (many-to-one) and `User` (for `verified_by_admin`).
    *   `PrescriptionMedicine` has a many-to-one relationship with `Prescription`, `Product` (for `suggested_medicine` and `verified_medicine`), and `User` (for `verified_by`). It also has a many-to-many relationship with `Product` for `suggested_products`.
    *   `PrescriptionWorkflowLog` has a many-to-one relationship with `Prescription` and `User`.
    *   `PrescriptionScanResult` has a many-to-one relationship with `User`.
    *   `MedicineSuggestion` has a many-to-one relationship with `PrescriptionScanResult`.
