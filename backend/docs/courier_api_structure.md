# Courier API Framing and Structure

The courier API is framed and structured as a Django REST Framework application that acts as an abstraction layer and proxy for an external TPC Courier Service API.

Here's a detailed breakdown of its structure:

## 1. Models (`backend/courier/models.py`)

*   Defines the core data structures for the application, primarily `CourierShipment`. This model stores all relevant information about a shipment, including its `tracking_number`, `status`, `pickup_address`, `delivery_address`, `weight`, `dimensions`, and financial details like `cod_charges`.
*   It also includes `tpc_order_id` and `tpc_response` fields to store references and raw responses from the external TPC API, indicating a direct integration.
*   `TPCRecipient` and `TPCServiceableArea` models are used to store recipient-specific details and cached information about serviceable pincodes, respectively.

## 2. Serializers (`backend/courier/serializers.py`)

*   Handles data validation and conversion between Python objects and JSON representations.
*   `CourierShipmentSerializer` is used for the internal `CourierShipment` model.
*   Specialized serializers like `TPCPickupRequestSerializer`, `TPCCODBookingSerializer`, and `TPCPickupAddonSerializer` are defined with field names that directly map to the expected input parameters of the external TPC API. This ensures proper data formatting when communicating with the third-party service.
*   `CourierTrackingSerializer` is used for presenting tracking information.

## 3. Services (`backend/courier/services.py`)

*   This file contains the `TPCCourierService` class, which is responsible for all direct interactions with the external TPC API.
*   It manages API credentials (`TPC_API_KEY`, `TPC_API_SECRET`, `TPC_API_ENDPOINT` from Django settings).
*   The `_make_request` helper method centralizes HTTP request logic, including setting headers, making `GET`/`POST` calls using the `requests` library, and robust error handling (HTTP errors, connection issues, JSON decoding failures).
*   It provides specific methods for each TPC API functionality, such as `create_shipment`, `cancel_shipment`, `track_shipment`, `check_pincode_service`, `create_cod_booking`, etc.
*   It implements a caching mechanism for pincode serviceability using the `TPCServiceableArea` model to reduce redundant API calls.

## 4. Views (`backend/courier/views.py`)

*   Exposes the courier functionalities as RESTful API endpoints using Django REST Framework's `viewsets.ModelViewSet`.
*   The `CourierShipmentViewSet` handles standard CRUD operations for `CourierShipment` objects.
*   It defines custom `@action` methods (e.g., `create_shipment`, `track`, `cancel_shipment`, `create_cod_booking`, `check_pincode_serviceability`) that serve as specific API endpoints.
*   These view methods validate incoming data using the appropriate serializers and then delegate the actual interaction with the external TPC API to the `TPCCourierService`.
*   Permissions (`IsAuthenticated`) are enforced to secure the API.

## 5. URLs (`backend/courier/urls.py`)

*   Configures the URL routing for the courier API.
*   It uses `rest_framework.routers.DefaultRouter` to automatically generate standard RESTful URLs for the `CourierShipmentViewSet` under the `/shipments/` endpoint. This includes routes for listing, retrieving, creating, updating, and deleting shipments, as well as the custom actions defined in the viewset.

In summary, the courier API is a well-organized Django REST Framework application designed to provide a seamless interface for managing courier shipments by abstracting and integrating with a third-party TPC courier service. It follows best practices for API development, including clear separation of concerns (models, serializers, views, services), robust error handling, and secure authentication.
