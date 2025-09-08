from .base import *
DEBUG = True

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",   # Vite dev
    "http://127.0.0.1:3000",   # Vite dev (alt)
    "http://0.0.0.0:3000",   # Vite dev (alt)
    "http://localhost:3001",   # Nginx demo
    "http://127.0.0.1:3001",   # Nginx demo (alt)
    "http://0.0.0.0:3001"  # Nginx demo (alt)
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",   # Vite dev
    "http://127.0.0.1:3000",   # Vite dev (alt)
    "http://0.0.0.0:3000",   # Vite dev (alt)
    "http://localhost:3001",   # Nginx demo
    "http://127.0.0.1:3001",   # Nginx demo (alt)
    "http://0.0.0.0:3001"  # Nginx demo (alt)
]