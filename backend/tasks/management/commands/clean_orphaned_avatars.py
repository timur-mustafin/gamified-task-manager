from django.core.management.base import BaseCommand 
from django.contrib.auth import get_user_model 
from django.conf import settings 
import os
from datetime import datetime

User = get_user_model()

class Command(BaseCommand): 
    help = 'Deletes avatar files in media/avatars/ that are no longer referenced by any user and logs the results.'

    def handle(self, *args, **options):
        avatar_dir = os.path.join(settings.MEDIA_ROOT, 'avatars')
        log_dir = os.path.join(settings.BASE_DIR, 'logs')
        log_file = os.path.join(log_dir, f'orphaned_avatar_cleanup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')

        os.makedirs(log_dir, exist_ok=True)
        log_lines = []

        if not os.path.exists(avatar_dir):
            msg = 'Avatar directory does not exist.'
            self.stdout.write(self.style.ERROR(msg))
            log_lines.append(f"[ERROR] {msg}")
            self._write_log(log_file, log_lines)
            return

        all_files = set(os.listdir(avatar_dir))
        used_files = set(
            User.objects.exclude(avatar='').exclude(avatar=None)
            .values_list('avatar', flat=True)
            .filter(avatar__icontains='avatars/')
        )

        used_filenames = set(os.path.basename(f) for f in used_files)
        orphaned_files = all_files - used_filenames

        if not orphaned_files:
            msg = 'No orphaned avatar files found.'
            self.stdout.write(self.style.SUCCESS(msg))
            log_lines.append(f"[OK] {msg}")
            self._write_log(log_file, log_lines)
            return

        deleted_count = 0
        for filename in orphaned_files:
            try:
                full_path = os.path.join(avatar_dir, filename)
                os.remove(full_path)
                deleted_count += 1
                msg = f"🗑️ Deleted: {filename}"
                self.stdout.write(msg)
                log_lines.append(f"[DELETED] {filename}")
            except Exception as e:
                err_msg = f"Error deleting {filename}: {e}"
                self.stdout.write(self.style.ERROR(err_msg))
                log_lines.append(f"[ERROR] {err_msg}")

        summary = f"✅ Deleted {deleted_count} orphaned avatar(s)."
        self.stdout.write(self.style.SUCCESS(summary))
        log_lines.append(f"[SUMMARY] {summary}")

        self._write_log(log_file, log_lines)
        self.stdout.write(f"📄 Log written to: {log_file}")

    def _write_log(self, path, lines):
        with open(path, 'w', encoding='utf-8') as f:
            for line in lines:
                f.write(f"{line}\n")
