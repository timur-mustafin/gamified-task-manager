import datetime
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()

class ActiveUserMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if request.user.is_authenticated:
            now = timezone.now()
            # Update last_seen and is_online
            User.objects.filter(id=request.user.id).update(
                last_seen=now,
                is_online=True
            )

        return response
