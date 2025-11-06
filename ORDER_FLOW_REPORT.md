## Prescriptions OCR Flow Report

This report details the Optical Character Recognition (OCR) flow for prescriptions within the Pharmacy Web App project, encompassing both backend processing and mobile application interactions.

The project utilizes Google Gemini AI for OCR and has three distinct prescription processing flows:

1.  **Asynchronous AI/OCR Flow (Primary Mobile Application Flow)**
2.  **Synchronous OCR Analysis Flow (Web Test / Alternative Mobile Flow)**
3.  **Simple Upload for Manual Verification (Non-OCR Flow)**

---

### 1. Asynchronous AI/OCR Flow (Primary Mobile Application Flow)

This is the main flow for users who want to upload a prescription, get AI-powered medicine suggestions, and potentially create an order.

**A. Mobile Application (Flutter - `Pharmacy_mobile_app`) Components:**

*   **`PrescriptionScanFlowScreen.dart`**:
    *   **User Interaction**: Allows users to select a prescription image from the camera or gallery.
    *   **Image Upload**: Calls `PrescriptionService.uploadPrescription()`, which in turn uses `ApiService.uploadPrescription()`. This method sends the image as a `multipart/form-data` to the backend endpoint: `http://127.0.0.1:8000/api/prescriptions/mobile/upload/`.
    *   **Status Polling**: After upload, it calls `PrescriptionService.waitForProcessing()`, which repeatedly checks the processing status by calling `ApiService.getPrescriptionStatus()` (hitting `http://127.0.0.1:8000/api/prescriptions/mobile/status/<prescription_id>/`).
    *   **Retrieve Suggestions**: Once processing is complete, it fetches AI-generated medicine suggestions using `PrescriptionService.getMedicineSuggestions()` (hitting `http://127.0.0.1:8000/api/prescriptions/mobile/suggestions/<prescription_id>/`).
    *   **Product Stock Check**: It then performs a local search for product stock using `ApiService.searchProducts()`.
    *   **Navigation**: Navigates to `PrescriptionResultDisplayScreen.dart` to show the results.

*   **`PrescriptionProcessingScreen.dart`**:
    *   This is a loading screen displayed while the backend processes the prescription.
    *   It uses `PrescriptionService.waitForProcessing()` to monitor the asynchronous OCR task's completion.

*   **`PrescriptionResultDisplayScreen.dart`**:
    *   Displays the extracted medicine names, dosages, and their availability status (in stock/out of stock).
    *   Allows navigation to `ProductDetailsScreen` for available products.

*   **`PrescriptionResultScreen.dart`**:
    *   An alternative or older results screen that directly takes `PrescriptionSuggestionsResponse` as input.
    *   Allows users to select medicines, adjust quantities, view a pricing summary, and proceed to order creation via `ApiService.createPrescriptionOrder()`.

**B. Backend (Django - `backend/prescriptions/`) Components:**

*   **`mobile_api.py`**:
    *   **`upload_prescription` (POST `/api/prescriptions/mobile/upload/`)**:
        *   Receives the prescription image file.
        *   Saves the image to `default_storage` (e.g., `media/prescriptions/`).
        *   Creates a `Prescription` database record with `status='pending_ocr'` and `verification_status='Pending_AI_Processing'`.
        *   **Triggers an asynchronous Celery task `process_prescription_ocr_task.delay()`** for background processing.
    *   **`get_prescription_status` (GET `/api/prescriptions/mobile/status/<prescription_id>/`)**:
        *   Provides the current processing status of a prescription, indicating if AI processing is complete and if suggestions are ready.
    *   **`get_medicine_suggestions` (GET `/api/prescriptions/mobile/suggestions/<prescription_id>/`)**:
        *   Returns the AI-generated medicine suggestions and product mappings once processing is complete.
    *   **`create_prescription_order` (POST `/api/prescriptions/mobile/create-order/`)**:
        *   Creates an `Order` and `OrderItem` records based on selected prescription medicines.

*   **`tasks.py`**:
    *   **`process_prescription_ocr_task` (Celery Shared Task)**:
        *   This is the core asynchronous task executed by Celery workers.
        *   Retrieves the `Prescription` object and the image path.
        *   **Instantiates `OCRService` and calls `ocr_service.process_prescription_image(image_path)`**.
        *   Updates the `Prescription` record (`ai_processed=True`, `ai_confidence_score`, `status='pending_verification'`, `verification_status='Pending_Review'`).
        *   Creates `PrescriptionMedicine` entries for each extracted medicine, linking them to `Product` objects if a match is found.
        *   Logs workflow changes in `PrescriptionWorkflowLog`.

