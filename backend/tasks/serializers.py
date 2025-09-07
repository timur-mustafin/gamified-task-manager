# Standard
from django.contrib.auth import get_user_model

# Third-Party
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import humanize

# Internal
from .models import (
    Task, TaskStatusLog, TaskComment, TaskFeedback, TaskAssigneeHistory,
    Notification, StoreItem, Purchase, UserComment 
)
from django.utils.timezone import localtime
from tasks.utils import format_timestamp

User = get_user_model()

# ────────────────────────────────────────────────
# AUTH / USERS
# ────────────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'job_position', 'about_me'
        )
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email'),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            job_position=validated_data.get('job_position', ''),
            about_me=validated_data.get('about_me', '')
        )

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'avatar',
            'first_name', 'last_name', 
            'job_position', 'about_me',
            'level', 'exp', 'honor',  #  Include EXP fields here
            'is_online', 'last_seen',
            'role',
        ]
        extra_kwargs = {field: {'required': False} for field in fields}

    def get_avatar(self, obj):
        request = self.context.get('request')
        if obj.avatar and hasattr(obj.avatar, 'url'):
            return request.build_absolute_uri(obj.avatar.url) if request else obj.avatar.url
        return None

class UserShortSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'first_name', 'last_name',
            'level', 'exp', 'is_online', 'last_seen',
            'avatar'  
        )

    def get_avatar(self, obj):
        request = self.context.get('request')
        if obj.avatar and hasattr(obj.avatar, 'url'):
            return request.build_absolute_uri(obj.avatar.url) if request else obj.avatar.url
        return None

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data
    
class UserCommentSerializer(serializers.ModelSerializer):
    user = UserShortSerializer(read_only=True)
    profile_id = serializers.IntegerField(write_only=True, required=True)

    class Meta:
        model = UserComment
        fields = '__all__'
        read_only_fields = ('user', 'created_at')

# ────────────────────────────────────────────────
# Hall  of Fame
# ───────────────────────────────────────────────
class UserHallOfFameSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'first_name', 'last_name', 'username', 'level', 'exp', 'honor', 'avatar'
        )

    def get_avatar(self, obj):
        request = self.context.get('request')
        if obj.avatar and hasattr(obj.avatar, 'url'):
            return request.build_absolute_uri(obj.avatar.url) if request else obj.avatar.url
        return None

# ────────────────────────────────────────────────
# ✅ TASKS
# ────────────────────────────────────────────────

class TaskCommentSerializer(serializers.ModelSerializer):
    user = UserShortSerializer(read_only=True)

    class Meta:
        model = TaskComment
        fields = ['id', 'task', 'user', 'text', 'created_at']
        read_only_fields = ['id', 'task', 'user', 'created_at']


class TaskStatusLogSerializer(serializers.ModelSerializer):
    user = UserShortSerializer(read_only=True)

    class Meta:
        model = TaskStatusLog
        fields = ['id', 'task', 'user', 'old_status', 'new_status', 'timestamp']

class TaskAssigneeHistorySerializer(serializers.ModelSerializer):
    old_assignee = UserShortSerializer(read_only=True)
    new_assignee = UserShortSerializer(read_only=True)
    changed_by = UserShortSerializer(read_only=True)

    class Meta:
        model = TaskAssigneeHistory
        fields = '__all__'

class TaskFeedbackSerializer(serializers.ModelSerializer):
    giver = UserShortSerializer(read_only=True)
    assignee = UserShortSerializer(read_only=True)

    # Write-only inputs
    assignee_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='assignee',
        write_only=True,
        required=True
    )
    giver_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='giver',
        write_only=True,
        required=True
    )

    class Meta:
        model = TaskFeedback
        fields = '__all__'
        read_only_fields = ('id', 'created_at')

class TaskSerializer(serializers.ModelSerializer):
    description_preview = serializers.SerializerMethodField()

    giver = UserShortSerializer(read_only=True)
    assignee = UserShortSerializer(read_only=True)
    assignee_id = serializers.PrimaryKeyRelatedField(
        source="assignee",
        queryset=User.objects.all(),
        write_only=True,
        required=False
    )

    status_display = serializers.SerializerMethodField()
    created_at_formatted = serializers.SerializerMethodField()
    updated_at_formatted = serializers.SerializerMethodField()
    deadline_formatted = serializers.SerializerMethodField()

    def get_status_display(self, obj):
        return obj.get_status_display()

    def get_description_preview(self, obj):
        if not obj.description:
            return ''
        return obj.description[:100] + ('...' if len(obj.description) > 100 else '')

    def get_created_at_formatted(self, obj):
        return format_timestamp(obj.created_at)

    def get_updated_at_formatted(self, obj):
        return format_timestamp(obj.updated_at)

    def get_deadline_formatted(self, obj):
        return format_timestamp(obj.deadline)

    class Meta:
        model = Task
        fields = '__all__'  # includes created_at, updated_at, etc.
        read_only_fields = (
            'exp_earned', 'honor_earned', 'time_in_work',
            'created_at', 'updated_at'
        )

    def create(self, validated_data):
        print("VALIDATED:", validated_data)
        validated_data['giver'] = self.context['request'].user
        return super().create(validated_data)
    
# ────────────────────────────────────────────────
# ✅ NOTIFICATIONS
# ────────────────────────────────────────────────

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'user')

# ────────────────────────────────────────────────
# ✅ STORE
# ────────────────────────────────────────────────

class StoreItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreItem
        fields = '__all__'

class PurchaseSerializer(serializers.ModelSerializer):
    item = StoreItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=StoreItem.objects.all(),
        write_only=True,
        source='item'
    )

    class Meta:
        model = Purchase
        fields = ['id', 'user', 'item', 'item_id', 'timestamp']
        read_only_fields = ('user', 'timestamp')

    def validate(self, attrs):
        user = self.context['request'].user
        item = attrs['item']
        if user.honor < item.cost:
            raise serializers.ValidationError("Not enough Honor Points.")
        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        item = validated_data['item']
        user.honor -= item.cost
        user.save()
        return Purchase.objects.create(user=user, item=item)
