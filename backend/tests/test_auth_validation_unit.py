
def test_register_duplicate_email(client):
    first = client.post("/auth/register", json={"email": "dup@example.com", "password": "Password123!"})
    assert first.status_code == 201

    second = client.post("/auth/register", json={"email": "dup@example.com", "password": "Password123!"})
    assert second.status_code == 409


def test_register_requires_email_and_password(client):
    response = client.post("/auth/register", json={})
    assert response.status_code == 422


def test_login_requires_payload(client):
    response = client.post("/auth/login", json={})
    assert response.status_code == 422
