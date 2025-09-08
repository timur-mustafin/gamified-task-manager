@echo off
setlocal
cd /d %~dp0

echo [init] Creating venv...
python -m venv venv || goto :eof
call venv\Scripts\activate

echo [init] Installing requirements...
python -m pip install --upgrade pip
pip install -r requirements.txt

set DJANGO_SETTINGS_MODULE=core.settings.dev
echo [init] Migrate...
python manage.py migrate --settings=core.settings.dev

echo [init] Ensure admin (admin/admin)...
python - <<PY
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings.dev")
import django; django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
u, created = User.objects.get_or_create(username="admin", defaults={"email":"admin@example.com"})
u.is_staff = True
u.is_superuser = True
u.set_password("admin")
if hasattr(u, "role"):
    setattr(u, "role", "admin")
u.save()
print(f"{'Created' if created else 'Updated'} admin")
PY

echo [init] Promote admin...
python manage.py promote_admin --username admin --set-flags --settings=core.settings.dev

echo [init] Runserver 0.0.0.0:8000
python manage.py runserver 0.0.0.0:8000 --settings=core.settings.dev
