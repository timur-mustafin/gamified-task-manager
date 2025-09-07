from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = "Promote 'admin' to role=admin (idempotent)."

    def handle(self, *args, **opts):
        User = get_user_model()
        try:
            u = User.objects.get(username="admin")
        except User.DoesNotExist:
            self.stderr.write("User 'admin' not found")
            return None
        old_is_staff = u.is_staff
        old_is_superuser = u.is_superuser
        u.is_staff = True
        u.is_superuser = True
        u.save(update_fields=["is_staff", "is_superuser"])
        self.stdout.write(f"is_staff: {old_is_staff} -> True, is_superuser: {old_is_superuser} -> True")
        return None
