import os
import sys
from urllib.parse import urlparse

import pytest


def _resolve_db_url() -> str | None:
    return os.getenv("DATABASE_URL_TEST") or os.getenv("DATABASE_URL")


def _is_safe_test_db(url: str) -> bool:
    if "test" in url.lower():
        return True
    try:
        parsed = urlparse(url)
    except Exception:
        return False
    db_name = (parsed.path or "").lstrip("/")
    return "test" in db_name.lower()


def _ensure_project_path():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)


@pytest.fixture(scope="session")
def app():
    _ensure_project_path()
    db_url = _resolve_db_url()
    if not db_url:
        pytest.skip("DATABASE_URL_TEST or DATABASE_URL not set")

    if not _is_safe_test_db(db_url):
        pytest.skip(
            "Refusing to run integration tests on a non-test database. "
            "Set DATABASE_URL_TEST to a dedicated test DB."
        )

    os.environ["DATABASE_URL"] = db_url
    os.environ.setdefault("SECRET_KEY", "test-secret")

    from app.app import create_app

    app = create_app()
    app.config.update(TESTING=True)
    return app


@pytest.fixture()
def client(app):
    from app.extensions import db

    with app.app_context():
        db.drop_all()
        db.create_all()

    with app.test_client() as client:
        yield client

    with app.app_context():
        db.session.remove()
