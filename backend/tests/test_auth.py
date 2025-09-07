import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
def test_register_and_login():
    client = APIClient()
    register = client.post('/auth/register/', {
        "username": "testuser",
        "email": "test@example.com",
        "password": "TestPass123",
        "job_position": "Tester"
    })
    assert register.status_code == 201

    login = client.post('/auth/jwt/create/', {
        "username": "testuser",
        "password": "TestPass123"
    })
    assert login.status_code == 200
    assert 'access' in login.data
    assert 'refresh' in login.data