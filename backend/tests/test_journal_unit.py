
def _register_and_login(client, email="journal@example.com", password="Password123!"):
    register = client.post("/auth/register", json={"email": email, "password": password})
    assert register.status_code == 201
    login = client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    token = login.get_json().get("access_token")
    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {token}"


def test_journal_create_and_entry_add_edit(client):
    _register_and_login(client)

    journal = client.post("/journals/", json={"title": "Unit Journal"})
    assert journal.status_code == 201
    journal_id = journal.get_json()["id"]

    entry = client.post(
        f"/journals/{journal_id}/entries",
        json={"title": "Entry", "content_json": {"blocks": []}},
    )
    assert entry.status_code == 201
    entry_id = entry.get_json()["id"]

    update = client.patch(
        f"/journals/{journal_id}/entries/{entry_id}",
        json={"title": "Updated Entry"},
    )
    assert update.status_code == 200
    assert update.get_json()["title"] == "Updated Entry"


def test_user_cannot_access_another_users_journal(client):
    _register_and_login(client, email="owner@example.com")

    journal = client.post("/journals/", json={"title": "Private"})
    assert journal.status_code == 201
    journal_id = journal.get_json()["id"]

    client.post("/auth/register", json={"email": "other@example.com", "password": "Password123!"})
    login_other = client.post(
        "/auth/login",
        json={"email": "other@example.com", "password": "Password123!"},
    )
    assert login_other.status_code == 200

    response = client.get(f"/journals/{journal_id}")
    assert response.status_code == 404

    entries_response = client.get(f"/journals/{journal_id}/entries")
    assert entries_response.status_code == 404
