#  Standard Library
from django.conf import settings
from django.conf.urls.static import static

#  Third-Party
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

#  Internal
from .views import (
    RegisterView, ProfileView, PublicProfileView,
    PublicCommentListCreateView, PublicTestimonialListView,
    TaskViewSet, NotificationViewSet, TaskCommentView,
    StoreItemViewSet, PurchaseViewSet,
    UserListView, HallOfFameView, delete_avatar, admin_user_action
)

from .serializers import CustomTokenObtainPairSerializer

#  Override token view to inject user data
class CustomTokenView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

#  Router Setup
router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='tasks')
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'store', StoreItemViewSet, basename='store')
router.register(r'purchases', PurchaseViewSet, basename='purchases')

#  Final URL patterns
urlpatterns = [
    # 🔐 Auth & Profile
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/profile/', ProfileView.as_view(), name='profile'),
    
    # 🔐 JWT Token Auth
    path('auth/jwt/create/', CustomTokenView.as_view(), name='token_obtain_pair'),
    path('auth/jwt/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/jwt/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # 👥 All Users (for Hall of Fame page)
    path('auth/users/', UserListView.as_view(), name='user-list'),

    # 🔍 Public Profile Views
    path('auth/public-profile/<int:id>/', PublicProfileView.as_view(), name='public-profile'),
    path('auth/public-profile/<int:id>/testimonials/', PublicTestimonialListView.as_view(), name='public-testimonials'),
    path('auth/public-profile/<int:id>/comments/', PublicCommentListCreateView.as_view(), name='public-comments'),

    # Task-related views
    path('tasks/<int:task_id>/comments/', TaskCommentView.as_view(), name='task-comments'),

    # avatar deletion
    path('auth/profile/delete_avatar/', delete_avatar, name='delete-avatar'),

    # Hall of Fame page
    path('hall-of-fame/', HallOfFameView.as_view(), name='hall-of-fame'),

    # Admin Views
    path('admin/user-action/', admin_user_action, name='admin-user-action'),

    # 🔁 ViewSets
    path('', include(router.urls)),
]

# 🖼️ Media files (avatars, etc.)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
