# Payment-First Prescription Flow Implementation

## 🎯 **Complete Payment-First Prescription Order Flow**

This document outlines the implementation of the payment-first prescription flow where customers complete payment (COD or Razorpay) before prescription upload and verification.

## ✅ **New Customer Journey Flow**

### **🔄 Updated Flow: Payment → Prescription → Verification → Order**

#### **Step 1: Cart & Checkout**
- Customer adds medicines to cart
- Proceeds to prescription checkout
- **Must upload prescription image during checkout**
- Fills delivery details
- Selects payment method (COD/Razorpay)

#### **Step 2: Payment Processing**
- **COD**: Order created immediately with "pending_payment" status
- **Razorpay**: Payment processed first, then order created
- **No order creation without payment confirmation**

#### **Step 3: Prescription Upload (After Payment)**
- Prescription uploaded **only after payment confirmation**
- Stored for manual verification (NO AI/OCR processing)
- Order status: "pending_verification"

#### **Step 4: Manual Verification**
- Pharmacy staff manually verifies prescription
- Status updates: pending → under_review → verified/rejected
- Real-time status polling in mobile app

#### **Step 5: Order Confirmation**
- **Only after prescription verification**, order is confirmed
- Order status: "confirmed" → "processing" → "shipped" → "delivered"

## ✅ **Technical Implementation**

### **Mobile App Screens:**

#### **1. Prescription Checkout Screen**
```dart
class PrescriptionCheckoutScreen extends StatefulWidget {
    // Features:
    // - Order summary display
    // - Mandatory prescription upload
    // - Delivery details form
    // - Payment method selection (COD/Razorpay)
    // - Payment processing
}
```

**Key Features:**
- ✅ **Mandatory Prescription**: Cannot proceed without prescription image
- ✅ **Payment Integration**: COD and Razorpay support
- ✅ **Order Creation**: Creates pending order before prescription upload
- ✅ **Error Handling**: Comprehensive validation and error messages

#### **2. Prescription Verification Screen**
```dart
class PrescriptionVerificationScreen extends StatefulWidget {
    // Features:
    // - Payment confirmation display
    // - Real-time verification status
    // - Status polling every 15 seconds
    // - Progress tracking
    // - Automatic order confirmation after verification
}
```

**Key Features:**
- ✅ **Payment Confirmation**: Shows payment success
- ✅ **Status Polling**: Auto-refresh verification status
- ✅ **Progress Tracking**: Visual step-by-step progress
- ✅ **Auto Navigation**: Redirects to order confirmation when verified

### **Backend API Endpoints:**

#### **1. Pending Order Creation**
```
POST /api/order/pending/
Body: {
    "items": [
        {"product_id": 1, "quantity": 2, "price": 25.0}
    ],
    "delivery_address": {
        "name": "John Doe",
        "address": "123 Main St",
        "phone": "+91-9876543210"
    },
    "payment_method": "cod",
    "total_amount": 50.0
}

Response: {
    "success": true,
    "order_id": 123,
    "order_number": "PO20240803ABC12345",
    "status": "pending_payment",
    "payment_method": "cod",
    "total_amount": 50.0
}
```

#### **2. Prescription Upload for Paid Order**
```
POST /api/prescription/upload-for-paid-order/
Body: {
    "order_id": 123,
    "image": "base64_encoded_image_data",
    "payment_confirmed": true
}

Response: {
    "success": true,
    "prescription_id": 456,
    "image_url": "https://...",
    "status": "pending_verification"
}
```

#### **3. Verification Status Polling**
```
GET /api/prescription/verification-status/456/

Response: {
    "success": true,
    "prescription_id": 456,
    "status": "pending_verification", // or "under_review", "verified", "rejected"
    "verification_notes": "Prescription is in queue for verification",
    "image_url": "https://...",
    "order_id": 123,
    "payment_confirmed": true
}
```

#### **4. Order Confirmation After Verification**
```
POST /api/order/confirm-prescription/123/

Response: {
    "success": true,
    "order_id": 123,
    "order_number": "PO20240803ABC12345",
    "status": "confirmed"
}
```

### **Backend Implementation Details:**

#### **Order Model Updates:**
```python
class Order(models.Model):
    order_status = models.CharField(
        choices=[
            ('pending_payment', 'Pending Payment'),
            ('pending_verification', 'Pending Prescription Verification'),
            ('confirmed', 'Confirmed'),
            ('processing', 'Processing'),
            ('shipped', 'Shipped'),
            ('delivered', 'Delivered'),
            ('cancelled', 'Cancelled'),
        ]
    )
    payment_status = models.CharField(
        choices=[
            ('pending', 'Pending'),
            ('paid', 'Paid'),
            ('failed', 'Failed'),
            ('refunded', 'Refunded'),
        ]
    )
    is_prescription_order = models.BooleanField(default=False)
    order_type = models.CharField(default='prescription')
```

