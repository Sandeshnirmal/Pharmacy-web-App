# 📱 Pharmacy Mobile App - API Integration

## 🚀 **MOBILE APP WITH AI PRESCRIPTION INTEGRATION**

This React Native mobile app integrates with the Django backend to provide AI-powered prescription processing and medicine ordering.

---

## 📋 **FEATURES IMPLEMENTED**

### **🤖 AI Prescription Processing**
- **Camera Integration**: Take prescription photos or select from gallery
- **AI Text Extraction**: Automatic medicine extraction from prescription images
- **Confidence Scoring**: AI confidence levels for extracted medicines
- **Product Mapping**: Maps extracted medicines to available products
- **Real-time Processing**: Live status updates during AI processing

### **🛒 E-commerce Features**
- **Medicine Catalog**: Browse available medicines
- **Smart Ordering**: Order directly from AI suggestions
- **Order Tracking**: Track order status and delivery
- **User Profiles**: Manage user accounts and addresses

### **🔐 Authentication & Security**
- **JWT Authentication**: Secure token-based authentication
- **Auto Token Refresh**: Automatic token renewal
- **Secure Storage**: Encrypted token storage

---

## 🛠️ **SETUP INSTRUCTIONS**

### **1. Prerequisites**
```bash
# Install Node.js (v16 or higher)
# Install Expo CLI
npm install -g expo-cli

# Install React Native CLI (optional)
npm install -g react-native-cli
```

### **2. Project Setup**
```bash
# Navigate to mobile app directory
cd mobile-app

# Install dependencies
npm install

# Start the development server
npm start
```

### **3. Backend Configuration**
Update the API base URL in `src/services/api.js`:
```javascript
const API_CONFIG = {
  BASE_URL: 'http://YOUR_BACKEND_IP:8000', // Update with your backend URL
  TIMEOUT: 10000,
};
```

### **4. Run the App**
```bash
# Start Expo development server
expo start

# Run on Android
expo start --android

# Run on iOS
expo start --ios

# Run on web
expo start --web
```

---

## 📁 **PROJECT STRUCTURE**

```
mobile-app/
├── src/
│   ├── services/
│   │   ├── api.js                    # Main API service
│   │   └── prescriptionService.js    # AI prescription service
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.js        # User authentication
│   │   │   └── RegisterScreen.js     # User registration
│   │   ├── prescription/
│   │   │   ├── PrescriptionCameraScreen.js    # Camera & upload
│   │   │   ├── PrescriptionResultScreen.js    # AI results
│   │   │   └── OrderConfirmationScreen.js     # Order confirmation
│   │   ├── products/
│   │   │   ├── ProductsScreen.js     # Medicine catalog
│   │   │   └── ProductDetailScreen.js # Product details
│   │   ├── orders/
│   │   │   ├── OrdersScreen.js       # Order history
│   │   │   └── OrderDetailScreen.js  # Order details
│   │   └── profile/
│   │       └── ProfileScreen.js      # User profile
│   ├── theme/
│   │   └── theme.js                  # App theme configuration
│   └── components/                   # Reusable components
├── App.js                           # Main app component
├── package.json                     # Dependencies
└── README.md                        # This file
```

---

## 🔌 **API INTEGRATION**

### **✅ Authentication APIs**
```javascript
// Login
await ApiService.login(email, password);

// Register
await ApiService.register(userData);

// Logout
await ApiService.logout();
```

### **✅ Prescription APIs**
```javascript
// Upload prescription image
await ApiService.uploadPrescription(imageUri);

// Check AI processing status
await ApiService.getPrescriptionStatus(prescriptionId);

// Get medicine suggestions
await ApiService.getMedicineSuggestions(prescriptionId);

// Create order from prescription
await ApiService.createPrescriptionOrder(orderData);
```

### **✅ Product APIs**
```javascript
// Get products
await ApiService.getProducts(params);

// Search products
await ApiService.searchProducts(query);
```

### **✅ Order APIs**
```javascript
// Get user orders
await ApiService.getOrders();

// Get order details
await ApiService.getOrderDetails(orderId);
```

---

