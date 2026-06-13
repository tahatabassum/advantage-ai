import os
import requests
import json

def test_openrouter():
    key = os.getenv("OPENROUTER_API_KEY")
    print(f"Key present: {bool(key)}")
    if not key:
        print("OPENROUTER_API_KEY is missing.")
        return
    
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "openai/gpt-4o-mini",
        "messages": [
            {"role": "user", "content": "Say hello"}
        ]
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        print(f"Response: {response.json()['choices'][0]['message']['content']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_openrouter()
