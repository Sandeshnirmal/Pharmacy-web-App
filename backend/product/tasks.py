from celery import shared_task
import openpyxl
from django.db import transaction
from .models import Product, Category, GenericName
from .serializers import BulkProductSerializer

@shared_task
def process_excel_upload_task(file_path, user_id):
    try:
        workbook = openpyxl.load_workbook(file_path)
        sheet = workbook.active
        
        headers = [cell.value for cell in sheet[1]]
        data_rows = []
        for row in sheet.iter_rows(min_row=2, values_only=True):
            row_data = dict(zip(headers, row))
            data_rows.append(row_data)

        # Use transaction for atomicity
        with transaction.atomic():
            # Process products
            # Note: We need to pass a dummy request object or handle created_by differently
            # For simplicity, assuming created_by is handled by the serializer's default
            # or passed explicitly if needed.
            # For now, we'll rely on the serializer's CurrentUserDefault which needs a request context.
            # A more robust solution for Celery tasks would be to pass the user object directly
            # or the user_id and retrieve the user within the task.
            # For this example, we'll assume the serializer can handle it or we'll adjust.
            # Let's adjust to pass user_id and retrieve the user.
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(id=user_id)

            # Create a dummy request object for the serializer context
            # This is a common workaround for serializers in Celery tasks
            class DummyRequest:
                def __init__(self, user):
                    self.user = user
            
            dummy_request = DummyRequest(user)

            product_serializer = BulkProductSerializer(data=data_rows, many=True, context={'request': dummy_request})
            product_serializer.is_valid(raise_exception=True)
            product_serializer.save()

        # Clean up the temporary file
        import os
        os.remove(file_path)

        return {"message": "Excel file processed successfully", "status": "success"}

    except Exception as e:
        # Clean up the temporary file even if an error occurs
        import os
        if os.path.exists(file_path):
            os.remove(file_path)
        return {"error": str(e), "status": "error"}
