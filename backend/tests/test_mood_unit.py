from datetime import date, timedelta


def _register_and_login(client, email="mood@example.com", password="Password123!"):
    register = client.post("/auth/register", json={"email": email, "password": password})
    assert register.status_code == 201
    login = client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200


def test_one_mood_per_day_rule(client):
    _register_and_login(client)

    first = client.post("/moods/", json={"mood": "happy"})
    assert first.status_code in (200, 201)

    second = client.post("/moods/", json={"mood": "sad"})
    assert second.status_code == 200

    listing = client.get("/moods/")
    assert listing.status_code == 200
    payload = listing.get_json()
    assert len(payload) == 1
    assert payload[0]["mood"] == "sad"


def test_edit_mood(client):
    _register_and_login(client)

    create = client.post("/moods/", json={"mood": "happy"})
    mood_id = create.get_json()["id"]

    update = client.patch(
        f"/moods/{mood_id}",
        json={"mood": "anxious", "note": "rough day"},
    )
    assert update.status_code == 200
    payload = update.get_json()
    assert payload["mood"] == "anxious"
    assert payload["note"] == "rough day"


def test_delete_mood(client):
    _register_and_login(client)

    create = client.post("/moods/", json={"mood": "happy"})
    mood_id = create.get_json()["id"]

    delete = client.delete(f"/moods/{mood_id}")
    assert delete.status_code == 204

    listing = client.get("/moods/")
    assert listing.status_code == 200
    assert listing.get_json() == []


def test_prevent_duplicate_mood_dates(client):
    _register_and_login(client)

    today = date.today()
    tomorrow = today + timedelta(days=1)

    first = client.post("/moods/", json={"mood": "happy", "date": today.isoformat()})
    assert first.status_code in (200, 201)
    second = client.post("/moods/", json={"mood": "sad", "date": tomorrow.isoformat()})
    assert second.status_code in (200, 201)

    mood_id = first.get_json()["id"]
    conflict = client.patch(
        f"/moods/{mood_id}",
        json={"date": tomorrow.isoformat()},
    )
    assert conflict.status_code == 409
