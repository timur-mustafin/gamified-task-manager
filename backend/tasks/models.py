from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from PIL import Image
import os
import uuid

def avatar_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('avatars', filename)

class Role(models.TextChoices):
    USER = 'user', _('User')
    ADMIN = 'admin', _('Admin')
    GUEST = 'guest', _('Guest')

class User(AbstractUser):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)

    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    job_position = models.CharField(max_length=100, blank=True, default="")
    about_me = models.TextField(blank=True, default="")
    
    avatar = models.ImageField(upload_to=avatar_upload_path, null=True, blank=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.USER)

    last_seen = models.DateTimeField(null=True, blank=True)
    is_online = models.BooleanField(default=False)
    default_password = models.BooleanField(default=True)
    notifications_enabled = models.BooleanField(default=True)
    dark_mode_enabled = models.BooleanField(default=False)
    
    exp = models.PositiveIntegerField(default=0)
    honor = models.IntegerField(default=0)
    level = models.PositiveIntegerField(default=1)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.avatar:
            img_path = self.avatar.path
            try:
                img = Image.open(img_path)
                img.thumbnail((256, 256), Image.LANCZOS)

                # Preserve original format if supported
                ext = os.path.splitext(img_path)[1].lower()
                format_map = {
                    '.jpg': 'JPEG',
                    '.jpeg': 'JPEG',
                    '.png': 'PNG',
                    '.webp': 'WEBP'
                }
                img_format = format_map.get(ext, 'PNG')  # default to PNG if unknown

                img.save(img_path, img_format, quality=90, optimize=True)
            except Exception as e:
                print(f"Error processing avatar: {e}")

    def __str__(self):
        return self.username
    
class UserComment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)  # who left it
    profile = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='comments_received', on_delete=models.CASCADE)  # whose profile
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid

def task_file_upload(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return f'tasks/{filename}'

PRIORITY_CHOICES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High')]
DIFFICULTY_CHOICES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High')]
STATUS_CHOICES = [
  ("not_in_work", "Not in Work"),
  ("in_work", "In Work"),
  ("not_moderated", "Not Moderated"),
  ("moderation", "Moderation"),
  ("moderation_stopped", "Moderation Stopped"),
  ("returned", "Returned"),
  ("completed", "Completed"),
  ("failed", "Failed"),
]

class Task(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    giver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='given_tasks')
    assignee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assigned_tasks', null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='not_in_work')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    deadline = models.DateTimeField(null=True, blank=True)
    approx_time = models.FloatField(help_text='Approx. time to complete in hours', default=1.0)
    files = models.FileField(upload_to=task_file_upload, null=True, blank=True)
    is_template = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    moderation_started_at = models.DateTimeField(null=True, blank=True)
    moderation_stopped_at = models.DateTimeField(null=True, blank=True)
    exp_earned = models.IntegerField(default=0)
    honor_earned = models.IntegerField(default=0)
    time_in_work = models.FloatField(default=0.0)

    def __str__(self):
        return f"{self.title} [{self.status}]"

    def total_time_in_work(self):
        intervals = self.status_logs.filter(new_status='in_work')
        total = sum([interval.duration() for interval in intervals])
        return round(total, 2)

    def calculate_exp(self):
        hours = self.total_time_in_work()
        return int(hours * 100)

    def calculate_honor(self):
        base_honor = 50
        priority_multiplier = {'low': 1.0, 'medium': 1.2, 'high': 1.5}[self.priority]
        difficulty_multiplier = {'low': 0.8, 'medium': 1.0, 'high': 1.3}[self.difficulty]

        D = (self.deadline - self.created_at).total_seconds() / 3600 if self.deadline else 1
        ATC = self.approx_time or 1
        H = self.total_time_in_work()
        grace = D * 0.1
        performance_ratio = H / ATC
        deadline_ratio = H / D
        is_late = timezone.now() > self.deadline if self.deadline else False

        honor = base_honor
        if not is_late:
            honor += (1 - performance_ratio) * base_honor
            honor += (1 - deadline_ratio) * base_honor
        else:
            honor -= (performance_ratio - 1) * base_honor
            honor -= (deadline_ratio - 1) * base_honor

        honor *= difficulty_multiplier
        honor *= priority_multiplier
        return max(-100, min(200, int(honor)))

class TaskEvent(models.Model):
    class EventType(models.TextChoices):
        COMMENT = 'comment', 'Comment'
        STATUS_CHANGE = 'status_change', 'Status Change'
        FILE_UPLOAD = 'file_upload', 'File Upload'
        FILE_DELETE = 'file_delete', 'File Delete'
        SYSTEM = 'system', 'System Message'

    task = models.ForeignKey("Task", related_name="events", on_delete=models.CASCADE)
    type = models.CharField(max_length=20, choices=EventType.choices)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_type_display()} by {self.user or 'System'} at {self.created_at}"

class TaskStatusLog(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='status_logs')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    old_status = models.CharField(max_length=30, choices=STATUS_CHOICES)
    new_status = models.CharField(max_length=30, choices=STATUS_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)

    def duration(self):
        next_log = TaskStatusLog.objects.filter(task=self.task, timestamp__gt=self.timestamp).order_by('timestamp').first()
        end_time = next_log.timestamp if next_log else timezone.now()
        return (end_time - self.timestamp).total_seconds() / 3600

class TaskComment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user} on Task {self.task.id}"

class TaskFeedback(models.Model):
    task = models.OneToOneField(Task, on_delete=models.CASCADE, related_name='feedback')
    giver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='given_feedback')
    assignee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_feedback')
    rating = models.IntegerField(default=5)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class TaskAssigneeHistory(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='assignee_history')
    old_assignee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='old_assignee_tasks')
    new_assignee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='new_assignee_tasks')
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='assigner')
    timestamp = models.DateTimeField(auto_now_add=True)

from django.db import models
from django.conf import settings

NOTIFICATION_TYPES = [('info', 'Info'), ('warning', 'Warning'), ('critical', 'Critical')]
NOTIFICATION_CATEGORIES = [('task', 'Task'), ('store', 'Store'), ('profile', 'Profile')]

class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=10, choices=NOTIFICATION_TYPES, default='info')
    category = models.CharField(max_length=20, choices=NOTIFICATION_CATEGORIES, default='task')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.title} ({self.type})"

from django.db import models
from django.conf import settings
from PIL import Image
import os
import uuid

def store_image_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('store_items', filename)

class StoreItem(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    cost = models.PositiveIntegerField(default=0)
    image = models.ImageField(upload_to=store_image_upload_path, null=True, blank=True)
    active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.image:
            img = Image.open(self.image.path)
            img = img.convert("RGB")
            img.thumbnail((512, 512))
            img.save(self.image.path, "JPEG", quality=85)

    def __str__(self):
        return f"{self.name} ({self.cost} Honor)"

class Purchase(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='purchases')
    item = models.ForeignKey(StoreItem, on_delete=models.CASCADE, related_name='purchases')
    timestamp = models.DateTimeField(auto_now_add=True)