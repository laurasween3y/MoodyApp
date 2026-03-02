import io


def _register_and_login(client, email="cover@example.com", password="Password123!"):
    register = client.post("/auth/register", json={"email": email, "password": password})
    assert register.status_code == 201
    login = client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    token = login.get_json().get("access_token")
    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {token}"


def test_cover_upload_requires_file(client):
    _register_and_login(client)

    journal = client.post("/journals/", json={"title": "Cover Journal"})
    assert journal.status_code == 201
    journal_id = journal.get_json()["id"]

    response = client.post(f"/journals/{journal_id}/cover", data={}, content_type="multipart/form-data")
    assert response.status_code == 400


def test_cover_upload_rejects_invalid_type(client):
    _register_and_login(client)

    journal = client.post("/journals/", json={"title": "Cover Journal"})
    assert journal.status_code == 201
    journal_id = journal.get_json()["id"]

    data = {
        "file": (io.BytesIO(b"not-an-image"), "cover.txt", "text/plain"),
    }
    response = client.post(
        f"/journals/{journal_id}/cover",
        data=data,
        content_type="multipart/form-data",
    )
    assert response.status_code == 415


def test_cover_upload_rejects_too_large(client):
    _register_and_login(client)

    journal = client.post("/journals/", json={"title": "Cover Journal"})
    assert journal.status_code == 201
    journal_id = journal.get_json()["id"]

    data = {
        "file": (io.BytesIO(b"a" * (5 * 1024 * 1024 + 1)), "cover.png", "image/png"),
    }
    response = client.post(
        f"/journals/{journal_id}/cover",
        data=data,
        content_type="multipart/form-data",
    )
    assert response.status_code == 413
