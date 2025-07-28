# Mobile App API - Composition-Based Prescription Processing

## 🎯 Overview

This API enables composition-based prescription processing for mobile applications with the following workflow:

1. **Customer uploads prescription** → Mobile app calls API
2. **AI performs OCR and composition matching** → Returns suggestions
3. **Customer manually selects medicines** → No auto-cart addition
4. **Customer uploads original prescription during checkout** → Creates order
5. **Admin reviews and approves** → Order processed

## 🔗 API Endpoints

### 1. Process Prescription Image (Composition-Based)

**Endpoint:** `POST /prescription/enhanced-prescriptions/mobile_composition_prescription_upload/`

**Purpose:** Upload prescription image for composition-based processing

**Request:**
```http
POST /prescription/enhanced-prescriptions/mobile_composition_prescription_upload/
Content-Type: multipart/form-data

prescription_image: [FILE] (JPG, PNG, PDF - max 10MB)
```

**Response:**
```json
{
  "success": true,
  "message": "Prescription processed successfully",
  "ocr_confidence": 0.85,
  "extracted_text": "1. Paracetamol 500mg - Twice daily\n2. Amoxicillin 250mg - Thrice daily",
  "total_medicines_extracted": 2,
  "extracted_medicines": [
    {
      "medicine_name": "Paracetamol",
      "composition": "paracetamol",
      "strength": "500mg",
      "frequency": "Twice daily",
      "duration": "5 days",
      "form": "tablet",
      "line_number": 1,
      "original_text": "1. Paracetamol 500mg - Twice daily"
    }
  ],
  "composition_matches": [
    {
      "extracted_medicine": {
        "medicine_name": "Paracetamol",
        "composition": "paracetamol",
        "strength": "500mg",
        "frequency": "Twice daily"
      },
      "composition_matches": [
        {
          "product_id": "uuid-123",
          "product_name": "Dolo 650mg",
          "composition": "paracetamol",
          "strength": "650mg",
          "form": "tablet",
          "manufacturer": "Micro Labs",
          "price": 15.00,
          "mrp": 20.00,
          "stock_available": true,
          "stock_quantity": 100,
          "match_score": 0.95,
          "match_type": "exact_match",
          "is_prescription_required": false
        }
      ],
      "user_selected": false,
      "admin_approved": false
    }
  ],
  "match_statistics": {
    "total_composition_matches": 5,
    "exact_matches": 2,
    "high_similarity_matches": 2,
    "average_match_score": 0.82
  },
  "workflow_info": {
    "requires_manual_selection": true,
    "requires_admin_approval": true,
    "auto_cart_addition": false,
    "next_step": "User must manually select medicines from suggestions"
  },
  "instructions": {
    "step_1": "Review extracted medicines and their compositions",
    "step_2": "Manually select medicines from composition-based matches",
    "step_3": "Add selected medicines to cart",
    "step_4": "Upload original prescription during checkout",
    "step_5": "Order will be sent to admin for approval"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid file format. Allowed: JPG, JPEG, PNG, PDF",
  "extracted_medicines": [],
  "composition_matches": []
}
```

### 2. Create Order with Prescription (Mobile Checkout)

**Endpoint:** `POST /order/orders/create_with_prescription/`

**Purpose:** Create order with selected medicines and original prescription

**Request:**
```json
{
  "customer_id": "uuid-customer",
  "selected_medicines": [
    {
      "product_id": "uuid-123",
      "quantity": 2,
      "extracted_medicine_info": {
        "medicine_name": "Paracetamol",
        "composition": "paracetamol",
        "prescribed_dosage": "500mg",
        "prescribed_frequency": "Twice daily"
      }
    }
  ],
  "original_prescription_image": "[BASE64_ENCODED_IMAGE]",
  "delivery_address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "payment_method": "online",
  "notes": "Urgent delivery required"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully and sent for admin approval",
  "order_id": "uuid-order",
  "order_number": "ORD-2025-001",
  "status": "pending_admin_approval",
  "total_amount": 45.00,
  "estimated_delivery": "2025-01-30",
  "workflow_status": {
    "current_step": "admin_review",
    "next_step": "Admin will review prescription and approve/reject order",
    "requires_admin_approval": true
  }
}
```

