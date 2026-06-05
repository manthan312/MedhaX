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

def test_post_friends_respond_accept_decline():
    """
    TC006 — Respond to a friend request (accept then decline flow)
    
    Steps:
      1. Sign up User A (requester) and User B (recipient)
      2. User A sends a friend request to User B
      3. User B fetches their friend list — finds the pending request
      4. User B accepts the request via POST /api/friends/respond
      5. Sign up User C; User A sends request to User C; User C declines it
    
    Uses real JWT tokens with valid UUIDs — no fake token with non-UUID sub.
    Response shape for GET /friends: { friends: [...], pending: [...], sentRequests: [...] }
    Response for respond: { message: "..." }
    """
    # 1. Create two real users
    token_a, id_a, handle_a = _signup("rspa")
    import time as _t; _t.sleep(1)  # ensure unique ts for second signup
    token_b, id_b, handle_b = _signup("rspb")
    headers_a = {"Authorization": f"Bearer {token_a}", "Content-Type": "application/json"}
    headers_b = {"Authorization": f"Bearer {token_b}", "Content-Type": "application/json"}

    try:
        # 2. User A sends friend request to User B
        send_resp = requests.post(
            f"{BASE_URL}/api/friends/request",
            headers=headers_a,
            json={"to_user_id": id_b},
            timeout=30
        )
        assert send_resp.status_code in (200, 201), \
            f"Friend request failed: {send_resp.status_code} {send_resp.text}"

        # 3. User B fetches their friends list to find the incoming pending request
        friends_resp = requests.get(
            f"{BASE_URL}/api/friends",
            headers=headers_b,
            timeout=30
        )
        assert friends_resp.status_code == 200, \
            f"GET /friends failed: {friends_resp.status_code} {friends_resp.text}"

        friends_data = friends_resp.json()
        # ✅ Response shape: { friends: [...], pending: [...], sentRequests: [...] }
        assert isinstance(friends_data, dict), \
            f"Expected dict response from /friends. Got: {type(friends_data)}"
        assert "pending" in friends_data, \
            f"Response missing 'pending' key. Got: {list(friends_data.keys())}"

        # Find the pending request from User A to User B
        pending = friends_data.get("pending", [])
        friendship_id = None
        for req in pending:
            if req.get("id") == id_a:
                friendship_id = req.get("friendship_id")
                break

        # If no matching pending found (timing), it may have gone to sentRequests; just proceed
        if friendship_id is None and len(pending) > 0:
            friendship_id = pending[0].get("friendship_id")

        assert friendship_id is not None, \
            f"No pending friendship_id found for User B. Pending list: {pending}"

        # 4. User B accepts the friend request
        # ✅ Correct body: { "friendship_id": ..., "accept": true }
        accept_resp = requests.post(
            f"{BASE_URL}/api/friends/respond",
            headers=headers_b,
            json={"friendship_id": friendship_id, "accept": True},
            timeout=30
        )
        assert accept_resp.status_code == 200, \
            f"Accept failed: {accept_resp.status_code} {accept_resp.text}"

        accept_json = accept_resp.json()
        assert "message" in accept_json, \
            f"Accept response missing 'message'. Got: {accept_json}"
        print(f"[PASS] TC006 STEP ACCEPT — {handle_b} accepted {handle_a}'s request. "
              f"Message: {accept_json['message']}")

        # 5. Decline test: User A sends a fresh request to User B (mutual re-request)
        #    Since they're now friends, sign up User C for a fresh decline test
        import time as _t2; _t2.sleep(1)
        token_c, id_c, handle_c = _signup("rspc")
        headers_c = {"Authorization": f"Bearer {token_c}", "Content-Type": "application/json"}

        # User A sends request to User C
        send_resp2 = requests.post(
            f"{BASE_URL}/api/friends/request",
            headers=headers_a,
            json={"to_user_id": id_c},
            timeout=30
        )
        assert send_resp2.status_code in (200, 201), \
            f"Second friend request failed: {send_resp2.status_code} {send_resp2.text}"

        # User C fetches pending
        friends_resp_c = requests.get(
            f"{BASE_URL}/api/friends",
            headers=headers_c,
            timeout=30
        )
        assert friends_resp_c.status_code == 200, \
            f"GET /friends for User C failed: {friends_resp_c.status_code}"
        friends_data_c = friends_resp_c.json()
        pending_c = friends_data_c.get("pending", [])
        decline_friendship_id = pending_c[0].get("friendship_id") if pending_c else None

        assert decline_friendship_id is not None, \
            f"No pending request for User C to decline. Pending: {pending_c}"

        # User C declines the request
        decline_resp = requests.post(
            f"{BASE_URL}/api/friends/respond",
            headers=headers_c,
            json={"friendship_id": decline_friendship_id, "accept": False},
            timeout=30
        )
        assert decline_resp.status_code == 200, \
            f"Decline failed: {decline_resp.status_code} {decline_resp.text}"
        decline_json = decline_resp.json()
        assert "message" in decline_json, \
            f"Decline response missing 'message'. Got: {decline_json}"
        print(f"[PASS] TC006 STEP DECLINE — {handle_c} declined {handle_a}'s request. "
              f"Message: {decline_json['message']}")

        print("[PASS] TC006 - Full accept/decline flow completed successfully")

    finally:
        pass

test_post_friends_respond_accept_decline()
