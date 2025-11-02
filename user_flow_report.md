# User Flow Report - Pharmacy Web App

This document outlines the typical user flows for Pharmacists, Administrators, and Customers within the Pharmacy Web Application, detailing their key interactions and functionalities.

## 1. Pharmacist Flow

Pharmacists primarily interact with the system to manage prescriptions and inventory, ensuring accurate and safe dispensing of medicines.

### Key Responsibilities:
- Reviewing and verifying prescriptions.
- Managing medicine inventory and batches.
- Potentially assisting with order processing.

### Workflow:

1.  **Login**:
    *   Pharmacist logs into the system using their credentials via the `Login.jsx` page.
    *   Upon successful login, they are redirected to the Dashboard.

2.  **Dashboard Overview (`Dashboard.jsx`)**:
    *   Views key statistics relevant to pharmacy operations, such as total orders, prescription orders, pending reviews, and low stock alerts.
    *   Quickly identifies urgent tasks like pending prescription reviews or critical inventory levels.

3.  **Prescription Management (`PrescriptionReview.jsx`, `/Prescription` route)**:
    *   Navigates to the Prescription section (e.g., via a link on the Dashboard or a dedicated menu item).
    *   **View Pending Prescriptions**: Accesses a list of prescriptions awaiting review.
    *   **Review Individual Prescription**:
        *   Selects a prescription to view its details (`PrescriptionReview.jsx`).
        *   Examines the uploaded prescription image.
        *   Reviews AI-extracted medicine names, dosages, forms, frequencies, and quantities.
        *   **Map Products**: For each extracted medicine, searches for and maps it to an actual product in the inventory. The system may suggest products.
        *   **Add Medicines**: Manually adds additional medicines to the prescription if needed.
        *   **Add Notes**: Records any relevant pharmacist notes.
        *   **Approve Prescription**: If all medicines are mapped and verified, approves the prescription, changing its status to "Verified".
        *   **Reject Prescription**: If the prescription cannot be fulfilled or has issues, rejects it, providing a reason.
    *   **Order Creation (Implicit)**: Once a prescription is verified, it can proceed to order fulfillment.

4.  **Inventory Management (`InventoryManagement.jsx`, `/Inventory` route)**:
    *   Navigates to the Inventory Management section.
    *   **View Product List**: Sees a paginated list of all medicines, including stock levels, categories, generic names, and expiry statuses.
    *   **Search and Filter**: Searches for specific products or filters by stock status (low, out of stock).
    *   **Monitor Stock Levels**: Identifies low stock or out-of-stock items from the overview statistics and table.
    *   **Manage Batches**:
        *   Selects a product to view its batches.
        *   **Add New Batch**: Adds new stock by providing batch number, quantity, expiry date, cost price, MRP, and discount percentage.
        *   **Edit Batch**: Adjusts details like discount percentage for existing batches.
    *   **Add New Product/Category/Generic Name/Composition**: Creates new entries for medicines, categories, generic names, or compositions as needed.

## 2. Administrator Flow

Administrators have a broader oversight of the entire pharmacy operation, including user management, order fulfillment, and overall system health.

### Key Responsibilities:
- Monitoring overall business performance.
- Managing customer orders.
- Overseeing inventory.
- Managing user accounts.
- Accessing reports and analytics.

### Workflow:

1.  **Login**:
    *   Administrator logs into the system using their credentials via the `Login.jsx` page.
    *   Upon successful login, they are redirected to the Dashboard.

2.  **Dashboard Overview (`Dashboard.jsx`)**:
    *   Accesses a comprehensive overview of the pharmacy's performance, including total orders, revenue, active customers, prescription orders, and low stock alerts.
    *   Uses quick action links to navigate to key management areas (Orders, Inventory, Customers, Analytics).
    *   Manually refreshes data to get the latest statistics.

3.  **Order Management (`OrdersTable.jsx`, `/Orders` route)**:
    *   Navigates to the Order Management section.
    *   **View All Orders**: Sees a paginated list of all customer orders, including order ID, customer details, order date, total amount, order status, and prescription status.
    *   **Search and Filter**: Searches for specific orders by ID, customer name/email, or filters by order status.
    *   **Update Order Status**: Changes the status of individual orders (e.g., from Pending to Processing, Shipped, Delivered).
    *   **Bulk Actions**: Selects multiple orders to perform bulk status updates (e.g., mark multiple orders as "Shipped").
    *   **View Order Details**: Clicks on an order to view its detailed information (e.g., `/Orders/OrderDetails`).

4.  **Inventory Management (`InventoryManagement.jsx`, `/Inventory` route)**:
    *   Same functionality as the Pharmacist flow, allowing full control over product and batch management.

5.  **Customer Management (`CustomerManagement.jsx`, `/Customers` route - *inferred*)**:
    *   Navigates to a customer management section (e.g., `/Customers`).
    *   Views a list of registered customers.
    *   Manages customer accounts (e.g., view details, activate/deactivate).

6.  **Reports and Analytics (`ReportsAnalytics.jsx`, `/ReportsAnalytics` route - *inferred*)**:
    *   Navigates to the Reports and Analytics section.
    *   Accesses various reports on sales, inventory, customer behavior, etc., to gain business insights.

## 3. Customer Flow (Mobile App / E-commerce Frontend)

Customers interact with the system primarily through a mobile application or a separate e-commerce frontend (implied by the dashboard's "Mobile App Admin" and "E-Commerce Platform" tags).

### Key Responsibilities:
- Browsing and searching for medicines.
- Placing orders, including prescription orders.
- Managing their profile and viewing order history.

### Workflow:

1.  **Account Management (`LoginScreen.dart`, `RegisterScreen.dart`, `EditProfileScreen.dart` - *from mobile app files*)**:
    *   **Registration**: Creates a new account.
    *   **Login**: Logs into their existing account.
    *   **Profile Management**: Views and updates personal information.

2.  **Product Browsing and Search (`SearchResultsScreen.dart`, `ProductDetailsScreen.dart` - *from mobile app files*)**:
    *   **Search**: Searches for medicines by name, generic name, or category.
    *   **Browse Categories**: Explores medicines by category.
    *   **View Product Details**: Selects a product to view detailed information, including price, strength, description, and stock availability.

3.  **Order Placement**:
    *   **Add to Cart (`CartScreen.dart`)**: Adds desired medicines to their shopping cart.
    *   **Checkout (`CheckoutScreen.dart`)**: Proceeds to checkout, where they can:
        *   Review cart items.
        *   Enter shipping information.
        *   Select payment method.
    *   **Prescription Upload (`OrderPrescriptionUploadScreen.dart`, `PrescriptionCameraScreen.dart`)**:
        *   If the order contains prescription-required medicines, uploads a prescription image (e.g., by taking a photo or selecting from gallery).
        *   Submits the order.

4.  **Order Tracking and History (`OrderConfirmationScreen.dart` - *inferred*)**:
    *   **Order Confirmation**: Receives confirmation after placing an order.
    *   **View Order History**: Accesses a list of past and current orders, including their status.
    *   **Track Order Status**: Monitors the progress of active orders (e.g., Pending, Processing, Shipped, Delivered).