## 🧬 Composition Matching Logic

### Match Types:
- **exact_match** (90-100%): Same composition and strength
- **high_similarity** (70-89%): Same composition, different strength/form
- **moderate_similarity** (50-69%): Similar composition with variations
- **low_similarity** (30-49%): Partial composition match

### Matching Criteria:
1. **Composition Priority (60%)**: Active ingredients/salts matching
2. **Strength Priority (30%)**: Dosage strength matching  
3. **Form Priority (10%)**: Tablet, capsule, syrup, etc.

## 📱 Mobile App Integration Guide

### Step 1: Prescription Upload
```javascript
const uploadPrescription = async (imageFile) => {
  const formData = new FormData();
  formData.append('prescription_image', imageFile);
  
  const response = await fetch('/api/prescription/enhanced-prescriptions/mobile_composition_prescription_upload/', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
};
```

### Step 2: Display Composition Matches
```javascript
const displayMatches = (compositionMatches) => {
  return compositionMatches.map(match => (
    <div key={match.extracted_medicine.medicine_name}>
      <h3>Extracted: {match.extracted_medicine.medicine_name}</h3>
      <p>Composition: {match.extracted_medicine.composition}</p>
      
      <div>Available Matches:</div>
      {match.composition_matches.map(product => (
        <div key={product.product_id}>
          <h4>{product.product_name}</h4>
          <p>Match: {Math.round(product.match_score * 100)}% ({product.match_type})</p>
          <p>Price: ₹{product.price}</p>
          <button onClick={() => selectMedicine(product)}>
            Select This Medicine
          </button>
        </div>
      ))}
    </div>
  ));
};
```

### Step 3: Manual Selection & Cart
```javascript
const [selectedMedicines, setSelectedMedicines] = useState([]);

const selectMedicine = (product, extractedInfo) => {
  setSelectedMedicines(prev => [...prev, {
    product_id: product.product_id,
    quantity: 1,
    extracted_medicine_info: extractedInfo
  }]);
};
```

### Step 4: Checkout with Original Prescription
```javascript
const checkout = async (selectedMedicines, prescriptionImage) => {
  const orderData = {
    customer_id: currentUser.id,
    selected_medicines: selectedMedicines,
    original_prescription_image: await convertToBase64(prescriptionImage),
    delivery_address: userAddress,
    payment_method: 'online'
  };
  
  const response = await fetch('/api/order/orders/create_with_prescription/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  
  return await response.json();
};
```

## 🔐 Admin Dashboard Integration

The admin dashboard receives orders created through this workflow and provides:

1. **Prescription Review**: View original prescription and AI extraction results
2. **Medicine Validation**: Check customer selections against prescriptions
3. **Composition Verification**: Validate composition-based matches
4. **Approval Workflow**: Approve, reject, or request clarification
5. **Order Processing**: Process approved orders for delivery

## ⚠️ Important Notes

1. **No Auto-Cart Addition**: AI only provides suggestions, users must manually select
2. **Original Prescription Required**: Must be uploaded during checkout
3. **Admin Approval Mandatory**: All orders require admin review and approval
4. **Composition-Based Matching**: Matches based on active ingredients, not brand names
5. **User-Controlled Workflow**: Complete user control over medicine selection

## 🚀 Error Handling

### Common Error Codes:
- `400`: Invalid file format or missing prescription image
- `413`: File size too large (>10MB)
- `422`: OCR processing failed
- `500`: Server error during processing

### Retry Logic:
Implement exponential backoff for failed requests with maximum 3 retry attempts.

## 📊 Analytics & Monitoring

Track the following metrics:
- OCR success rate
- Composition match accuracy
- User selection patterns
- Admin approval rates
- Order completion rates
