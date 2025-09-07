from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Task, TaskStatusLog, TaskAssigneeHistory,
    TaskFeedback, UserComment, Notification, StoreItem, Purchase
)

class UserAdmin(BaseUserAdmin):
    model = User

    list_display = (
        'id', 'username', 'email', 'first_name', 'last_name', 'role',
        'level', 'exp', 'honor', 'is_active'
    )
    list_filter = ('role', 'is_active', 'dark_mode_enabled')
    ordering = ('-level', 'username')
    search_fields = ('username', 'email', 'first_name', 'last_name')

    fieldsets = (
        *BaseUserAdmin.fieldsets,
        ("Gamification", {
            'fields': ('exp', 'honor', 'level')
        }),
        ("Profile Info", {
            'fields': ('avatar', 'job_position', 'about_me')
        }),
        ("Preferences & Flags", {
            'fields': ('dark_mode_enabled', 'notifications_enabled', 'default_password', 'last_seen', 'is_online')
        }),
    )

    add_fieldsets = (
        *BaseUserAdmin.add_fieldsets,
        (None, {
            'classes': ('wide',),
            'fields': ('first_name', 'last_name', 'job_position', 'avatar'),
        }),
    )


admin.site.register(User, UserAdmin)
admin.site.register(Task)
admin.site.register(TaskStatusLog)
admin.site.register(TaskAssigneeHistory)
admin.site.register(TaskFeedback)
admin.site.register(UserComment)
admin.site.register(Notification)
admin.site.register(StoreItem)
admin.site.register(Purchase)
