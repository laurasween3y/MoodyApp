import os

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/moody_test")
os.environ.setdefault("SECRET_KEY", "test-secret")

from app.models import User


def test_password_hash_and_verify():
    user = User()
    user.set_password("test-password-123")
    assert user.password_hash
    assert user.check_password("test-password-123") is True
    assert user.check_password("wrong-password") is False
