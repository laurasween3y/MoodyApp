import os
import jwt
from flask import Flask

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/moody_test")
os.environ.setdefault("SECRET_KEY", "test-secret")

from app.blueprints.auth import _sign_jwt


def test_sign_jwt_includes_required_claims():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = "test-secret"

    with app.app_context():
        token = _sign_jwt(1)
        payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        assert payload.get("sub") == "1"
        assert payload.get("jti")
        assert payload.get("iat")
        assert payload.get("exp")
