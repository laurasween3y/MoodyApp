
def _register_and_login(client, email="tx@example.com", password="Password123!"):
    register = client.post("/auth/register", json={"email": email, "password": password})
    assert register.status_code == 201
    login = client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    token = login.get_json().get("access_token")
    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {token}"


def test_transaction_failure_rolls_back(client, monkeypatch):
    _register_and_login(client)

    from app.extensions import db

    called = {"rollback": False}

    def fail_commit():
        raise Exception("boom")

    def rollback():
        called["rollback"] = True

    monkeypatch.setattr(db.session, "commit", fail_commit)
    monkeypatch.setattr(db.session, "rollback", rollback)

    response = client.post("/moods/", json={"mood": "happy"})
    assert response.status_code == 500
    assert called["rollback"] is True
