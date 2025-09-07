# ✨ Standard Library
from django.utils import timezone
import os

# ✅ Third-Party Imports
from rest_framework import generics, permissions, viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly, IsAuthenticated, IsAdminUser
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import ValidationError
from rest_framework.generics import RetrieveAPIView, ListCreateAPIView, ListAPIView
from rest_framework.parsers import MultiPartParser
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from django.views.decorators.csrf import csrf_exempt

# ✅ Internal Imports
from .models import (
    Task, TaskStatusLog, TaskFeedback, TaskAssigneeHistory, TaskComment,
    Notification, StoreItem, Purchase, UserComment
)
from .serializers import (
    RegisterSerializer, UserSerializer, UserShortSerializer, UserHallOfFameSerializer, TaskCommentSerializer,
    TaskSerializer, TaskFeedbackSerializer, TaskStatusLogSerializer, TaskAssigneeHistorySerializer,
    NotificationSerializer, StoreItemSerializer, PurchaseSerializer, UserCommentSerializer
)

from tasks.utils.task_logic import total_time_in_work, calculate_exp, calculate_honor

User = get_user_model()

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_user_action(request):
    user_id = request.data.get('user_id')
    action = request.data.get('action')

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

    if action == 'reset_exp':
        user.exp = 0
    elif action == 'reset_honor':
        user.honor = 0
    elif action == 'toggle_role':
        user.role = 'admin' if user.role != 'admin' else 'user'
    elif action == 'deactivate':
        user.is_active = False
    else:
        return Response({'error': 'Invalid action'}, status=400)

    user.save()
    return Response({'status': 'success'})