*   **`ocr_service.py`**:
    *   **`OCRService` Class**:
        *   Uses `google.generativeai` (Gemini 2.0 Flash model) for AI-powered text extraction.
        *   **`process_prescription_image(image_path)`**: Orchestrates the OCR process:
            1.  **`extract_text_from_prescription(image_path)`**: Sends the image and a detailed prompt to Gemini AI to extract medicine names, generic names, compositions, strengths, forms, frequencies, and quantities/durations. Includes robust JSON parsing and a text-based fallback.
            2.  **`match_medicines_by_composition(extracted_medicines)`**: Matches the AI-extracted medicines with the local `Product` database. It prioritizes Gemini's generic name and composition, then uses various helper methods (`_normalize_composition`, `_calculate_composition_similarity`, `_check_form_compatibility`) for robust matching based on composition and dosage form.

*   **`models.py`**:
    *   **`Prescription`**: Stores prescription details, including `image_url`, `image_file`, `ocr_text`, `ai_confidence_score`, `ai_processing_time`, `ai_processed`, and a detailed `status` workflow (`uploaded`, `ai_processing`, `ai_mapped`, `pending_verification`, etc.).
    *   **`PrescriptionMedicine`**: Stores individual medicine details extracted by AI, including `extracted_medicine_name`, `extracted_dosage`, `suggested_medicine` (linked `Product`), `ai_confidence_score`, and `verification_status`.
    *   **`PrescriptionWorkflowLog`**: Provides an audit trail for status changes.
    *   **`PrescriptionScanResult` / `MedicineSuggestion`**: Models for storing general scan results and individual medicine suggestions, used by `PrescriptionScannerViewSet` for search-only functionality.

---

### Example Scenario: User Uploads a Prescription for "Paracetamol 500mg twice daily" (Asynchronous AI/OCR Flow)

Let's trace the flow when a user uploads a prescription image containing "Paracetamol 500mg twice daily".

1.  **User Action (Mobile App)**: A user opens the Pharmacy Mobile App, navigates to the "Scan Prescription" screen (`PrescriptionScanFlowScreen.dart`), and takes a clear photo of their prescription.
2.  **Mobile App Upload**: The app calls `_prescriptionService.uploadPrescription()` which sends the image file (e.g., `prescription.jpg`) as `multipart/form-data` to the backend endpoint `http://127.0.0.1:8000/api/prescriptions/mobile/upload/`.
3.  **Backend Initial Record**: The backend's `mobile_api.py` receives the image. It saves the image to `media/prescriptions/` (e.g., `prescriptions/user_id_20251105_143000_prescription.jpg`). A new `Prescription` record is created in the database with:
    *   `user = <current_user>`
    *   `image_url = /media/prescriptions/user_id_20251105_143000_prescription.jpg`
    *   `status = 'pending_ocr'`
    *   `verification_status = 'Pending_AI_Processing'`
    *   `id = <generated_uuid>`
4.  **Asynchronous OCR Task Trigger**: Immediately after creating the `Prescription` record, `mobile_api.py` triggers a Celery task: `process_prescription_ocr_task.delay(<prescription_uuid>, <image_file_path>, <user_id>)`.
5.  **AI Processing (`ocr_service.py`)**:
    *   A Celery worker picks up the `process_prescription_ocr_task`.
    *   Inside the task, an `OCRService` instance is created.
    *   `ocr_service.process_prescription_image(<image_file_path>)` is called.
    *   The `extract_text_from_prescription` method sends the image to Google Gemini AI.
    *   Gemini AI analyzes the image and returns structured JSON data, for example:
        ```json
        {
            "medicines": [
                {
                    "medicine_name": "Paracetamol",
                    "generic_name": "Paracetamol",
                    "composition": "Paracetamol 500mg",
                    "strength": "500mg",
                    "form": "tablet",
                    "frequency": "twice daily",
                    "quantity_duration": "for 5 days"
                }
            ]
        }
        ```
    *   The `match_medicines_by_composition` method then takes this extracted data. It searches the local `Product` database for products matching "Paracetamol 500mg" composition. Let's say it finds a product named "Crocin Advance" (which has "Paracetamol 500mg" as its composition).
6.  **Backend Updates (`tasks.py`)**:
    *   The `process_prescription_ocr_task` receives the results from `OCRService`.
    *   It updates the `Prescription` record:
        *   `ai_processed = True`
        *   `ai_confidence_score = 0.92` (example score)
        *   `status = 'pending_verification'`
        *   `verification_status = 'Pending_Review'`
    *   A `PrescriptionMedicine` record is created for the extracted medicine:
        *   `prescription = <linked_prescription_object>`
        *   `extracted_medicine_name = "Paracetamol"`
        *   `extracted_dosage = "500mg"`
        *   `extracted_frequency = "twice daily"`
        *   `suggested_medicine = <Crocin_Advance_Product_Object>`
        *   `ai_confidence_score = 0.85` (example match confidence)
        *   `verification_status = 'pending'`
    *   A `PrescriptionWorkflowLog` entry is created, recording the transition from `pending_ocr` to `pending_verification`.
