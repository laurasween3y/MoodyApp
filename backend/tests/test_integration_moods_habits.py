from datetime import date


def _register_and_login(client, email="test@example.com", password="Password123!"):
    register = client.post(
        "/auth/register",
        json={"email": email, "password": password},
    )
    assert register.status_code == 201

    login = client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    assert login.status_code == 200


def test_mood_create_and_fetch_today(client):
    _register_and_login(client)

    create = client.post(
        "/moods/",
        json={"mood": "happy", "note": "feeling good"},
    )
    assert create.status_code in (200, 201)

    today = client.get("/moods/today")
    assert today.status_code == 200
    payload = today.get_json()
    assert payload.get("mood") == "happy"


def test_habit_create_and_toggle_completion(client):
    _register_and_login(client)

    create = client.post(
        "/habits/",
        json={"title": "Drink water", "frequency": "daily", "target_per_week": 7},
    )
    assert create.status_code == 201
    habit_id = create.get_json()["id"]

    today = date.today().isoformat()
    toggle = client.post(
        f"/habits/{habit_id}/toggle",
        json={"date": today},
    )
    assert toggle.status_code == 200
    toggle_payload = toggle.get_json()
    assert today in toggle_payload.get("completions", [])


def test_notification_settings_roundtrip(client):
    _register_and_login(client)

    get_settings = client.get("/notification-settings")
    assert get_settings.status_code == 200
    payload = get_settings.get_json()
    assert payload["mood_reminder_enabled"] is False
    assert payload["habit_reminder_enabled"] is False

    update = client.put(
        "/notification-settings",
        json={
            "mood_reminder_enabled": True,
            "mood_reminder_time": "08:30:00",
        },
    )
    assert update.status_code == 200
    updated_payload = update.get_json()
    assert updated_payload["mood_reminder_enabled"] is True
    assert updated_payload["mood_reminder_time"].startswith("08:30")


def test_mood_options_endpoint(client):
    _register_and_login(client)

    response = client.get("/moods/options")
    assert response.status_code == 200
    payload = response.get_json()
    assert isinstance(payload.get("options"), list)
    assert "happy" in payload["options"]
