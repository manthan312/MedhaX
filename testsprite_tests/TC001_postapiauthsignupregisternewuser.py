import requests
import time

BASE_URL = "http://localhost:5000"

def test_post_api_auth_signup_register_new_user():
    url = f"{BASE_URL}/api/auth/signup"
    headers = {"Content-Type": "application/json"}

    # Use a unique email per run so re-runs never hit "already registered"
    unique_suffix = int(time.time())
    payload = {
        "email": f"testsprite_{unique_suffix}@example.com",
        "password": "StrongPass!234",
        "username": f"testuser_{unique_suffix}"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        assert response.status_code == 201, \
            f"Expected status 201 but got {response.status_code}. Body: {response.text}"

        data = response.json()

        # Response shape: { "token": "...", "user": { "id": ..., "handle": ..., "email": ... } }
        assert "token" in data, f"Response JSON missing 'token'. Got: {data}"
        assert "user" in data, f"Response JSON missing 'user'. Got: {data}"

        user = data["user"]
        assert isinstance(user, dict), f"'user' is not an object, got: {type(user)}"

        # API returns 'handle', not 'username'
        assert "handle" in user, f"'user' object missing 'handle' field. Got keys: {list(user.keys())}"
        assert user.get("email") == payload["email"], \
            f"Email mismatch: expected {payload['email']}, got {user.get('email')}"
        assert user.get("handle") == payload["username"], \
            f"Handle mismatch: expected {payload['username']}, got {user.get('handle')}"

        print(f"[PASS] TC001 - Signup successful. Handle: {user['handle']}")

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_post_api_auth_signup_register_new_user()