## 🤖 **AI PRESCRIPTION WORKFLOW**

### **📱 Mobile App Flow**

1. **Capture Prescription**:
   ```javascript
   // Take photo or select from gallery
   const imageUri = await camera.takePictureAsync();
   ```

2. **Upload & Process**:
   ```javascript
   // Upload to backend for AI processing
   const result = await PrescriptionService.uploadPrescription(imageUri);
   ```

3. **Wait for AI Results**:
   ```javascript
   // Wait for AI processing to complete
   const suggestions = await PrescriptionService.waitForProcessing(prescriptionId);
   ```

4. **Display Results**:
   ```javascript
   // Show extracted medicines with confidence scores
   navigation.navigate('PrescriptionResult', { suggestions });
   ```

5. **Create Order**:
   ```javascript
   // Create order from selected medicines
   const order = await PrescriptionService.createOrderFromPrescription(data);
   ```

---

## 🎨 **UI COMPONENTS**

### **✅ Prescription Camera Screen**
- **Camera Interface**: Full-screen camera with overlay
- **Gallery Selection**: Pick images from device gallery
- **Image Preview**: Preview selected prescription image
- **Upload Progress**: Real-time upload and processing status

### **✅ AI Results Screen**
- **Confidence Display**: Visual confidence indicators
- **Medicine Cards**: Detailed medicine information
- **Product Mapping**: Available products with pricing
- **Quantity Selection**: Select quantities for ordering
- **Order Summary**: Total calculation with shipping

### **✅ Order Confirmation**
- **Selected Items**: Review selected medicines
- **Delivery Address**: Choose delivery location
- **Payment Method**: Select payment option
- **Order Placement**: Confirm and place order

---

## 🔧 **CONFIGURATION**

### **✅ API Configuration**
```javascript
// src/services/api.js
const API_CONFIG = {
  BASE_URL: 'http://127.0.0.1:8000',  // Django backend URL
  TIMEOUT: 10000,                      // Request timeout
  RETRY_ATTEMPTS: 3,                   // Retry failed requests
  RETRY_DELAY: 1000,                   // Delay between retries
};
```

### **✅ Theme Configuration**
```javascript
// src/theme/theme.js
export const theme = {
  colors: {
    primary: '#2196F3',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    // ... more colors
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  fontSizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 },
};
```

---

## 📱 **TESTING**

### **✅ Test User Accounts**
```
Customer Account:
Email: customer@pharmacy.com
Password: customer123

Test Prescription Images:
- Use sample prescription images
- Test with different image qualities
- Verify AI confidence scores
```

### **✅ Testing Checklist**
- [ ] User registration and login
- [ ] Camera permission and functionality
- [ ] Image upload and AI processing
- [ ] Medicine suggestion display
- [ ] Order creation and confirmation
- [ ] Order tracking and history
- [ ] Error handling and edge cases

---

## 🚀 **DEPLOYMENT**

### **✅ Build for Production**
```bash
# Build for Android
expo build:android

# Build for iOS
expo build:ios

# Create standalone APK
expo build:android -t apk
```

### **✅ Environment Configuration**
```javascript
// Update API URLs for production
const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-api.com'
    : 'http://127.0.0.1:8000',
};
```

---

## 🎯 **NEXT STEPS**

### **✅ Immediate Tasks**
1. **Complete Missing Screens**: Implement remaining screens (Register, Home, Products, etc.)
2. **Error Handling**: Add comprehensive error handling
3. **Offline Support**: Implement offline functionality
4. **Push Notifications**: Add order status notifications

### **✅ Future Enhancements**
1. **Barcode Scanning**: Add medicine barcode scanning
2. **Voice Search**: Voice-based medicine search
3. **Health Records**: Integrate with health record systems
4. **Telemedicine**: Add doctor consultation features

---

## 📞 **SUPPORT**

For technical support or questions:
- **Backend API**: Check Django server logs
- **Mobile App**: Check Expo development tools
- **AI Processing**: Test with AI Test Page in admin dashboard

**Status**: 🟢 **READY FOR DEVELOPMENT**  
**Last Updated**: July 9, 2025  
**Version**: 1.0.0