# ───────────────────────────────────────────────────────────
# ✅ AUTH / PROFILE
# ───────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        data = request.data
        password = data.get("password")
        password2 = data.get("password2")

        if password != password2:
            return Response({"password": "Passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=data)  # use self.get_serializer for DRF consistency
        if serializer.is_valid():
            user = serializer.save()
            user.set_password(password)  # set hashed password
            user.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_avatar(request):
    user = request.user
    if user.avatar:
        # Delete the file from media storage
        avatar_path = user.avatar.path
        if os.path.exists(avatar_path):
            os.remove(avatar_path)
        # Clear the avatar field
        user.avatar = None
        user.save(update_fields=["avatar"])
        return Response({'message': 'Avatar deleted successfully.'}, status=200)
    return Response({'error': 'No avatar to delete.'}, status=400)

# ───────────────────────────────────────────────────────────
# ✅ USER PROFILE
# ───────────────────────────────────────────────────────────
class PublicProfileView(RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    lookup_field = 'id'  # or 'username' if you prefer

    def get_serializer_context(self):
        return {'request': self.request}
# ───────────────────────────────────────────────────────────
# Hall of Fame
# ───────────────────────────────────────────────────────────
class HallOfFameView(ListAPIView):
    serializer_class = UserHallOfFameSerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        return User.objects.all().order_by('-level', '-exp')

# ───────────────────────────────────────────────────────────
# User Profile Comments
# ───────────────────────────────────────────────────────────
class PublicCommentPagination(PageNumberPagination):
    page_size = 5
    max_page_size = 20

class PublicCommentListCreateView(ListCreateAPIView):
    serializer_class = UserCommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = PublicCommentPagination

    def get_queryset(self):
        return UserComment.objects.filter(profile_id=self.kwargs['id']).order_by('-created_at')

    def perform_create(self, serializer):
        if not self.request.data:
            print("❗ Nothing received in request.data")

        print("🛬 RAW POST DATA:", self.request.data)  # <-- log raw POST data

        text = self.request.data.get("text")
        if not text or not text.strip():
            print("🚫 Rejected: Empty or missing 'text'")
            raise ValidationError("Comment text is required.")

        print("✅ Passed Validation")
        serializer.save(user=self.request.user, profile_id=self.kwargs['id'])


# ───────────────────────────────────────────────────────────
# User Testimonials
# ───────────────────────────────────────────────────────────
class PublicTestimonialPagination(PageNumberPagination):
    page_size = 5
    max_page_size = 20
    
class PublicTestimonialListView(ListAPIView):
    serializer_class = TaskFeedbackSerializer
    permission_classes = [AllowAny]
    pagination_class = PageNumberPagination

    def get_queryset(self):
        return TaskFeedback.objects.filter(
            assignee_id=self.kwargs['id']
        ).order_by('-created_at')

# ───────────────────────────────────────────────────────────
# ✅ TASKS
# ───────────────────────────────────────────────────────────

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('-created_at')
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        task = serializer.save(giver=self.request.user)
        TaskStatusLog.objects.create(task=task, user=self.request.user, old_status='not_in_work', new_status=task.status)

    def perform_update(self, serializer):
        instance = serializer.save()
        if 'assignee' in serializer.validated_data:
            TaskAssigneeHistory.objects.create(
                task=instance,
                old_assignee=instance.assignee,
                new_assignee=serializer.validated_data['assignee'],
                changed_by=self.request.user
            )
    def destroy(self, request, *args, **kwargs):
        task = self.get_object()
        user = request.user
        if task.giver != user and user.role != 'admin':
            raise PermissionDenied("You do not have permission to delete this task.")
        return super().destroy(request, *args, **kwargs)
        
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        task = self.get_object()
        new_status = request.data.get('status')
        if new_status and new_status != task.status:
            TaskStatusLog.objects.create(task=task, user=request.user, old_status=task.status, new_status=new_status)
            task.status = new_status
            task.save()
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=['post'])
    def submit_feedback(self, request, pk=None):
        task = self.get_object()

        # Allow only the task giver to submit feedback
        if task.giver != request.user:
            return Response({'error': 'Only the task giver can submit feedback.'}, status=403)

        # Must be completed
        if task.status != 'completed':
            return Response({'error': 'Cannot submit feedback until task is completed.'}, status=400)

        # Must be assigned to someone
        if not task.assignee:
            return Response({'error': 'Cannot submit feedback: Task has no assignee.'}, status=400)

        # Prepare payload
        data = request.data.copy()
        data['task'] = task.id
        data['giver_id'] = request.user.id
        data['assignee_id'] = task.assignee.id

        # Validate and save
        serializer = TaskFeedbackSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    @action(detail=True, methods=["post"])
    def mark_done(self, request, pk=None):
        task = self.get_object()

        if task.assignee != request.user:
            return Response({'error': 'Only the assignee can mark this task as done.'}, status=403)

        # Status update
        TaskStatusLog.objects.create(
            task=task,
            user=request.user,
            old_status=task.status,
            new_status='not_moderated'
        )
        task.status = 'not_moderated'

        # Safely calculate time & reward only if timer data exists
        time_worked = total_time_in_work(task)
        task.time_in_work = time_worked or 0
        task.exp_earned = calculate_exp(task) if time_worked else 0
        task.honor_earned = calculate_honor(task) if time_worked else 0
        task.save()

        return Response(TaskSerializer(task).data)

    
    @action(detail=True, methods=["post"])
    def mark_completed(self, request, pk=None):
        task = self.get_object()

        if task.giver != request.user:
            raise PermissionDenied("Only the task giver can mark this task as completed.")

        if task.status not in ['not_moderated', 'moderation', 'moderation_stopped']:
            return Response({'error': 'Task must be in moderation state to complete.'}, status=400)

        # Award EXP + Honor to the assignee
        assignee = task.assignee
        if assignee:
            assignee.exp += task.exp_earned or 0
            assignee.honor += task.honor_earned or 0
            assignee.save()

        task.status = 'completed'
        task.save()

        # Log the change
        TaskStatusLog.objects.create(
            task=task,
            user=request.user,
            old_status='moderation',
            new_status='completed'
        )

        return Response(TaskSerializer(task).data)
    
    @action(detail=True, methods=["post"])
    def start_moderation(self, request, pk=None):
        task = self.get_object()

        if task.giver != request.user:
            return Response({'error': 'Only the task giver can start moderation.'}, status=403)

        if task.status != 'not_moderated':
            return Response({'error': 'Task must be in not_moderated state to begin moderation.'}, status=400)

        task.status = 'moderation'
        task.moderation_started_at = timezone.now()  # Optional field to track
        task.save()

        TaskStatusLog.objects.create(
            task=task,
            user=request.user,
            old_status='not_moderated',
            new_status='moderation'
        )

        return Response(TaskSerializer(task).data)


    @action(detail=True, methods=["post"])
    def stop_moderation(self, request, pk=None):
        task = self.get_object()

        if task.giver != request.user:
            return Response({'error': 'Only the task giver can stop moderation.'}, status=403)

        # Update the status so UI can react
        old_status = task.status
        task.status = "moderation_stopped"
        task.moderation_stopped_at = timezone.now()
        task.save()

        TaskStatusLog.objects.create(
            task=task,
            user=request.user,
            old_status=old_status,
            new_status=task.status
        )

        return Response(TaskSerializer(task).data)
    
    @action(detail=True, methods=["post"])
    def return_to_assignee(self, request, pk=None):
        task = self.get_object()

        if task.giver != request.user:
            return Response({'error': 'Only the task giver can return the task to the assignee.'}, status=403)

        if task.status not in ['not_moderated', 'moderation', 'moderation_stopped']:
            return Response({'error': 'Task must be in moderation state to return.'}, status=400)

        TaskStatusLog.objects.create(
            task=task,
            user=request.user,
            old_status=task.status,
            new_status='returned'
        )

        task.status = 'returned'
        task.save()

        return Response(TaskSerializer(task).data)


    @action(detail=True, methods=["post"])
    def mark_failed(self, request, pk=None):
        task = self.get_object()

        if task.giver != request.user:
            return Response({'error': 'Only the task giver can mark a task as failed.'}, status=403)

        if task.status not in ['not_moderated', 'moderation', 'moderation_stopped']:
            return Response({'error': 'Task must be in moderation state to fail.'}, status=400)

        TaskStatusLog.objects.create(
            task=task,
            user=request.user,
            old_status=task.status,
            new_status='failed'
        )

        task.status = 'failed'

        # Optional: erase exp/honor (leave 0 just in case)
        task.exp_earned = 0
        task.honor_earned = 0

        task.save()

        return Response(TaskSerializer(task).data)
    
    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        task = self.get_object()
        logs = TaskStatusLog.objects.filter(task=task).order_by('-timestamp')
        return Response(TaskStatusLogSerializer(logs, many=True).data)
    
# ───────────────────────────────────────────────────────────
# Task Comments
# ───────────────────────────────────────────────────────────
class TaskCommentView(generics.ListCreateAPIView):
    serializer_class = TaskCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        task_id = self.kwargs['task_id']
        return TaskComment.objects.filter(task_id=task_id).order_by('-created_at')

    def perform_create(self, serializer):
        task_id = self.kwargs['task_id']
        serializer.save(user=self.request.user, task_id=task_id)


# ───────────────────────────────────────────────────────────
# ✅ User List View
# ───────────────────────────────────────────────────────────

class UserListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        users = User.objects.all().order_by('-level', '-exp')
        serializer = UserHallOfFameSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)

# ───────────────────────────────────────────────────────────
# ✅ NOTIFICATIONS
# ───────────────────────────────────────────────────────────

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        notifications = Notification.objects.filter(user=request.user, is_read=False)
        notifications.update(is_read=True)
        return Response({'status': 'all notifications marked as read'})

# ───────────────────────────────────────────────────────────
# ✅ HONOR STORE
# ───────────────────────────────────────────────────────────

class StoreItemViewSet(viewsets.ModelViewSet):
    queryset = StoreItem.objects.all()
    serializer_class = StoreItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return StoreItem.objects.all()
        return StoreItem.objects.filter(active=True)

class PurchaseViewSet(viewsets.ModelViewSet):
    serializer_class = PurchaseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Purchase.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def buy(self, request):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            purchase = serializer.save()
            return Response(PurchaseSerializer(purchase).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        