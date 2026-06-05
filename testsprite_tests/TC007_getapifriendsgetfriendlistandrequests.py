import requests
import time

BASE_URL = "http://localhost:5000"

def _create_user_and_get_token():
    """Sign up a fresh user and return a real JWT token with valid UUID sub."""
    ts = int(time.time())
    email = f"ts_flist_{ts}@example.com"
    password = "StrongPass!234"
    handle = f"tsflist_{ts}"
    r = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json={"email": email, "password": password, "username": handle},
        timeout=30
    )
    assert r.status_code == 201, f"Setup signup failed: {r.status_code} {r.text}"
    return r.json()["token"]

def test_get_friends_list_and_requests():
    """
    GET /api/friends — returns friend list and pending requests.
    Response shape: { "friends": [...], "pending": [...], "sentRequests": [...] }
    All arrays; each item is a dict with friendship fields.
    Uses a real JWT token with a valid UUID sub.
    """
    token = _create_user_and_get_token()
    url = f"{BASE_URL}/api/friends"
    headers = {"Authorization": f"Bearer {token}"}

    try:
        response = requests.get(url, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, \
        f"Expected status 200 but got {response.status_code}. Body: {response.text}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # ✅ Response is a dict, not a flat list
    assert isinstance(data, dict), \
        f"Expected response to be a dict. Got: {type(data)}"

    assert "friends" in data, \
        f"Response missing 'friends' key. Got keys: {list(data.keys())}"
    assert "pending" in data, \
        f"Response missing 'pending' key. Got keys: {list(data.keys())}"
    assert "sentRequests" in data, \
        f"Response missing 'sentRequests' key. Got keys: {list(data.keys())}"

    assert isinstance(data["friends"], list), \
        f"'friends' should be a list. Got: {type(data['friends'])}"
    assert isinstance(data["pending"], list), \
        f"'pending' should be a list. Got: {type(data['pending'])}"
    assert isinstance(data["sentRequests"], list), \
        f"'sentRequests' should be a list. Got: {type(data['sentRequests'])}"

    # For a brand-new user, all lists will be empty — that is expected and valid
    for item in data["friends"]:
        assert isinstance(item, dict), f"Friend entry should be a dict. Got: {type(item)}"
        assert "friendship_id" in item or "id" in item, \
            f"Friend entry missing id fields. Got: {item}"

    print(f"[PASS] TC007 - /friends returned: {len(data['friends'])} friends, "
          f"{len(data['pending'])} pending, {len(data['sentRequests'])} sent")

test_get_friends_list_and_requests()