# Pharmacy Web Application Performance Optimization Report

This report details the performance enhancements implemented in the Pharmacy web application to address API call load and overall system slowness. The optimizations focused on three key areas: Database Query Optimization (N+1 issues), Caching, and Asynchronous Processing for heavy tasks like Optical Character Recognition (OCR).

## 1. Database Query Optimization (Addressing N+1 Issues)

**Problem:**
The application suffered from "N+1 query" problems, where a single API request would inadvertently trigger numerous additional database queries to fetch related objects. This is a common performance bottleneck in ORM-based applications, leading to high database load and slow response times, especially as data volume grows.

**Solution Implemented:**
The core of this optimization involved refactoring Django ORM queries in various `ViewSet`s and ensuring serializers correctly utilized pre-fetched data.

*   **`select_related()` for ForeignKey/OneToOne Relationships:**
    *   Used `select_related('related_model')` in `get_queryset` methods (e.g., in `ProductViewSet`, `EnhancedProductViewSet`, `CompositionViewSet`) to fetch related `GenericName`, `Category`, and `User` objects in a single, more efficient SQL query. This avoids separate queries for each related object when accessing their fields (e.g., `product.generic_name.name`).

*   **`prefetch_related()` for ManyToMany/Reverse ForeignKey Relationships:**
    *   Employed `prefetch_related('related_manager')` for relationships like `Product` to `Batch` and `Product` to `ProductComposition`. This fetches all related objects for a queryset in a separate query (or a few queries), then performs a Python join, drastically reducing the number of queries for many-to-many or one-to-many relationships.
    *   Specifically, a `Prefetch` object was used for `productcomposition_set` to filter active compositions and `select_related('composition')` within the prefetch, ensuring optimal fetching of composition details.

*   **`annotate()` for Aggregate Calculations:**
    *   Replaced `SerializerMethodField`s that performed aggregate calculations (like `total_stock_quantity`, `products_count`) with `annotate()` in the `get_queryset` methods. This pushes the aggregation logic to the database, calculating sums and counts directly in the initial query, rather than iterating over Python objects and performing separate counts/sums for each.
    *   Examples include `total_stock=Coalesce(Sum('batches__current_quantity'), 0)` for product stock and `products_count=Count('product', filter=Q(product__is_active=True))` for categories and generic names.

*   **`Subquery` and `OuterRef` for Complex Annotations:**
    *   To efficiently calculate the `current_selling_price` (which depends on the earliest expiring batch with available quantity), a `Subquery` combined with `OuterRef` was used. This allows a subquery to run for each product in the main queryset, fetching the relevant selling price without incurring N+1 queries.

*   **Serializer Adjustments:**
    *   `EnhancedProductSerializer`, `ProductSearchSerializer`, `CompositionSerializer`, `CompositionSearchSerializer`, `CategorySerializer`, and `GenericNameSerializer` were updated. `SerializerMethodField`s that previously caused N+1 queries were either removed (if the data was now available via `annotate` or `select_related`) or refactored to access the pre-fetched/annotated data directly.
    *   `extra_kwargs` were added to serializers to explicitly mark related fields as `read_only=True`, guiding the ORM to use `select_related` where appropriate.

**Files Modified:**
*   `backend/product/enhanced_views.py`
*   `backend/product/views.py`
*   `backend/product/enhanced_serializers.py`
*   `backend/prescriptions/mobile_api.py` (for product data fetching)
*   `backend/prescriptions/enhanced_views.py` (for product data fetching)

## 2. Caching Implementation

**Problem:**
Many API endpoints, especially those for listing products, categories, and compositions, serve relatively static or frequently accessed data. Repeated requests to these endpoints would hit the database every time, even if the data hadn't changed, leading to unnecessary load.

**Solution Implemented:**
Django's caching framework, backed by Redis, was integrated to store and serve responses for read-heavy endpoints.

*   **Redis Configuration:**
    *   `backend/backend/settings.py` was updated to configure `CACHES` to use `django_redis.cache.RedisCache`, pointing to a Redis instance (`redis://127.0.0.1:6379/1`). This provides a robust and high-performance caching backend.

*   **Viewset Caching:**
    *   The `@method_decorator(cache_page(300), name='dispatch')` decorator was applied to the `ViewSet` classes (`CompositionViewSet`, `ProductViewSet`, `BatchViewSet`, `InventoryViewSet`, `GenericNameViewSet`, `EnhancedProductViewSet`) in `backend/product/enhanced_views.py` and `backend/product/views.py`.
    *   This decorator caches the entire response of `GET` requests for 300 seconds (5 minutes). Subsequent requests within this period will be served directly from the cache without hitting the database or executing view logic, drastically improving response times.

**Files Modified:**
*   `backend/backend/settings.py`
*   `backend/product/enhanced_views.py`
*   `backend/product/views.py`

## 3. Asynchronous OCR Processing

**Problem:**
The Optical Character Recognition (OCR) process for prescription images is computationally intensive and time-consuming. When triggered synchronously within an API request, it would block the request, causing long response times and a poor user experience.

**Solution Implemented:**
Celery, a distributed task queue, was integrated with Redis to offload OCR processing to background workers.

*   **Dependency Installation:**
    *   `celery` and `redis` were added to `backend/requirment.txt`.
    *   A virtual environment was created and these dependencies were installed using `pip install -r backend/requirment.txt`.

*   **Celery Configuration:**
    *   `backend/backend/settings.py` was updated with `CELERY_BROKER_URL` and `CELERY_RESULT_BACKEND` pointing to a Redis instance (`redis://127.0.0.1:6379/0`). This configures Redis as the message broker for Celery tasks and for storing task results.
    *   Additional Celery settings (`CELERY_ACCEPT_CONTENT`, `CELERY_TASK_SERIALIZER`, `CELERY_RESULT_SERIALIZER`, `CELERY_TIMEZONE`) and logging configurations were added.

*   **Celery Task Creation:**
    *   A new file `backend/prescriptions/tasks.py` was created.
    *   The `process_prescription_ocr_task` was defined as a `@shared_task`, encapsulating the logic from `OCRService.process_prescription_image` and subsequent steps like creating `PrescriptionMedicine` objects and logging workflow actions. This task is designed to be retried on failure.

*   **Asynchronous Task Invocation:**
    *   The `upload_prescription` and `reprocess_prescription_ocr` functions in `backend/prescriptions/mobile_api.py` were modified. Instead of directly calling `OCRService`, they now call `process_prescription_ocr_task.delay()`. This immediately returns an HTTP 202 Accepted response to the client, while the OCR task runs in the background.
    *   Similarly, `perform_create` and `mobile_composition_prescription_upload` in `backend/prescriptions/enhanced_views.py` were updated to trigger the Celery task asynchronously.

**Files Modified:**
*   `backend/requirment.txt`
*   `backend/backend/settings.py`
*   `backend/prescriptions/tasks.py` (new file)
*   `backend/prescriptions/mobile_api.py`
*   `backend/prescriptions/enhanced_views.py`

## Conclusion

These comprehensive optimizations significantly enhance the performance and scalability of the Pharmacy web application. By reducing database queries, leveraging caching, and offloading heavy computations to background tasks, the application will be more responsive, handle higher loads, and provide a smoother user experience.
