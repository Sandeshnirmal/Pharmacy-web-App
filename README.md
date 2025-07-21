# 🏥 Pharmacy Management System

A comprehensive full-stack pharmacy management system built with React.js frontend and Django REST API backend.

## 🚀 Features

### 👨‍💼 Admin Dashboard
- **User Management**: Manage customers, pharmacists, and staff
- **Inventory Management**: Track stock levels, batches, and expiry dates
- **Order Management**: Process and track customer orders
- **Prescription Management**: Review and verify uploaded prescriptions
- **Reports & Analytics**: Business insights and performance metrics
- **Customer Management**: View customer profiles and order history

### 🏪 Core Functionality
- **Product Catalog**: Comprehensive medicine database with generic mappings
- **Prescription Upload**: AI-powered prescription text extraction
- **Order Processing**: Complete order lifecycle management
- **Inventory Tracking**: Real-time stock monitoring with alerts
- **Batch Management**: Expiry date tracking and stock movements
- **Delivery Tracking**: Order fulfillment and delivery status

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Pharmacist, Staff, Customer)
- Secure API endpoints

## 🛠️ Technology Stack

### Frontend
- **React.js** - Modern UI framework
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Lucide React** - Beautiful icons

### Backend
- **Django** - Python web framework
- **Django REST Framework** - API development
- **SQLite** - Database (development)
- **JWT Authentication** - Secure token-based auth
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
Pharmacy-web-App/
├── frontend/                 # React.js frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── api/            # API configuration
│   │   └── assets/         # Static assets
│   ├── public/
│   └── package.json
├── backend/                 # Django backend
│   ├── backend/            # Django project settings
│   ├── usermanagement/     # User authentication app
│   ├── product/           # Product management app
│   ├── orders/            # Order management app
│   ├── prescriptions/     # Prescription handling app
│   ├── inventory/         # Inventory management app
│   └── manage.py
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- pip (Python package manager)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install django djangorestframework django-cors-headers djangorestframework-simplejwt
   ```

4. **Run migrations**
   ```bash
   python manage.py migrate
   ```

5. **Create sample data**
   ```bash
   python create_sample_data.py
   ```

6. **Start development server**
   ```bash
   python manage.py runserver 8001
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## 🔑 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pharmacy.com | admin123 |
| Pharmacist | pharmacist@pharmacy.com | pharma123 |
| Customer | customer1@example.com | customer123 |

## 📊 API Endpoints

### Authentication
- `POST /api/token/` - Login and get JWT tokens
- `POST /api/token/refresh/` - Refresh access token

### User Management
- `GET /user/users/` - List users
- `POST /user/users/` - Create user
- `GET /user/users/{id}/` - Get user details
- `PUT /user/users/{id}/` - Update user
- `DELETE /user/users/{id}/` - Delete user

### Products
- `GET /product/products/` - List products
- `POST /product/products/` - Create product
- `GET /product/products/{id}/` - Get product details

### Orders
- `GET /orders/orders/` - List orders
- `POST /orders/orders/` - Create order
- `GET /orders/orders/{id}/` - Get order details

### Prescriptions
- `GET /prescription/prescriptions/` - List prescriptions
- `POST /prescription/prescriptions/` - Upload prescription

### Inventory
- `GET /inventory/batches/` - List batches
- `POST /inventory/batches/` - Add new batch
- `GET /inventory/stock-movements/` - Stock movement history

## 🎯 Key Features Implemented

### ✅ Completed Features
- [x] User authentication and authorization
- [x] Product catalog with categories and generic names
- [x] Inventory management with batch tracking
- [x] Order management system
- [x] Prescription upload and review
- [x] Customer management
- [x] Reports and analytics dashboard
- [x] Responsive UI design
- [x] API integration
- [x] Sample data generation

### 🔄 Future Enhancements
- [ ] API documentation with Swagger
- [ ] Authentication guards and route protection
- [ ] Docker containerization
- [ ] Unit and integration tests
- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] Advanced reporting features
- [ ] Mobile app development

## 🌐 Access URLs

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:8001
- **Admin Panel**: http://localhost:8001/admin

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Designed for scalability and maintainability
- Follows industry best practices
- Comprehensive feature set for pharmacy management

---

**Happy Coding! 🚀**
