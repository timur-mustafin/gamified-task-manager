from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.conf import settings
import os
from datetime import datetime

User = get_user_model()

class Command(BaseCommand):
    help = 'Reset is_online=False for users inactive for over 15 minutes and log the result.'

    def handle(self, *args, **kwargs):
        threshold = timezone.now() - timedelta(minutes=15)
        now_str = timezone.now().strftime('%Y-%m-%d %H:%M:%S')

        # Prepare logging
        log_dir = os.path.join(settings.BASE_DIR, 'logs')
        os.makedirs(log_dir, exist_ok=True)
        log_file = os.path.join(log_dir, f'reset_online_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')
        log_lines = [f"[START] {now_str} — Checking for inactive users..."]

        # Update user statuses
        updated = User.objects.filter(is_online=True, last_seen__lt=threshold).update(is_online=False)

        if updated == 0:
            msg = "No stale users found. All users are recently active."
            self.stdout.write(self.style.SUCCESS(msg))
            log_lines.append(f"[OK] {msg}")
        else:
            msg = f"Reset is_online=False for {updated} stale users."
            self.stdout.write(self.style.SUCCESS(msg))
            log_lines.append(f"[UPDATED] {msg}")

        # Final log entry
        log_lines.append(f"[END] {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}")

        # Write to log file
        with open(log_file, 'w', encoding='utf-8') as f:
            f.writelines(line + '\n' for line in log_lines)

        self.stdout.write(f"📄 Log written to: {log_file}")
