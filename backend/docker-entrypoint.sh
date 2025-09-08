#!/usr/bin/env bash
set -e

: "${POSTGRES_HOST:=db}"
: "${POSTGRES_PORT:=5432}"
: "${POSTGRES_USER:=postgres}"
: "${POSTGRES_PASSWORD:=postgres}"
: "${POSTGRES_DB:=gtm_db}"
: "${DJANGO_SETTINGS_MODULE:=core.settings.dev}"
: "${RUN_CMD:=gunicorn core.wsgi:application --bind 0.0.0.0:8000}"

echo "[entrypoint] Waiting for postgres $POSTGRES_HOST:$POSTGRES_PORT ..."
until python - <<PY
import sys, socket
s=socket.socket()
try:
    s.settimeout(2)
    s.connect(("$POSTGRES_HOST", int("$POSTGRES_PORT"))); 
    print("ok")
except Exception:
    sys.exit(1)
finally:
    s.close()
PY
do
  echo "[entrypoint] DB not ready, sleeping..."
  sleep 2
done

echo "[entrypoint] Ensuring database '$POSTGRES_DB' exists..."
python - <<PY
import os, psycopg2
host=os.environ.get("POSTGRES_HOST","db")
port=int(os.environ.get("POSTGRES_PORT","5432"))
user=os.environ.get("POSTGRES_USER","postgres")
pwd=os.environ.get("POSTGRES_PASSWORD","postgres")
dbname=os.environ.get("POSTGRES_DB","gtm_db")
conn = psycopg2.connect(host=host, port=port, user=user, password=pwd, dbname="postgres")
conn.autocommit = True
cur = conn.cursor()
cur.execute("SELECT 1 FROM pg_database WHERE datname=%s", (dbname,))
if not cur.fetchone():
    cur.execute('CREATE DATABASE "{}"'.format(dbname.replace('"','""')))
    print(f"[entrypoint] Created database {dbname}")
else:
    print(f"[entrypoint] Database {dbname} already exists")
cur.close(); conn.close()
PY

echo "[entrypoint] Migrate..."
python manage.py migrate --settings="$DJANGO_SETTINGS_MODULE"

echo "[entrypoint] Ensure admin (admin/admin)..."
python - <<PY
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", os.environ.get("DJANGO_SETTINGS_MODULE","core.settings.dev"))
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
print(f"[entrypoint] {'Created' if created else 'Updated'} admin")
PY

echo "[entrypoint] Promote admin via management command..."
python manage.py promote_admin --username admin --set-flags --settings="$DJANGO_SETTINGS_MODULE" || true

echo "[entrypoint] collectstatic..."
python manage.py collectstatic --noinput --settings="$DJANGO_SETTINGS_MODULE" || true

echo "[entrypoint] Starting: $RUN_CMD"
exec $RUN_CMD
