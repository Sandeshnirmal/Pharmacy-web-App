# Pharmacy Web App - API Documentation

## Overview

This document provides comprehensive documentation for the Pharmacy Web App backend APIs. The system implements a payment-first order flow with prescription verification and professional courier integration.

## Base URL
- Development: `http://localhost:8000`
- Production: `https://your-domain.com`

## Authentication

### JWT Authentication (Web Dashboard)
```
POST /api/token/
POST /api/token/refresh/
POST /api/token/verify/
```

### Token Authentication (Mobile App)
```
POST /api/auth/login/
POST /api/auth/register/
POST /api/auth/logout/
```

## API Endpoints Structure

### 1. Customer Flow (Flutter Mobile App)

#### Enhanced Order Process: Payment → Prescription Upload → Verification → Confirmation

**Step 1: Create Paid Order**
```
POST /api/order/enhanced/create-paid-order/
Authorization: Bearer <token>

Request Body:
{
    "items": [
        {"product_id": 1, "quantity": 2},
        {"product_id": 2, "quantity": 1}
    ],
    "delivery_address": {
        "name": "John Doe",
        "phone": "+91-9876543210",
        "address_line_1": "123 Main Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001"
    },
    "payment_data": {
        "method": "RAZORPAY",
        "payment_id": "pay_xyz123",
        "amount": 500.00
    }
}

Response:
{
    "success": true,
    "order_id": 123,
    "order_number": "ORD000123",
    "status": "payment_completed",
    "total_amount": 500.00,
    "message": "Order created successfully. Please upload prescription for verification."
}
```

**Step 2: Link Prescription to Order**
```
POST /api/order/enhanced/{order_id}/link-prescription/
Authorization: Bearer <token>

Request Body:
{
    "prescription_id": 456
}

Response:
{
    "success": true,
    "order_id": 123,
    "status": "prescription_uploaded",
    "prescription_id": 456,
    "message": "Prescription linked to order. Awaiting admin verification."
}
```

**Step 3: Get Orders Awaiting Prescription**
```
GET /api/order/enhanced/awaiting-prescription/
Authorization: Bearer <token>

Response:
{
    "success": true,
    "orders": [
        {
            "id": 123,
            "order_number": "ORD000123",
            "total_amount": 500.00,
            "status": "payment_completed",
            "created_at": "2024-01-15T10:30:00Z",
            "delivery_address": {...}
        }
    ],
    "total_orders": 1
}
```

#### Prescription Scanner: Scan prescriptions and get medicine suggestions

**Scan Prescription Text**
```
POST /api/prescriptions/scanner/scan_prescription/
Content-Type: application/json
Authorization: Bearer <token> (optional)

Request Body:
{
    "prescription_text": "Paracetamol 650mg twice daily\nAugmentin 625mg thrice daily\nAmlodipine 5mg once daily"
}

Response:
{
    "success": true,
    "extracted_medicines": [
        {
            "extracted_name": "Paracetamol",
            "composition": "",
            "strength": "650mg",
            "original_line": "Paracetamol 650mg twice daily"
        },
        {
            "extracted_name": "Augmentin",
            "composition": "",
            "strength": "625mg",
            "original_line": "Augmentin 625mg thrice daily"
        }
    ],
    "suggestions": [
        {
            "product_id": 1,
            "name": "Crocin 650mg",
            "brand_name": "Crocin",
            "generic_name": "Paracetamol",
            "manufacturer": "Sample Pharma Ltd",
            "category": "Analgesics",
            "compositions": [
                {
                    "name": "Paracetamol",
                    "strength": "650",
                    "unit": "mg",
                    "is_primary": true
                }
            ],
            "price": 100.0,
            "mrp": 120.0,
            "is_prescription_required": true,
            "stock_quantity": 100,
            "match_type": "exact_name",
            "confidence_score": 1.0
        }
    ],
    "total_suggestions": 3,
    "message": "Found 3 medicine suggestions based on composition matching"
}
```

#### Medicine Search: Search by name, composition, or generic name

**Search Medicines**
```
GET /api/prescriptions/scanner/search_medicines/?q=paracetamol&type=name
Content-Type: application/json
Authorization: Bearer <token> (optional)

Parameters:
- q: Search query (required)
- type: Search type - 'name', 'composition', 'generic' (default: 'name')

Response:
{
    "success": true,
    "query": "paracetamol",
    "search_type": "name",
    "suggestions": [
        {
            "product_id": 1,
            "name": "Paracetamol 500mg Tablets",
            "brand_name": "",
            "generic_name": "Paracetamol",
            "manufacturer": "Cipla Ltd",
            "category": "Pain Relief",
            "compositions": [],
            "price": 25.0,
            "mrp": 30.0,
            "is_prescription_required": false,
            "stock_quantity": 100,
            "match_type": "partial_name",
            "search_term": "paracetamol",
            "confidence_score": 0.7
        }
    ],
    "total_suggestions": 1
}
```

