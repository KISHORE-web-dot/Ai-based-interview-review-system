import urllib.request
import json
import urllib.error
import uuid

# Base URL for local FastAPI backend
BASE_URL = "http://localhost:8000/api"

def make_request(method, endpoint, data=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {'Content-Type': 'application/json'}
    
    encoded_data = None
    if data:
        encoded_data = json.dumps(data).encode('utf-8')
        
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"HTTPError: {e.code}")
        print(e.read().decode())
        return None

# Test the /interview/end endpoint
print("\n--- Testing /interview/end ---")
session_id = str(uuid.uuid4())
end_data = {
    "session_id": session_id,
    "qa_list": [
        {
            "question": "What is Python?",
            "answer": "Python is a programming language.",
            "analysis": {
                "feedback": "Good.",
                "score": 8,
                "suggestions": []
            }
        }
    ],
    "frames": []
}

result = make_request("POST", "/interview/end", end_data)
if result:
    print(json.dumps(result, indent=2))
