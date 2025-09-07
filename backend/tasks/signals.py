from django.db.models.signals import post_save
from django.contrib.auth.signals import user_logged_out
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Task, TaskStatusLog, Notification
User = get_user_model()

@receiver(user_logged_out)
def mark_user_offline(sender, request, user, **kwargs):
    if user:
        user.is_online = False
        user.save(update_fields=["is_online"])
        
@receiver(post_save, sender=Task)
def task_created_notification(sender, instance, created, **kwargs):
    if created and instance.assignee:
        Notification.objects.create(
            user=instance.assignee,
            title="New Task Assigned",
            message=f"You have been assigned a new task: '{instance.title}' by {instance.giver.username}.",
            type="info",
            category="task"
        )

@receiver(post_save, sender=TaskStatusLog)
def task_status_changed_notification(sender, instance, created, **kwargs):
    if created:
        task = instance.task
        message = f"Status of task '{task.title}' changed to '{instance.new_status}'."
        # Notify both giver and assignee
        if task.assignee:
            Notification.objects.create(
                user=task.assignee,
                title="Task Status Updated",
                message=message,
                type="info",
                category="task"
            )
        if task.giver:
            Notification.objects.create(
                user=task.giver,
                title="Task Status Updated",
                message=message,
                type="info",
                category="task"
            )