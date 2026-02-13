# evaluation/test_eval.py
import os
import json
import requests
from pprint import pprint
import sys
import os

# Add parent folder to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.tools import get_tool

from evaluation.evaluate import llm_judge_parameters, add_scores_to_evaluation

# API endpoint
API_URL = "http://127.0.0.1:8000/v1/chat/completions"

# Test messages
messages_to_test = [
    {"session_id": "test1", "message": "I want to book an appointment tomorrow 10am"},
    {"session_id": "test2", "message": "Move my apt_123 to 2pm tomorrow"},
]

# Required parameters mapping for evaluation
REQUIRED_PARAMS_MAPPING = {
    "I want to book an appointment tomorrow 10am": ["patient_id", "provider_id", "service_id", "start_time", "location_id"],
    "Move my apt_123 to 2pm tomorrow": ["appointment_id", "new_start_time"],
}

# Expected tool mapping
EXPECTED_TOOL_MAPPING = {
    "I want to book an appointment tomorrow 10am": "appointment_book",
    "Move my apt_123 to 2pm tomorrow": "appointment_reschedule",
}


def evaluate_api_response(response_json: dict, user_message: str) -> dict:
    """
    Evaluate API response JSON for a single message using llm_judge_parameters.
    """
    # Extract tool decision
    tool_decision = response_json.get("tool_decision", {})
    tool_name = tool_decision.get("tool_name")
    collected_params = tool_decision.get("collected_parameters", {})

    # If API returned executed tool with arguments, merge them
    choices = response_json.get("choices", [])
    if choices:
        msg = choices[0].get("message", {})
        tool_calls = msg.get("tool_calls", [])
        for call in tool_calls:
            args_json = call.get("function", {}).get("arguments")
            if args_json:
                try:
                    collected_params.update(json.loads(args_json))
                except:
                    pass

    # Evaluate parameters correctness using LLM
    parameters_correct = llm_judge_parameters(
        tool_name=tool_name,
        collected=collected_params,
        required=REQUIRED_PARAMS_MAPPING.get(user_message, []),
        user_message=user_message
    ) if tool_name else False

    # Compute other metrics
    result = {
        "description": "Live API test",
        "tool_selected": tool_name,
        "tool_correct": tool_name == EXPECTED_TOOL_MAPPING.get(user_message),
        "parameters_correct": parameters_correct,
        "missing_parameters": [],
        "task_completed": tool_decision.get("action") == "executed",
        "state_consistent": True,
        "errors": [],
    }

   
    result = add_scores_to_evaluation(result)
    return result


def run_api_evaluation():
    print("\n=== Running API Evaluation ===\n")
    for msg in messages_to_test:
        payload = {
            "session_id": msg["session_id"],
            "messages": [{"role": "user", "content": msg["message"]}],
            "provided_parameters": {}
        }
        try:
            resp = requests.post(API_URL, json=payload)
            if resp.status_code != 200:
                print(f"Message: {msg['message']}")
                print(f"Status code: {resp.status_code}")
                print(f"Response: {resp.text}")
                print("-" * 50)
                continue

            response_json = resp.json()
            evaluation = evaluate_api_response(response_json, msg["message"])
            pprint(evaluation)
            print("-" * 50)

        except Exception as e:
            print(f"[ERROR] {e}")


if __name__ == "__main__":
    os.environ["SAK_USE_LLM"] = "true"  # ensure LLM is used
    run_api_evaluation()
