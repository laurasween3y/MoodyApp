from datetime import date
import io


def _register_and_login(client, email="journaler@example.com", password="Password123!"):
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


def test_profile_get_and_update(client):
    _register_and_login(client)

    profile = client.get("/profile")
    assert profile.status_code == 200
    payload = profile.get_json()
    assert payload.get("email") == "journaler@example.com"

    update = client.put(
        "/profile",
        json={"email": "updated@example.com", "password": "NewPass123!"},
    )
    assert update.status_code == 200
    updated_payload = update.get_json()
    assert updated_payload.get("email") == "updated@example.com"


def test_progress_endpoints_default(client):
    _register_and_login(client)

    streaks = client.get("/progress/streaks")
    assert streaks.status_code == 200
    streak_payload = streaks.get_json()
    assert streak_payload.get("mood_current") == 0
    assert streak_payload.get("habit_current") == 0

    achievements = client.get("/progress/achievements")
    assert achievements.status_code == 200
    ach_payload = achievements.get_json()
    assert isinstance(ach_payload.get("all_possible"), list)
    assert len(ach_payload.get("all_possible")) > 0


def test_journal_and_entry_crud(client):
    _register_and_login(client)

    create = client.post(
        "/journals/",
        json={"title": "My Journal", "description": "Testing"},
    )
    assert create.status_code == 201
    journal_id = create.get_json()["id"]

    listing = client.get("/journals/")
    assert listing.status_code == 200
    assert len(listing.get_json()) == 1

    update = client.patch(
        f"/journals/{journal_id}",
        json={"title": "Updated Journal"},
    )
    assert update.status_code == 200
    assert update.get_json().get("title") == "Updated Journal"

    entry = client.post(
        f"/journals/{journal_id}/entries",
        json={"title": "Day 1", "content_json": {"blocks": []}},
    )
    assert entry.status_code == 201
    entry_id = entry.get_json()["id"]

    entries = client.get(f"/journals/{journal_id}/entries")
    assert entries.status_code == 200
    assert len(entries.get_json()) == 1

    entry_update = client.patch(
        f"/journals/{journal_id}/entries/{entry_id}",
        json={"title": "Updated Entry"},
    )
    assert entry_update.status_code == 200
    assert entry_update.get_json().get("title") == "Updated Entry"

    entry_delete = client.delete(f"/journals/{journal_id}/entries/{entry_id}")
    assert entry_delete.status_code == 204

    journal_delete = client.delete(f"/journals/{journal_id}")
    assert journal_delete.status_code == 204


def test_planner_event_crud(client):
    _register_and_login(client)

    create = client.post(
        "/planner/events",
        json={
            "title": "Study",
            "event_date": date.today().isoformat(),
            "reminder_minutes_before": 15,
        },
    )
    assert create.status_code == 201
    event_id = create.get_json()["id"]

    listing = client.get("/planner/events")
    assert listing.status_code == 200
    assert len(listing.get_json()) == 1

    update = client.put(
        f"/planner/events/{event_id}",
        json={"title": "Updated Study"},
    )
    assert update.status_code == 200
    assert update.get_json().get("title") == "Updated Study"

    delete = client.delete(f"/planner/events/{event_id}")
    assert delete.status_code == 204


def test_journal_cover_upload(client, app, tmp_path):
    _register_and_login(client)

    app.config["UPLOAD_FOLDER"] = str(tmp_path)

    create = client.post(
        "/journals/",
        json={"title": "Cover Journal", "description": "Testing cover"},
    )
    assert create.status_code == 201
    journal_id = create.get_json()["id"]

    data = {
        "file": (io.BytesIO(b"\x89PNG\r\n\x1a\nfake"), "cover.png", "image/png"),
    }
    response = client.post(
        f"/journals/{journal_id}/cover",
        data=data,
        content_type="multipart/form-data",
    )
    assert response.status_code == 200
    payload = response.get_json()
    assert payload.get("cover_url")


def test_journal_prompts_random(client, app):
    _register_and_login(client)

    from app.extensions import db
    from app.models import JournalPrompt

    with app.app_context():
        prompt = JournalPrompt(text="Reflect on a recent win", category="growth")
        db.session.add(prompt)
        db.session.commit()

    response = client.get("/journal-prompts/random")
    assert response.status_code == 200
    payload = response.get_json()
    assert payload.get("text") == "Reflect on a recent win"


def test_affirmations_endpoint(client):
    response = client.get("/affirmations/")
    assert response.status_code == 200
    payload = response.get_json()
    assert isinstance(payload.get("affirmation"), str)
    assert payload.get("affirmation")


def test_logout_revokes_cookie(client):
    _register_and_login(client)

    profile = client.get("/profile")
    assert profile.status_code == 200

    logout = client.post("/auth/logout")
    assert logout.status_code == 200

    after_logout = client.get("/profile")
    assert after_logout.status_code == 401
