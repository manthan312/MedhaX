import requests
import time

BASE_URL = "http://localhost:5000"

def _create_user_and_get_token():
    """Sign up a fresh user and return a real JWT token with valid UUID sub."""
    ts = int(time.time())
    email = f"ts_hist_{ts}@example.com"
    password = "StrongPass!234"
    handle = f"tshist_{ts}"
    r = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json={"email": email, "password": password, "username": handle},
        timeout=30
    )
    assert r.status_code == 201, f"Setup signup failed: {r.status_code} {r.text}"
    data = r.json()
    return data["token"], data["user"]["id"]

def test_getapimatcheshistorygethistoricalmatches():
    """
    GET /api/matches/history
    - Sends a valid Bearer JWT; the backend extracts userId from the token
    - Response shape: { "matches": [...], "playerHandles": { userId: handle } }
    - For a fresh user, matches list will be empty — that is valid
    """
    token, user_id = _create_user_and_get_token()
    headers = {"Authorization": f"Bearer {token}"}

    try:
        response = requests.get(
            f"{BASE_URL}/api/matches/history",
            headers=headers,
            timeout=30
        )
        assert response.status_code == 200, \
            f"Expected status code 200, got {response.status_code}. Body: {response.text}"

        data = response.json()

        # ✅ Response is { "matches": [...], "playerHandles": {...} }
        assert isinstance(data, dict), \
            f"Expected response to be a dict. Got: {type(data)}"
        assert "matches" in data, \
            f"Response missing 'matches' key. Got keys: {list(data.keys())}"
        assert "playerHandles" in data, \
            f"Response missing 'playerHandles' key. Got keys: {list(data.keys())}"

        matches = data["matches"]
        assert isinstance(matches, list), \
            f"'matches' should be a list. Got: {type(matches)}"

        player_handles = data["playerHandles"]
        assert isinstance(player_handles, dict), \
            f"'playerHandles' should be a dict. Got: {type(player_handles)}"

        # Validate structure of each match if any exist
        for match in matches:
            assert isinstance(match, dict), f"Each match should be a dict. Got: {type(match)}"
            assert "id" in match, f"Match missing 'id'. Got: {match}"
            assert "winner_id" in match or match.get("status") == "ended", \
                f"Match missing winner/status. Got: {match}"

        print(f"[PASS] TC009 - /matches/history returned {len(matches)} historical matches "
              f"for user {user_id[:8]}...")

    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {str(e)}"

test_getapimatcheshistorygethistoricalmatches()