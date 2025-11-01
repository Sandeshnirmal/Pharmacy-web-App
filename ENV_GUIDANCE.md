# Environment Variable ('.env') Configuration Guide

This document provides guidance on how to configure and use environment variables (`.env` files) for the backend, e-commerce frontend, and mobile app projects.

---

### Backend (`backend/` directory)

**1. Install `python-dotenv`:**
If you haven't already, install `python-dotenv` in your backend's virtual environment:
```bash
cd backend
pip install python-dotenv
```
(The `python-dotenv` package has already been added to `backend/requirment.txt`, so you can also run `pip install -r requirment.txt` in the `backend` directory.)

**2. `.env.development` and `.env.production` files:**
- `backend/.env.development`: Contains settings for your local development environment.
  ```ini
  # Development Environment Variables for Backend

  DEBUG=True
  SECRET_KEY=django-insecure-dev-key-for-pharmacy-app
  GOOGLE_API_KEY=AIzaSyBFOWl2ohkpml5lBN9Atsqo87dI40Glopg_DEV
  RAZORPAY_KEY_ID=rzp_test_u32HLv2OyCBfAN
  RAZORPAY_KEY_SECRET=Owlg61rwtT7V3RQKoYGKhsUC
  TPC_API_ENDPOINT=https://www.tpcglobe.com_DEV
  TPC_API_KEY=0236_DEV
  TPC_API_SECRET=Admin@123_DEV
  ALLOWED_HOSTS=*
  CORS_ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://127.0.0.1:3000", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175", "http://localhost:8080", "http://127.0.0.1:8080", "http://192.168.77.6:8000", "http://192.168.129.6:8001", "http://192.168.129.6:5174", "http://192.168.129.6:3000"]
  CSRF_TRUSTED_ORIGINS=["http://192.168.77.6:8000", "http://localhost:8000", "http://127.0.0.1:8000", "http://192.168.129.6:8001", "http://192.168.129.6:5174", "http://192.168.129.6:3000"]
  SIMPLE_JWT_SIGNING_KEY=django-insecure-dev-jwt-key
  CELERY_BROKER_URL=redis://127.0.0.1:6379/0
  CELERY_RESULT_BACKEND=redis://127.0.0.1:6379/0
  ```
- `backend/.env.production`: Contains settings for your production environment. **IMPORTANT: Replace placeholder values like `YOUR_PRODUCTION_SECRET_KEY_HERE` with actual secure values before deploying to production.**
  ```ini
  # Production Environment Variables for Backend

  DEBUG=False
  SECRET_KEY=YOUR_PRODUCTION_SECRET_KEY_HERE # IMPORTANT: Change this to a strong, unique key in production
  GOOGLE_API_KEY=YOUR_PRODUCTION_GOOGLE_API_KEY_HERE
  RAZORPAY_KEY_ID=YOUR_PRODUCTION_RAZORPAY_KEY_ID_HERE
  RAZORPAY_KEY_SECRET=YOUR_PRODUCTION_RAZORPAY_KEY_SECRET_HERE
  TPC_API_ENDPOINT=YOUR_PRODUCTION_TPC_API_ENDPOINT_HERE
  TPC_API_KEY=YOUR_PRODUCTION_TPC_API_KEY_HERE
  TPC_API_SECRET=YOUR_PRODUCTION_TPC_API_SECRET_HERE
  ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com # IMPORTANT: Change to your actual production domain(s)
  CORS_ALLOWED_ORIGINS=["https://yourdomain.com", "https://www.yourdomain.com", "https://mobile.yourdomain.com"] # IMPORTANT: Change to your actual production origins
  CSRF_TRUSTED_ORIGINS=["https://yourdomain.com", "https://www.yourdomain.com", "https://mobile.yourdomain.com"] # IMPORTANT: Change to your actual production origins
  SIMPLE_JWT_SIGNING_KEY=YOUR_PRODUCTION_JWT_SIGNING_KEY_HERE # IMPORTANT: Change this to a strong, unique key in production
  CELERY_BROKER_URL=redis://redis:6379/0 # Assuming Redis is a service named 'redis' in Docker/Kubernetes
  CELERY_RESULT_BACKEND=redis://redis:6379/0 # Assuming Redis is a service named 'redis' in Docker/Kubernetes
  ```

**3. How to use:**
The `backend/backend/settings.py` file has been modified to automatically load the correct `.env` file based on the `DJANGO_ENV` environment variable.

