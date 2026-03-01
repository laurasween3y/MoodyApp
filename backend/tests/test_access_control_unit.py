from datetime import date


def _register(client, email, password="Password123!"):
    response = client.post("/auth/register", json={"email": email, "password": password})
    assert response.status_code == 201


def _login(client, email, password="Password123!"):
    response = client.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200


def test_cross_user_mood_access_blocked(client):
    _register(client, "owner@example.com")
    _login(client, "owner@example.com")
    create = client.post("/moods/", json={"mood": "happy", "date": date.today().isoformat()})
    assert create.status_code in (200, 201)
    mood_id = create.get_json()["id"]

    _register(client, "other@example.com")
    _login(client, "other@example.com")

    get_resp = client.get(f"/moods/{mood_id}")
    assert get_resp.status_code == 404

    delete_resp = client.delete(f"/moods/{mood_id}")
    assert delete_resp.status_code == 404


def test_cross_user_habit_access_blocked(client):
    _register(client, "habitowner@example.com")
    _login(client, "habitowner@example.com")
    create = client.post("/habits/", json={"title": "Read", "frequency": "daily", "target_per_week": 7})
    assert create.status_code == 201
    habit_id = create.get_json()["id"]

    _register(client, "habitother@example.com")
    _login(client, "habitother@example.com")

    get_resp = client.get(f"/habits/{habit_id}")
    assert get_resp.status_code == 404

    delete_resp = client.delete(f"/habits/{habit_id}")
    assert delete_resp.status_code == 404


def test_cross_user_planner_access_blocked(client):
    _register(client, "plannerowner@example.com")
    _login(client, "plannerowner@example.com")
    create = client.post(
        "/planner/events",
        json={"title": "Event", "event_date": date.today().isoformat()},
    )
    assert create.status_code == 201
    event_id = create.get_json()["id"]

    _register(client, "plannerother@example.com")
    _login(client, "plannerother@example.com")

    get_resp = client.get(f"/planner/events/{event_id}")
    assert get_resp.status_code == 404

    delete_resp = client.delete(f"/planner/events/{event_id}")
    assert delete_resp.status_code == 404
