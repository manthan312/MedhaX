import requests
import time

BASE_URL = "http://localhost:5000"

def _create_user_and_get_token():
    """Sign up a fresh user and return a real JWT token with valid UUID sub."""
    ts = int(time.time())
    email = f"ts_online_{ts}@example.com"
    password = "StrongPass!234"
    handle = f"tsonline_{ts}"
    r = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json={"email": email, "password": password, "username": handle},
        timeout=30
    )
    assert r.status_code == 201, f"Setup signup failed: {r.status_code} {r.text}"
    return r.json()["token"]

def test_get_api_users_online_get_online_users():
    """
    GET /api/users/online — returns all currently online users (excluding self).
    Response shape: { "users": [...] }
    Uses a real JWT token with a valid UUID sub.
    """
    token = _create_user_and_get_token()
    url = f"{BASE_URL}/api/users/online"
    headers = {"Authorization": f"Bearer {token}"}

    try:
        response = requests.get(url, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, \
        f"Expected status code 200 but got {response.status_code}. Body: {response.text}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not in JSON format"

    # ✅ Response is { "users": [...] }
    assert isinstance(data, dict), \
        f"Expected response to be a dict. Got: {type(data)}"
    assert "users" in data, \
        f"Response missing 'users' key. Got keys: {list(data.keys())}"

    users = data["users"]
    assert isinstance(users, list), \
        f"'users' should be a list. Got: {type(users)}"

    # Each online user should have id, handle, online: true
    for user in users:
        assert isinstance(user, dict), f"Each user entry should be a dict. Got: {type(user)}"
        assert "id" in user, f"User missing 'id'. Got: {user}"
        assert "handle" in user, f"User missing 'handle'. Got: {user}"

    print(f"[PASS] TC008 - /users/online returned {len(users)} online users")

test_get_api_users_online_get_online_users()
