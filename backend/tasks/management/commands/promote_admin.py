from __future__ import annotations
from typing import Any, List
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db import transaction

class Command(BaseCommand):
    help = "Promote a user to admin (role/group and optional flags). Idempotent."

    def add_arguments(self, parser) -> None:
        parser.add_argument("--username", default="admin", help="Username to promote (default: admin)")
        parser.add_argument("--set-flags", action="store_true", help="Also set is_staff/is_superuser=True")
        parser.add_argument("--role", default="admin", help="Value for 'role' field if present")
        parser.add_argument("--group", default="admin", help="Group to add if 'role' field missing")

    @transaction.atomic
    def handle(self, *args: Any, **options: Any) -> None:
        username: str = options["username"]
        set_flags: bool = bool(options["set_flags"])
        desired_role: str = options["role"]
        group_name: str = options["group"]

        User = get_user_model()
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist as exc:
            raise CommandError(f"User '{username}' not found") from exc

        changed: List[str] = []

        if set_flags:
            if not getattr(user, "is_staff", False):
                user.is_staff = True
                changed.append("is_staff")
            if not getattr(user, "is_superuser", False):
                user.is_superuser = True
                changed.append("is_superuser")

        if hasattr(user, "role"):
            if getattr(user, "role", None) != desired_role:
                setattr(user, "role", desired_role)
                changed.append("role")
        else:
            grp, _ = Group.objects.get_or_create(name=group_name)
            if not user.groups.filter(id=grp.id).exists():
                user.groups.add(grp)

        if changed:
            user.save(update_fields=changed)

        self.stdout.write(self.style.SUCCESS(f"Promoted '{username}'. Changed: {changed or 'none'}"))