#### Order Tracking: Real-time courier tracking

**Track Order**
```
GET /api/order/tracking/{order_id}/
Authorization: Bearer <token>

Response:
{
    "success": true,
    "tracking_data": {
        "order_id": 123,
        "tracking_number": "PC20240115000123",
        "status": "in_transit",
        "current_location": "Distribution Center",
        "estimated_delivery": "2024-01-17T18:00:00Z",
        "tracking_history": [
            {
                "status": "pending",
                "location": "Pharmacy",
                "timestamp": "2024-01-15T10:30:00Z",
                "description": "Shipment created and ready for pickup"
            },
            {
                "status": "picked_up",
                "location": "Pharmacy",
                "timestamp": "2024-01-15T14:00:00Z",
                "description": "Package picked up by courier"
            }
        ]
    }
}
```

**Track Courier Shipment**
```
GET /api/courier/shipments/track/?tracking_number=PC20240115000123
Authorization: Bearer <token>

Response:
{
    "tracking_number": "PC20240115000123",
    "status": "in_transit",
    "status_display": "In Transit",
    "current_location": "Distribution Center",
    "estimated_delivery": "2024-01-17T18:00:00Z",
    "tracking_history": [...]
}
```

### 2. Admin Flow (React Dashboard)

#### Prescription Review Dashboard: Manage orders awaiting verification

**Get Orders for Prescription Review**
```
GET /api/order/enhanced/prescription-review/
Authorization: Bearer <token>
Permissions: Staff/Admin only

Response:
{
    "success": true,
    "orders": [
        {
            "id": 123,
            "order_number": "ORD000123",
            "user": {
                "id": 1,
                "username": "john_doe",
                "email": "john@example.com"
            },
            "total_amount": 500.00,
            "status": "prescription_uploaded",
            "prescription": {
                "id": 456,
                "upload_date": "2024-01-15T11:00:00Z",
                "image_url": "https://example.com/prescription.jpg"
            },
            "created_at": "2024-01-15T10:30:00Z",
            "delivery_address": {...}
        }
    ],
    "total_orders": 1
}
```

**Verify Prescription and Confirm Order**
```
POST /api/order/enhanced/{order_id}/verify-prescription/
Authorization: Bearer <token>
Permissions: Staff/Admin only

Request Body:
{
    "approved": true,
    "verification_notes": "Prescription verified. All medicines are appropriate for the patient's condition."
}

Response:
{
    "success": true,
    "order_id": 123,
    "status": "verified",
    "approved": true,
    "courier_scheduled": true,
    "tracking_number": "PC20240115000123",
    "message": "Prescription approved successfully."
}
```

#### Courier Integration: Shipment management and tracking

**Get Courier Partners**
```
GET /api/courier/partners/
Authorization: Bearer <token>

Response:
[
    {
        "id": 1,
        "name": "Professional Courier Services",
        "courier_type": "professional",
        "is_active": true,
        "service_areas": ["560001", "560002", "560003"]
    }
]
```

**Create Shipment**
```
POST /api/courier/shipments/create_shipment/
Authorization: Bearer <token>

Request Body:
{
    "order_id": 123,
    "courier_type": "professional",
    "pickup_address": {
        "name": "InfxMart Pharmacy",
        "phone": "+91-9876543210",
        "address_line_1": "123 Pharmacy Street",
        "city": "Bangalore",
        "state": "Karnataka",
        "pincode": "560001"
    },
    "delivery_address": {
        "name": "John Doe",
        "phone": "+91-9876543210",
        "address_line_1": "123 Main Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001"
    },
    "delivery_contact": "+91-9876543210"
}

Response:
{
    "id": "uuid-string",
    "order_number": "ORD000123",
    "courier_partner_name": "Professional Courier Services",
    "tracking_number": "PC20240115000123",
    "status": "pending",
    "estimated_delivery": "2024-01-17T18:00:00Z",
    "pickup_scheduled": "2024-01-16T10:00:00Z",
    "shipping_charges": 50.0,
    "created_at": "2024-01-15T10:30:00Z"
}
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
    "success": false,
    "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Rate Limiting

- Prescription scanner: 100 requests per hour per IP
- Medicine search: 200 requests per hour per IP
- Order creation: 10 requests per hour per authenticated user
- Other endpoints: 1000 requests per hour per authenticated user

## Notes

1. **Prescription Scanner**: This is for search-only functionality and does not create orders or affect the admin dashboard.

2. **Order Flow**: The system implements a payment-first approach where customers pay before prescription verification.

3. **Authentication**: Most endpoints require authentication. The prescription scanner allows unauthenticated access for medicine search.

4. **Courier Integration**: The system uses a professional courier service with real-time tracking capabilities.

5. **Data Validation**: All endpoints include comprehensive input validation and error handling.