7.  **Mobile App Displays Results**:
    *   The `PrescriptionProcessingScreen.dart` (or `PrescriptionScanFlowScreen.dart`) continuously polls the backend.
    *   When `ApiService.getPrescriptionStatus()` returns `is_ready: true` and `status: 'Pending_Review'`, the app knows processing is complete.
    *   It then calls `ApiService.getMedicineSuggestions()`, which returns the `PrescriptionMedicine` data.
    *   The `PrescriptionResultDisplayScreen.dart` (or `PrescriptionResultScreen.dart`) is shown to the user. It displays:
        *   "Paracetamol" (extracted medicine name)
        *   "Dosage: 500mg"
        *   "In Stock" (if "Crocin Advance" is available)
        *   An option to "View Product Details" for "Crocin Advance".
8.  **User Action (Order)**: The user can then select "Crocin Advance" from the suggestions, specify the quantity (e.g., 1 strip of 10 tablets), and proceed to place an order, which uses the `create_prescription_order` endpoint.

---

### 2. Synchronous OCR Analysis Flow (Web Test / Alternative Mobile Flow)

This flow is used for direct, immediate OCR analysis without the asynchronous task queue.

**A. Web Interface (`ocr.html`) Component:**

*   **`ocr.html`**:
    *   A simple HTML page allowing users to upload an image.
    *   Converts the image to a base64 string.
    *   Makes a `POST` request to `http://localhost:8000/api/prescriptions/ocr/analyze/`.
    *   Displays the JSON response directly.

**B. Mobile Application (Flutter - `Pharmacy_mobile_app`) Component:**

*   **`PrescriptionCameraScreen.dart`**:
    *   Allows users to take a picture or select from the gallery.
    *   Converts the image to base64.
    *   Calls `ApiService.analyzePrescriptionOCR(base64Image)`, which hits the backend endpoint `http://localhost:8000/api/prescriptions/ocr/analyze/`.
    *   Assumes the backend returns immediate results containing `prescription_id` and `suggestions`, then navigates to `PrescriptionResultScreen`.

**C. Backend (Django - `backend/prescriptions/`) Components:**

*   **`api_service.dart` (Mobile App)**:
    *   **`analyzePrescriptionOCR`**: Sends the base64 image to the backend endpoint `${ApiConfig.prescriptionEndpoint}/ocr/analyze/`.
*   **Backend Endpoint (`/api/prescriptions/ocr/analyze/`)**:
    *   While the exact implementation for this endpoint was not explicitly read (e.g., in `views.py` or `enhanced_views.py`), its existence is confirmed by `ocr.html` and `ApiService.analyzePrescriptionOCR`. It is expected to perform OCR analysis synchronously and return the results directly.

---

### 3. Simple Upload for Manual Verification (Non-OCR Flow)

This flow is for uploading prescriptions that do not undergo AI/OCR processing and are intended for manual review by pharmacy staff, typically during checkout.

**A. Mobile Application (Flutter - `Pharmacy_mobile_app`) Components:**

*   **`OrderPrescriptionUploadScreen.dart`**:
    *   Allows users to upload a prescription image.
    *   Calls `PrescriptionService.uploadPrescriptionSimple()`, which uses `ApiService.uploadPrescriptionForOrder()`. This method sends the image as `multipart/form-data` to the backend endpoint: `http://127.0.0.1:8000/api/prescriptions/upload-for-order/`.
    *   Navigates to `PrescriptionTrackingScreen` after successful upload.

**B. Backend (Django - `backend/prescriptions/`) Components:**

*   **`mobile_api.py`**:
    *   **`upload_prescription_for_order` (POST `/api/prescriptions/upload-for-order/`)**:
        *   Receives the prescription image.
        *   Creates a `Prescription` record with `verification_status='pending_verification'` and `status='pending_verification'`.
        *   Explicitly sets `ai_processed=False`, indicating no AI/OCR processing.
        *   This endpoint is for manual verification only.
    *   **`upload_prescription_for_paid_order` (POST `/api/prescriptions/upload-for-paid-order/`)**:
        *   Similar to `upload_prescription_for_order`, but specifically for orders where payment has already been confirmed. It also bypasses AI/OCR.

---

### Summary of OCR Flow

The primary OCR flow is asynchronous, initiated by the mobile app uploading an image, which triggers a Celery task on the backend. This task uses Google Gemini AI to extract medicine details and matches them against a local product database based on composition. The mobile app then polls for the results and displays suggested medicines, allowing the user to proceed with an order. An older or alternative synchronous OCR flow also exists, primarily for direct analysis. Additionally, a separate non-OCR flow is available for simple prescription uploads requiring only manual verification.

Based on the comprehensive analysis of the codebase, including models, views, services, and mobile application components, the described OCR process is logically structured and the interactions between different parts of the system are well-defined. Therefore, the process is expected to be working correctly as per the implementation. For absolute confirmation, a live end-to-end test of the application would be required.
