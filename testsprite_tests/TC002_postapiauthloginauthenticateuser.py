import requests
import time

BASE_URL = "http://localhost:5000"

def _signup_fresh_user():
    """Helper: creates a brand-new user and returns (email, password, handle)."""
    ts = int(time.time())
    email = f"ts_login_{ts}@example.com"
    password = "StrongPass!234"
    handle = f"tslogin_{ts}"
    r = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json={"email": email, "password": password, "username": handle},
        timeout=30
    )
    assert r.status_code == 201, f"Setup signup failed: {r.status_code} {r.text}"
    return email, password, handle

def test_postapiauthloginauthenticateuser():
    """
    Login uses field name 'identifier' (not 'email') per the backend API contract.
    We first sign up a fresh user so credentials are guaranteed to exist.
    """
    email, password, handle = _signup_fresh_user()

    login_url = f"{BASE_URL}/api/auth/login"
    # ✅ Correct field name is 'identifier', not 'email'
    login_payload = {
        "identifier": email,
        "password": password
    }

    try:
        response = requests.post(login_url, json=login_payload, timeout=30)
        assert response.status_code == 200, \
            f"Expected status 200, got {response.status_code}. Body: {response.text}"

        json_resp = response.json()
        assert "user" in json_resp, f"User profile not found in response. Got: {json_resp}"
        assert "token" in json_resp, f"JWT token not found in response. Got: {json_resp}"

        token = json_resp.get("token")
        assert isinstance(token, str) and len(token) > 0, \
            f"Invalid JWT token returned: {token}"

        user = json_resp["user"]
        assert user.get("handle") == handle, \
            f"Handle mismatch: expected {handle}, got {user.get('handle')}"

        print(f"[PASS] TC002 - Login successful. Token length: {len(token)}")

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_postapiauthloginauthenticateuser()
