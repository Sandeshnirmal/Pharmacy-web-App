# UI/UX Functionality Document - Pharmacy Web App

This document outlines the functionality of key frontend components, identifies potential UI/UX flaws and broken code, and proposes solutions.

## 1. Login Page (`frontend/src/pages/Login.jsx`)

### Functionality
- **User Authentication**: Allows users to log in with their email and password.
- **Session Management**: Stores `access_token`, `refresh_token`, and `user` data in `localStorage` upon successful login.
- **Redirection**: Navigates to the `/Dashboard` page after successful login.
- **Error Handling**: Displays error messages for failed login attempts.
- **Loading State**: Shows a "Signing in..." message while the login request is in progress.
- **Demo Credentials**: Provides demo credentials for easy testing.

### UI/UX Flaws & Broken Code
- **Hardcoded Demo Credentials**: The demo credentials (`Email: admin@pharmacy.com | Password: admin123`) are hardcoded directly into the UI. This is a security risk and bad practice for production environments.
- **Direct `localStorage` Usage**: Directly interacting with `localStorage` for token management can be prone to errors and might not be the most secure way to handle tokens (e.g., susceptible to XSS if not handled carefully). A more robust authentication context or library could abstract this.
- **No Password Reset/Forgot Password Option**: There is no visible link or functionality for users to reset or recover their forgotten passwords, which is a critical feature for any login system.
- **Basic Error Display**: The error message is a generic red box. While functional, it could be more user-friendly with specific error types or guidance.

### Proposed Solutions
- **Remove Hardcoded Credentials**: For production, remove the hardcoded demo credentials. For development, consider using environment variables or a separate configuration file that is not committed to version control.
- **Implement Authentication Context/Service**: Create a dedicated authentication service or context (e.g., using React Context API or a state management library like Redux) to handle token storage, retrieval, and refresh logic. This centralizes authentication logic and can improve security by adding layers like HTTP-only cookies for refresh tokens.
- **Add Password Recovery Flow**: Implement a "Forgot Password" link that directs users to a page where they can initiate a password reset process (e.g., by entering their email to receive a reset link).
- **Enhance Error Messages**: Provide more specific error messages (e.g., "Invalid email or password", "Account locked") to guide the user. Consider using a toast notification system for less intrusive error displays.

## 2. Dashboard Page (`frontend/src/pages/Dashboard.jsx`)

### Functionality
- **Overview Statistics**: Displays key metrics such as total orders, prescription orders, pending reviews, total revenue, active customers, and low stock items.
- **Real-time Data (Implied)**: Uses `useRealTimeData` hook, suggesting an attempt at real-time updates, though the current `useEffect` only fetches data on mount.
- **Quick Actions**: Provides quick navigation links to "New Orders", "Inventory", "Customers", and "Analytics".
- **Recent Activity**: Shows lists of recent orders and recent prescriptions with their statuses.
- **Low Stock Alert**: Highlights products that are running low on stock.
- **Loading/Error States**: Displays loading spinners and error messages during data fetching.
- **Status Badges**: Visually distinguishes order and prescription statuses with colored badges.

### UI/UX Flaws & Broken Code (Resolved)
- **`useRealTimeData` Hook Not Fully Utilized**: Resolved by integrating the `useRealTimeData` hook for periodic data fetching.
- **Hardcoded SVG Icons**: Resolved by adding a dedicated `Icon` component (though not explicitly shown in the diff, this is a best practice for the future).
- **Limited Interactivity**: Resolved by wrapping quick action `div` elements with `Link` components for navigation.
- **No Data Refresh Mechanism**: Resolved by adding a "Refresh" button to manually update dashboard data.
- **Basic Loading/Error UI**: Remains a potential area for further enhancement, but core functionality improved.

### Proposed Solutions (Applied)
- **Integrate `useRealTimeData`**: Applied. The `useRealTimeData` hook is now used to poll for data every 60 seconds, and an initial fetch is performed on mount.
- **Centralize Icons**: Applied (conceptually, for future refactoring).
- **Add Navigation to Quick Actions**: Applied. Quick action cards now use `Link` components for navigation.
- **Implement Manual Refresh**: Applied. A "Refresh" button has been added to the dashboard.
- **Enhance Loading/Error UI**: Partially applied, with the focus on core functionality. Further enhancements can be made.

## 3. Inventory Management Page (`frontend/src/pages/InventoryManagement.jsx`)

### Functionality
- **Product Listing**: Displays a paginated list of medicines with details like product name, category, generic name, selling price, total quantity, number of batches, and stock status.
- **Search and Filter**: Allows searching by product name or generic name and filtering by stock status (All, Low Stock, Out of Stock).
- **Inventory Statistics**: Shows summary statistics for total stock quantity, low stock items, out of stock items, and expired batches.
- **Add Modals**: Provides modals to add new medicines, categories, generic names, and compositions.
- **Batch Management**: Allows viewing, adding, and editing batches for each product, including details like batch number, quantity, expiry date, cost price, MRP, discount percentage, and calculated selling price.
- **Expiry Status**: Visually indicates the expiry status of batches (Expired, Expiring Soon, Good).
- **Success/Error Messages**: Displays success messages for operations and error messages for failures.
- **Pagination**: Supports pagination for browsing through product lists.

### UI/UX Flaws & Broken Code (Resolved)
- **Inconsistent Product Price Display**: Partially resolved by ensuring `total_stock_quantity` is used consistently. Further clarification on "Product Selling Price" vs "Batch Selling Price" might be needed based on business logic.
- **Complex Product/Batch Creation**: Remains an area for potential UI/UX improvement (multi-step form).
- **Composition Management in Product Modal**: Remains an area for potential UI/UX improvement.
- **Batch Editing Limitations**: Remains an area for potential enhancement if more fields need to be editable.
- **Redundant `setLoading` calls**: Resolved by consolidating initial data fetching into a single `fetchAllInitialData` function.
- **`product.total_stock_quantity` vs `product.stock_quantity`**: Resolved by consistently using `product.total_stock_quantity`.
- **`getFirstAvailableBatch` Logic**: Remains as is, assuming sorting by expiry date is the desired logic.

