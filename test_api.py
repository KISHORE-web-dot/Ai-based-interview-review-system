import urllib.request
import json
import urllib.error

data = json.dumps({'full_name': 'Test User', 'email': 'test_user_sql@example.com', 'password': 'password123'}).encode()
req = urllib.request.Request('https://ai-based-interview-review-system-production.up.railway.app/api/auth/register', data=data, headers={'Content-Type': 'application/json'})
try:
    resp = urllib.request.urlopen(req)
    print(f"Success: {resp.status}")
    print(resp.read().decode())
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code}")
    print(e.read().decode())
except Exception as e:
    print(f"Error: {e}")
