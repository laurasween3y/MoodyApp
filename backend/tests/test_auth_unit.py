from datetime import datetime, timedelta, timezone
import jwt


def _register(client, email="auth@example.com", password="Password123!"):
    response = client.post("/auth/register", json={"email": email, "password": password})
    assert response.status_code == 201


def _login(client, email="auth@example.com", password="Password123!"):
    response = client.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200


def test_invalid_login_returns_401(client):
    _register(client)
    response = client.post(
        "/auth/login",
        json={"email": "auth@example.com", "password": "WrongPassword"},
    )
    assert response.status_code == 401


def test_access_protected_without_token(client):
    response = client.get("/profile")
    assert response.status_code == 401


def test_expired_token_rejected(client, app):
    _register(client)
    with app.app_context():
        from app.models import User

        user = User.query.filter_by(email="auth@example.com").first()
        assert user is not None
        payload = {
            "sub": str(user.id),
            "jti": "expired-token",
            "iat": datetime.now(timezone.utc) - timedelta(hours=2),
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        }
        token = jwt.encode(payload, app.config["SECRET_KEY"], algorithm="HS256")

    cookie_name = app.config.get("JWT_COOKIE_NAME", "moody_access_token")
    client.set_cookie(cookie_name, token)

    response = client.get("/profile")
    assert response.status_code == 401


def test_revoked_token_rejected(client, app):
    _register(client)
    with app.app_context():
        from app.extensions import db
        from app.models import User, TokenBlacklist

        user = User.query.filter_by(email="auth@example.com").first()
        assert user is not None
        payload = {
            "sub": str(user.id),
            "jti": "revoked-token",
            "iat": datetime.now(timezone.utc) - timedelta(minutes=5),
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        }
        token = jwt.encode(payload, app.config["SECRET_KEY"], algorithm="HS256")
        db.session.add(
            TokenBlacklist(jti="revoked-token", expires_at=datetime.now(timezone.utc) + timedelta(hours=1))
        )
        db.session.commit()

    cookie_name = app.config.get("JWT_COOKIE_NAME", "moody_access_token")
    client.set_cookie(cookie_name, token)

    response = client.get("/profile")
    assert response.status_code == 401
