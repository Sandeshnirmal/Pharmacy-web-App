# backend/usermanagement/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
# No need to import TokenObtainPairSerializer or authenticate for a simple login via /api/token/

# Example of a protected view in your usermanagement app
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated] # Only authenticated users can access this

    def get(self, request):
        user = request.user # The authenticated user object is available via request.user
        data = {
            'id': user.id,
            'email': user.email, # Assuming your custom User model uses email
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
            # Add any other user fields you want to expose
        }
        return Response(data, status=status.HTTP_200_OK)

# Other views for user registration, password reset, etc., would go here.