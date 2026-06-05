import requests
import time

BASE_URL = "http://localhost:5000"

def _create_user_and_get_token():
    """Sign up a fresh user and return a real JWT token with valid UUID sub."""
    ts = int(time.time())
    email = f"ts_search_{ts}@example.com"
    password = "StrongPass!234"
    handle = f"tssearch_{ts}"
    r = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json={"email": email, "password": password, "username": handle},
        timeout=30
    )
    assert r.status_code == 201, f"Setup signup failed: {r.status_code} {r.text}"
    return r.json()["token"]

def test_get_api_users_search_registered_users():
    """
    GET /api/users/search?q=<query>
    - Uses 'q' query param (not 'username')
    - Response shape: { "users": [ { "id": ..., "handle": ..., "online": ... }, ... ] }
    """
    token = _create_user_and_get_token()
    headers = {"Authorization": f"Bearer {token}"}
    # ✅ Correct param is 'q', not 'username'
    params = {"q": "ts"}

    try:
        response = requests.get(
            f"{BASE_URL}/api/users/search",
            headers=headers,
            params=params,
            timeout=30
        )
        assert response.status_code == 200, \
            f"Expected status 200, got {response.status_code}. Body: {response.text}"

        json_data = response.json()

        # ✅ Response is { "users": [...] }, not a raw list
        assert isinstance(json_data, dict), \
            f"Expected response to be a dict, got {type(json_data)}"
        assert "users" in json_data, \
            f"Response dict missing 'users' key. Got keys: {list(json_data.keys())}"

        users = json_data["users"]
        assert isinstance(users, list), \
            f"'users' field should be a list, got {type(users)}"

        for user in users:
            assert isinstance(user, dict), f"Each user should be a dict, got {type(user)}"
            assert "handle" in user, f"User object missing 'handle' field. Got: {user}"
            assert "id" in user, f"User object missing 'id' field. Got: {user}"

        print(f"[PASS] TC004 - /users/search returned {len(users)} users")

    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_api_users_search_registered_users()