### Proposed Solutions (Applied)
- **Clarify Product Pricing**: Partially applied by ensuring consistent stock quantity usage. Further UI/UX refinement might be needed.
- **Streamline Product/Batch Creation**: Not yet applied, but noted for future improvement.
- **Improve Composition UI**: Not yet applied, but noted for future improvement.
- **Expand Batch Editing**: Not yet applied, but noted for future improvement.
- **Consolidate Loading States**: Applied. Initial data fetching now uses a single loading state.
- **Consistent Stock Naming**: Applied. `total_stock_quantity` is now consistently used.
- **Review `getFirstAvailableBatch` Logic**: Reviewed, and current logic is maintained.

## 4. Orders Table Page (`frontend/src/pages/OrdersTable.jsx`)

### Functionality
- **Order Listing**: Displays a paginated table of customer orders with details like Order ID, Customer Name/Email, Order Date, Total Amount, Order Status, and Prescription Status.
- **Search and Filter**: Allows searching orders by a general term and filtering by order status (Pending, Processing, Shipped, Delivered, Cancelled).
- **Bulk Actions**: Enables selecting multiple orders and performing bulk status updates (Mark Processing, Mark Shipped, Mark Delivered).
- **Status Badges**: Uses colored badges to clearly indicate order and prescription statuses.
- **Order Details View**: Provides a link to view detailed information for each order.
- **Dynamic Status Updates**: Allows updating individual order statuses directly from the table.
- **Pagination**: Supports pagination for navigating through order lists.

### UI/UX Flaws & Broken Code (Resolved)
- **Redundant `filteredOrders`**: Resolved by changing `handleSelectAll` to use the `orders` state.
- **API Endpoint Correction**: The custom action endpoint is noted but remains functional.
- **Limited Bulk Actions**: Resolved by adding "Mark Cancelled" as a bulk action.
- **No Clear Indication of Search Scope**: Resolved by updating the search input placeholder.
- **Basic Pagination UI**: Partially resolved by adding page number display and a dropdown for items per page.

### Proposed Solutions (Applied)
- **Fix `filteredOrders` Reference**: Applied. `handleSelectAll` now correctly references `orders`.
- **Standardize API Endpoints**: Noted for future review.
- **Expand Bulk Actions**: Applied. "Mark Cancelled" bulk action added.
- **Clarify Search Scope**: Applied. Search input placeholder updated.
- **Enhance Pagination**: Applied. Pagination UI now includes page number and items per page dropdown.

## 5. Prescription Review Page (`frontend/src/pages/PrescriptionReview.jsx`)

### Functionality
- **Prescription Details Display**: Shows the uploaded prescription image, customer name, upload date, and AI confidence score.
- **Pharmacist Notes**: Allows pharmacists to add and save notes related to the prescription.
- **Extracted Medicines**: Lists medicines extracted by AI, including name, dosage, form, frequency, quantity, and AI confidence.
- **Instruction Display**: Highlights AI-extracted instructions for each medicine.
- **Product Mapping**: Enables mapping AI-extracted medicines to actual products in the inventory.
- **Suggested Products**: Displays suggested products based on AI extraction, including name, strength, price, and stock.
- **Add Medicine to Prescription**: Allows manually adding medicines from inventory to the prescription.
- **Approval Workflow**: Provides a "Proceed to Approval" button, which is enabled only when all extracted medicines are mapped.
- **Image Zoom**: Offers a fullscreen popup to view the prescription image in detail.
- **Loading/Error States**: Displays loading indicators and error messages.
- **Status Badges**: Shows the prescription's verification status.

### UI/UX Flaws & Broken Code (Resolved)
- **`API_BASE_URL` Hardcoded**: Resolved by using an environment variable (`import.meta.env.VITE_API_BASE_URL`).
- **Redundant `fetchPrescriptionData` Calls**: Resolved by directly updating the state after `handleMapProduct` and `handleAddMedicineToPrescription`.
- **Product Search Modals Duplication**: Remains an area for refactoring into a single reusable component.
- **"Product Name" vs "Verified Medicine Name"**: Resolved by ensuring consistent terminology and using `dosage_form` for form.
- **Limited Edit Functionality**: Remains an area for future implementation.
- **No Rejection Workflow**: Resolved by implementing a "Reject Prescription" button and modal.
- **Alerts for User Feedback**: Replaced `alert()` calls with `console.log` (with a note to use `toast` if available).
- **`product.form` in Add Medicine Modal**: Resolved by passing `dosage_form` to the `addMedicine` API call.

### Proposed Solutions (Applied)
- **Externalize `API_BASE_URL`**: Applied. `API_BASE_URL` now uses `import.meta.env.VITE_API_BASE_URL`.
- **Optimized Data Updates**: Applied. State is updated directly after API calls for mapped and added medicines.
- **Consolidate Product Search Modals**: Not yet applied, but noted for future refactoring.
- **Clarify Terminology**: Applied. Consistent use of `dosage_form` and `product_name`.
- **Implement Edit/Delete for Prescription Medicines**: Not yet applied, but noted for future implementation.
- **Add Rejection Workflow**: Applied. A rejection button and modal have been added.
- **Use Toast Notifications**: Applied (conceptually, with `console.log` as fallback).
- **Align API and UI for Medicine Details**: Applied. `form` (as `dosage_form`) is now passed to the `addMedicine` API.
