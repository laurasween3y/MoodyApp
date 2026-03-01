from datetime import date


def _register_and_login(client, email="planner@example.com", password="Password123!"):
    register = client.post("/auth/register", json={"email": email, "password": password})
    assert register.status_code == 201
    login = client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200


def test_planner_create_and_delete_event(client):
    _register_and_login(client)

    create = client.post(
        "/planner/events",
        json={"title": "Meeting", "event_date": date.today().isoformat()},
    )
    assert create.status_code == 201
    event_id = create.get_json()["id"]

    delete = client.delete(f"/planner/events/{event_id}")
    assert delete.status_code == 204


def test_planner_requires_auth(client):
    response = client.get("/planner/events")
    assert response.status_code == 401
