from datetime import date


def _register_and_login(client, email="habit@example.com", password="Password123!"):
    register = client.post("/auth/register", json={"email": email, "password": password})
    assert register.status_code == 201
    login = client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    token = login.get_json().get("access_token")
    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {token}"


def test_habit_create_and_toggle_completion(client):
    _register_and_login(client)

    habit = client.post(
        "/habits/",
        json={"title": "Read", "frequency": "daily", "target_per_week": 7},
    )
    assert habit.status_code == 201
    habit_id = habit.get_json()["id"]

    toggle = client.post(
        f"/habits/{habit_id}/toggle",
        json={"date": date.today().isoformat()},
    )
    assert toggle.status_code == 200
    payload = toggle.get_json()
    assert payload.get("completions")


def test_habit_fk_integrity_edge_case(client):
    _register_and_login(client)

    response = client.post(
        "/habits/999999/toggle",
        json={"date": date.today().isoformat()},
    )
    assert response.status_code == 404
