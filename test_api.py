import urllib.request
import json
import urllib.error
import uuid

# Base URL for Railway FastAPI backend
BASE_URL = "https://ai-based-interview-review-system-production.up.railway.app/api"

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

print("--- Testing /interview/start ---")
start_data = {
    "resume_text": "Experienced Python developer.",
    "type": "voice",
    "difficulty": "medium",
    "language": "english"
}
start_result = make_request("POST", "/interview/start", start_data)

if start_result and "session_id" in start_result:
    print("Start successful! Session ID:", start_result["session_id"])
    
    print("\n--- Testing /interview/end ---")
    end_data = {
        "session_id": start_result["session_id"],
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
        print("End successful! Final Feedback:")
        print(json.dumps(result, indent=2))
else:
    print("Failed to start interview, skipping end test.")
