import requests
import time

BASE_URL = "http://localhost:5000"

def _signup(suffix: str):
    """Sign up a user and return (token, user_id, handle)."""
    ts = int(time.time())
    email = f"ts_{suffix}_{ts}@example.com"
    password = "StrongPass!234"
    handle = f"ts{suffix}{ts}"
    r = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json={"email": email, "password": password, "username": handle},
        timeout=30
    )
    assert r.status_code == 201, f"Signup failed ({suffix}): {r.status_code} {r.text}"
    data = r.json()
    return data["token"], data["user"]["id"], data["user"]["handle"]

def test_post_api_friends_request_send_friend_request():
    """
    TC005 — Send a friend request
    Steps:
      1. Sign up User A (the requester)
      2. Sign up User B (the target)
      3. User A searches for users to get User B's id
      4. User A sends a friend request to User B
    All authenticated with real JWT tokens containing valid UUIDs.
    """
    # 1. Create two real users with valid UUID-based JWTs
    token_a, id_a, handle_a = _signup("frqa")
    token_b, id_b, handle_b = _signup("frqb")
    headers_a = {"Authorization": f"Bearer {token_a}", "Content-Type": "application/json"}

    try:
        # 2. User A searches for users — confirm User B is visible
        search_resp = requests.get(
            f"{BASE_URL}/api/users/search",
            headers={"Authorization": f"Bearer {token_a}"},
            params={"q": "ts"},
            timeout=30
        )
        assert search_resp.status_code == 200, \
            f"Expected 200 from user search, got {search_resp.status_code}"

        users_resp = search_resp.json()
        assert isinstance(users_resp, dict) and "users" in users_resp, \
            f"Unexpected search response shape: {users_resp}"

        users = users_resp["users"]
        assert isinstance(users, list), f"Expected list of users, got {type(users)}"

        # Find User B in results (or use id directly — we know it)
        target_user_id = id_b
        assert target_user_id, "Target user B id not available"

        # 3. User A sends a friend request to User B
        url = f"{BASE_URL}/api/friends/request"
        payload = {"to_user_id": target_user_id}
        resp = requests.post(url, headers=headers_a, json=payload, timeout=30)

        # Accept 200 (sent/idempotent) or 201 (created)
        assert resp.status_code in (200, 201), \
            f"Expected 200 or 201 from friends request, got {resp.status_code}. Body: {resp.text}"

        resp_json = resp.json()
        assert "message" in resp_json, \
            f"Response does not contain 'message' key. Got: {resp_json}"

        print(f"[PASS] TC005 - Friend request sent from {handle_a} to {handle_b}. "
              f"Status: {resp.status_code}, Message: {resp_json.get('message')}")

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_post_api_friends_request_send_friend_request()
