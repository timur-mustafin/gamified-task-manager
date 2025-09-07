import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from tasks.models import Task

User = get_user_model()

@pytest.mark.django_db
def test_create_task():
    user = User.objects.create_user(username="giver", password="pass")
    client = APIClient()
    login = client.post('/auth/jwt/create/', {"username": "giver", "password": "pass"})
    token = login.data['access']
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    task = client.post('/tasks/', {
        "title": "Unit Test Task",
        "description": "Task for testing",
        "priority": "medium",
        "difficulty": "medium",
        "approx_time": 1.0
    })
    assert task.status_code == 201