#### **Prescription Model Updates:**
```python
class Prescription(models.Model):
    order_id = models.IntegerField(null=True, blank=True)
    payment_confirmed = models.BooleanField(default=False)
    verification_status = models.CharField(
        choices=[
            ('pending_verification', 'Pending Verification'),
            ('under_review', 'Under Review'),
            ('verified', 'Verified'),
            ('rejected', 'Rejected'),
        ]
    )
    ai_processed = models.BooleanField(default=False)  # Always False for order verification
```

## ✅ **Flow Control Logic**

### **Payment-First Enforcement:**
```python
def create_pending_order(request):
    # 1. Validate cart items
    # 2. Create order with "pending_payment" status
    # 3. Return order details for payment processing
    # 4. NO prescription upload until payment confirmed

def upload_prescription_for_paid_order(request):
    # 1. Verify payment_confirmed = True
    # 2. Upload prescription image (base64)
    # 3. Create prescription record with order_id
    # 4. Set status = "pending_verification"
    # 5. NO AI/OCR processing - manual verification only

def confirm_prescription_order(request, order_id):
    # 1. Verify prescription is verified
    # 2. Update order status to "confirmed"
    # 3. Trigger order processing workflow
```

### **Status Flow:**
```
Order Creation: pending_payment
    ↓ (after payment)
Payment Confirmed: pending_verification
    ↓ (prescription uploaded)
Prescription Uploaded: pending_verification
    ↓ (manual review)
Under Review: under_review
    ↓ (pharmacy verification)
Verified: verified → Order Confirmed
    ↓ (automatic)
Order Processing: confirmed → processing → shipped → delivered
```

## ✅ **Mobile App Integration**

### **Navigation Flow:**
```dart
// Cart Screen
CartScreen → PrescriptionCheckoutScreen

// Checkout Process
PrescriptionCheckoutScreen → PaymentProcessing → PrescriptionVerificationScreen

// Verification Process
PrescriptionVerificationScreen → (polling) → OrderConfirmationScreen

// Order Tracking
OrderConfirmationScreen → OrderTrackingScreen
```

### **API Service Methods:**
```dart
class ApiService {
    // Create pending order before payment
    Future<ApiResponse<Map<String, dynamic>>> createPendingOrder(orderData);
    
    // Upload prescription after payment confirmation
    Future<ApiResponse<Map<String, dynamic>>> uploadPrescriptionForPaidOrder(prescriptionData);
    
    // Poll verification status
    Future<ApiResponse<Map<String, dynamic>>> getPrescriptionVerificationStatus(prescriptionId);
    
    // Confirm order after verification
    Future<ApiResponse<Map<String, dynamic>>> confirmPrescriptionOrder(orderId);
}
```

## ✅ **Key Benefits**

### **1. Payment Security:**
- ✅ **Payment First**: No order processing without payment
- ✅ **Fraud Prevention**: Prescription verified after payment commitment
- ✅ **Revenue Protection**: Reduces abandoned orders

### **2. Operational Efficiency:**
- ✅ **Manual Verification**: No AI dependency for order verification
- ✅ **Clear Workflow**: Defined steps for pharmacy staff
- ✅ **Status Tracking**: Real-time updates for customers

### **3. Customer Experience:**
- ✅ **Transparent Process**: Clear status updates
- ✅ **Payment Options**: COD and online payment support
- ✅ **Real-time Updates**: Live verification status

## ✅ **Error Handling**

### **Payment Failures:**
- Order remains in "pending_payment" status
- Customer can retry payment
- No prescription upload until payment success

### **Prescription Rejection:**
- Order status remains "pending_verification"
- Customer notified with rejection reason
- Option to re-upload prescription

### **Verification Delays:**
- Status polling continues
- Customer sees "under_review" status
- Estimated verification time displayed

## 🚀 **Usage Instructions**

### **For Customers:**
1. **Add medicines to cart** → Proceed to checkout
2. **Upload prescription** → Fill delivery details → Select payment
3. **Complete payment** → Wait for prescription verification
4. **Track verification** → Receive order confirmation
5. **Track delivery** → Receive medicines

### **For Pharmacy Staff:**
1. **Receive verification request** → Review prescription image
2. **Verify prescription** → Update status (verified/rejected)
3. **Add verification notes** → Trigger order confirmation
4. **Process order** → Prepare medicines for delivery

## 🎉 **Implementation Complete**

### **✅ All Components Implemented:**
1. **Prescription Checkout Screen**: ✅ Payment-first checkout flow
2. **Prescription Verification Screen**: ✅ Real-time status tracking
3. **Backend APIs**: ✅ Complete payment-first workflow
4. **Order Management**: ✅ Status-based order processing
5. **Error Handling**: ✅ Comprehensive error management

### **✅ Flow Enforced:**
- **No prescription upload without payment**
- **No order confirmation without verification**
- **Manual verification only (no AI/OCR)**
- **Real-time status updates**

**The complete payment-first prescription flow is now fully implemented!** 🎉✨

Customers must complete payment before prescription upload, ensuring revenue security and proper verification workflow.