- **For Development:**
  Set the `DJANGO_ENV` environment variable to `development` (or don't set it, as `development` is the default).
  ```bash
  export DJANGO_ENV=development
  python manage.py runserver
  ```
  or simply:
  ```bash
  python manage.py runserver
  ```

- **For Production:**
  Set the `DJANGO_ENV` environment variable to `production`.
  ```bash
  export DJANGO_ENV=production
  python manage.py runserver
  ```
  In a production deployment (e.g., Docker, Kubernetes, or a hosting service), you would configure your environment to set `DJANGO_ENV=production` and provide the actual production values for the environment variables.

---

### E-commerce Frontend (`e-commerce/` directory)

**1. `.env.development` and `.env.production` files:**
- `e-commerce/.env.development`: Contains the base URL for your development API.
  ```ini
  # Development Environment Variables for E-commerce Frontend

  VITE_API_BASE_URL=http://127.0.0.1:8000/
  ```
- `e-commerce/.env.production`: Contains the base URL for your production API. **IMPORTANT: Replace `https://api.yourdomain.com/` with your actual production API endpoint.**
  ```ini
  # Production Environment Variables for E-commerce Frontend

  VITE_API_BASE_URL=https://api.yourdomain.com/ # IMPORTANT: Change to your actual production API endpoint
  ```

**2. How to use:**
The `e-commerce/src/api/axiosInstance.js` file has been updated to use `import.meta.env.VITE_API_BASE_URL`. Vite automatically loads the correct `.env` file based on the `NODE_ENV` or `VITE_ENV` environment variable during build/serve.

- **For Development:**
  Vite automatically uses `.env.development` when you run the development server:
  ```bash
  cd e-commerce
  npm install # if you haven't already
  npm run dev
  ```

- **For Production Build:**
  Vite automatically uses `.env.production` when you build for production:
  ```bash
  cd e-commerce
  npm run build
  ```

---

### Pharmacy Mobile App (`Pharmacy_mobile_app/` directory)

**1. Install `flutter_dotenv`:**
The `flutter_dotenv` package has already been added to your `pubspec.yaml`. Now, run `flutter pub get` to install the new dependency:
```bash
cd Pharmacy_mobile_app
flutter pub get
```

**2. `.env.development` and `.env.production` files:**
- `Pharmacy_mobile_app/.env.development`: Contains settings for your local mobile app development.
  ```ini
  # Development Environment Variables for Pharmacy Mobile App

  API_BASE_URL=http://127.0.0.1:8000
  RAZORPAY_KEY_ID=rzp_test_u32HLv2OyCBfAN
  RAZORPAY_KEY_SECRET=Owlg61rwtT7V3RQKoYGKhsUC
  IS_DEVELOPMENT=true
  ENABLE_LOGGING=true
  ```
- `Pharmacy_mobile_app/.env.production`: Contains settings for your production mobile app. **IMPORTANT: Replace placeholder values like `https://api.yourdomain.com` and Razorpay keys with actual secure values before building for production.**
  ```ini
  # Production Environment Variables for Pharmacy Mobile App

  API_BASE_URL=https://api.yourdomain.com # IMPORTANT: Change to your actual production API endpoint
  RAZORPAY_KEY_ID=YOUR_PRODUCTION_RAZORPAY_KEY_ID_HERE
  RAZORPAY_KEY_SECRET=YOUR_PRODUCTION_RAZORPAY_KEY_SECRET_HERE
  IS_DEVELOPMENT=false
  ENABLE_LOGGING=false
  ```

**3. How to use:**
The `Pharmacy_mobile_app/lib/config/api_config.dart` and `Pharmacy_mobile_app/lib/main.dart` files have been modified to load these environment variables using `flutter_dotenv`.

- **In `main.dart` (or an initialization file):**
  Logic has been added to load the appropriate `.env` file at the start of your application based on a `FLUTTER_ENV` environment variable. You can set this during your Flutter build command.

  Example `main.dart` snippet:
  ```dart
  import 'package:flutter_dotenv/flutter_dotenv.dart';

  Future<void> main() async {
    // Determine the environment and load the appropriate .env file
    const String flutterEnv = String.fromEnvironment('FLUTTER_ENV', defaultValue: 'development');

    if (flutterEnv == 'production') {
      await dotenv.load(fileName: ".env.production");
    } else {
      await dotenv.load(fileName: ".env.development");
    }

    runApp(const MyApp());
  }
  ```
  To run in development: `flutter run`
  To run in production: `flutter run --dart-define=FLUTTER_ENV=production`
  To build for production: `flutter build apk --dart-define=FLUTTER_ENV=production` (or `ios`, `web`, etc.)

- **In `api_config.dart`:**
  The variables are now accessed using `dotenv.env['YOUR_VAR_NAME']`. For example:
  ```dart
  import 'package:flutter_dotenv/flutter_dotenv.dart';

  class ApiConfig {
    static final String baseUrl = dotenv.env['API_BASE_URL'] ?? 'http://127.0.0.1:8000';
    static final String razorpayKeyId = dotenv.env['RAZORPAY_KEY_ID'] ?? 'default_test_key';
    static final bool isDevelopment = dotenv.env['IS_DEVELOPMENT'] == 'true';
    // ... other configurations
  }
