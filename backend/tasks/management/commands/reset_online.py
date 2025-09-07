from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Reset is_online=False for users inactive for over 15 minutes'

    def handle(self, *args, **kwargs):
        threshold = timezone.now() - timedelta(minutes=15)
        updated = User.objects.filter(is_online=True, last_seen__lt=threshold).update(is_online=False)
        self.stdout.write(f"Reset is_online for {updated} stale users.")
