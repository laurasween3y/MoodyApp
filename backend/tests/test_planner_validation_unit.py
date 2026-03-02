from datetime import date


def _register_and_login(client, email="planner-validation@example.com", password="Password123!"):
    register = client.post("/auth/register", json={"email": email, "password": password})
    assert register.status_code == 201
    login = client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    token = login.get_json().get("access_token")
    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {token}"


def test_planner_rejects_end_time_before_start_time(client):
    _register_and_login(client)

    response = client.post(
        "/planner/events",
        json={
            "title": "Invalid",
            "event_date": date.today().isoformat(),
            "start_time": "14:00",
            "end_time": "09:00",
        },
    )
    assert response.status_code == 422
