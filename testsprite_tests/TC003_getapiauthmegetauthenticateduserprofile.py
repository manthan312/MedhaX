import requests
import time

BASE_URL = "http://localhost:5000"

def _create_user_and_get_token():
    """
    Signs up a fresh user and returns a real JWT token with a valid UUID sub.
    This avoids the invalid-UUID test token that caused DB 500 errors.
    """
    ts = int(time.time())
    email = f"ts_me_{ts}@example.com"
    password = "StrongPass!234"
    handle = f"tsme_{ts}"
    r = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json={"email": email, "password": password, "username": handle},
        timeout=30
    )
    assert r.status_code == 201, f"Setup signup failed: {r.status_code} {r.text}"
    return r.json()["token"]

def test_get_authenticated_user_profile():
    """
    GET /api/auth/me — must use a real JWT with a valid UUID sub.
    Response: { user: { id, handle, email_hash, created_at, username } }
    """
    token = _create_user_and_get_token()
    url = f"{BASE_URL}/api/auth/me"
    headers = {"Authorization": f"Bearer {token}"}

    try:
        response = requests.get(url, headers=headers, timeout=30)
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, \
        f"Expected status code 200, got {response.status_code}. Body: {response.text}"

    try:
        body = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Response shape: { "user": { "id": ..., "handle": ..., "username": ..., ... } }
    assert "user" in body, f"Response missing 'user' key. Got: {body}"
    user_profile = body["user"]

    # 'id' must be present and a string
    assert isinstance(user_profile.get("id"), str) and user_profile.get("id"), \
        f"Invalid or missing 'id' field. Got: {user_profile}"

    # 'handle' is the primary display name field
    assert isinstance(user_profile.get("handle"), str) and user_profile.get("handle"), \
        f"Invalid or missing 'handle' field. Got: {user_profile}"

    # 'username' is aliased from 'handle' for client compatibility
    assert isinstance(user_profile.get("username"), str) and user_profile.get("username"), \
        f"Invalid or missing 'username' field (alias of handle). Got: {user_profile}"

    print(f"[PASS] TC003 - /auth/me returned profile for: {user_profile.get('handle')}")

test_get_authenticated_user_profile()
