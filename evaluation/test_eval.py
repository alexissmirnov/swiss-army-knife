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
# messages_to_test = [
#     {"session_id": "test1", "message": "I want to book an appointment tomorrow 10am"},
#     {"session_id": "test2", "message": "Move my apt_123 to 2pm tomorrow"},
# ]
# messages_to_test = [
#     {
#         "session_id": "test-session-011",
#         "messages": [{"role": "user", "content": "Find a dermatologist near me"}],
#         "provided_parameters": {
#             "specialty": "Dermatology",
#             "location_id": "loc_001",
#             "insurance_id": "ins_123",
#             "patient_id": "pat_456"
#         },
#         "force_tool": "provider_search"
#     },
#     {
#         "session_id": "test2",
#         "message": "Move my apt_123 to 2pm tomorrow"
#     },
# ]

messages_to_test = [
    # 1. Simple appointment booking with prefilled parameters
    {
        "session_id": "test-session-001",
        "messages": [{"role": "user", "content": "I want to book a primary care appointment tomorrow at 10am"}],
        "provided_parameters": {
            "patient_id": "pat_001",
            "location_id": "loc_01"
        },
        "force_tool": "appointment_book"
    },

    # 2. Reschedule appointment
    {
        "session_id": "test-session-002",
        "messages": [{"role": "user", "content": "Move my appointment apt_123 to 2pm tomorrow"}],
        "provided_parameters": {
            "appointment_id": "apt_123"
        },
        "force_tool": "appointment_reschedule"
    },

    # 3. Provider search with multiple prefilled parameters
    {
        "session_id": "test-session-003",
        "messages": [{"role": "user", "content": "Find a dermatologist near me"}],
        "provided_parameters": {
            "specialty": "Dermatology",
            "location_id": "loc_001",
            "insurance_id": "ins_123",
            "patient_id": "pat_456"
        },
        "force_tool": "provider_search"
    },

    # 4. Symptom triage with multi-turn conversation
    {
        "session_id": "test-session-004",
        "messages": [
            {"role": "user", "content": "I have a severe headache and nausea for 2 days"},
            {"role": "user", "content": "Also feeling dizzy occasionally"}
        ],
        "provided_parameters": {
            "patient_id": "pat_789",
            "symptoms": "headache, nausea, dizziness",
            "duration": "2 days",
            "age": "35",
            "pregnant": False
        },
        "force_tool": "symptom_triage"
    },

    # 5. Insurance verification
    {
        "session_id": "test-session-005",
        "messages": [{"role": "user", "content": "Check if my insurance covers service svc_01"}],
        "provided_parameters": {
            "patient_id": "pat_002",
            "insurance_id": "ins_002",
            "service_id": "svc_01"
        },
        "force_tool": "insurance_verify"
    },

    # 6. Add dependent
    {
        "session_id": "test-session-006",
        "messages": [{"role": "user", "content": "Add my daughter Jane Doe born 2015-05-20 as dependent"}],
        "provided_parameters": {
            "primary_patient_id": "pat_003",
            "dependent_first_name": "Jane",
            "dependent_last_name": "Doe",
            "dob": "2015-05-20",
            "relationship": "daughter"
        },
        "force_tool": "dependent_add"
    },

    # 7. Handoff to human with summary
    {
        "session_id": "test-session-007",
        "messages": [{"role": "user", "content": "I want to talk to a human agent about my billing issue"}],
        "provided_parameters": {
            "patient_id": "pat_004",
            "summary": "Complex billing dispute for last visit"
        },
        "force_tool": "handoff_to_human"
    },

    # 8. Lab results retrieval
    {
        "session_id": "test-session-008",
        "messages": [{"role": "user", "content": "Show me my recent A1C lab results"}],
        "provided_parameters": {
            "patient_id": "pat_005",
            "date_range_start": "2026-01-01",
            "date_range_end": "2026-02-10"
        },
        "force_tool": "lab_results_get"
    },

    # 9. Billing estimate with full parameters
    {
        "session_id": "test-session-009",
        "messages": [{"role": "user", "content": "How much will I owe for service svc_02?"}],
        "provided_parameters": {
            "patient_id": "pat_006",
            "service_id": "svc_02",
            "insurance_id": "ins_456",
            "location_id": "loc_02",
            "provider_id": "prov_01"
        },
        "force_tool": "billing_estimate"
    },

    # 10. Prescription refill
    {
        "session_id": "test-session-010",
        "messages": [{"role": "user", "content": "Refill my Lipitor prescription"}],
        "provided_parameters": {
            "patient_id": "pat_007",
            "medication_name": "Lipitor",
            "pharmacy_id": "pharm_01",
            "rx_number": "rx_987",
            "dosage": "20mg",
            "quantity": "30"
        },
        "force_tool": "prescription_refill"
    }
]

# Required parameters mapping for evaluation
REQUIRED_PARAMS_MAPPING = {
    "I want to book an appointment tomorrow 10am": ["patient_id", "provider_id", "service_id", "start_time", "location_id"],
    "Move my apt_123 to 2pm tomorrow": ["appointment_id", "new_start_time"],
}

# Expected tool mapping
EXPECTED_TOOL_MAPPING = {
    "I want to book a primary care appointment tomorrow at 10am": "appointment_book",
    "Move my appointment apt_123 to 2pm tomorrow": "appointment_reschedule",
    "Find a dermatologist near me": "provider_search",
    "I have a severe headache and nausea for 2 days": "symptom_triage",
    "Check if my insurance covers service svc_01": "insurance_verify",
    "Add my daughter Jane Doe born 2015-05-20 as dependent": "dependent_add",
    "I want to talk to a human agent about my billing issue": "handoff_to_human",
    "Show me my recent A1C lab results": "lab_results_get",
    "How much will I owe for service svc_02?": "billing_estimate",
    "Refill my Lipitor prescription": "prescription_refill"
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


# def run_api_evaluation():
#     print("\n=== Running API Evaluation ===\n")
#     for msg in messages_to_test:
#         payload = {
#             "session_id": msg["session_id"],
#             "messages": [{"role": "user", "content": msg["message"]}],
#             "provided_parameters": {}
#         }
#         try:
#             resp = requests.post(API_URL, json=payload)
#             if resp.status_code != 200:
#                 print(f"Message: {msg['message']}")
#                 print(f"Status code: {resp.status_code}")
#                 print(f"Response: {resp.text}")
#                 print("-" * 50)
#                 continue

#             response_json = resp.json()
#             evaluation = evaluate_api_response(response_json, msg["message"])
#             pprint(evaluation)
#             print("-" * 50)

#         except Exception as e:
#             print(f"[ERROR] {e}")
def run_api_evaluation():
    print("\n=== Running API Evaluation ===\n")
    for msg in messages_to_test:
        payload = {
            "session_id": msg["session_id"],
            "messages": msg.get("messages", [{"role": "user", "content": msg.get("message")}]),
            "provided_parameters": msg.get("provided_parameters", {})
        }

        # Optional: force a specific tool if provided
        if "force_tool" in msg:
            payload["force_tool"] = msg["force_tool"]

        try:
            resp = requests.post(API_URL, json=payload)
            if resp.status_code != 200:
                print(f"Message: {msg.get('message') or msg.get('messages')}")
                print(f"Status code: {resp.status_code}")
                print(f"Response: {resp.text}")
                print("-" * 50)
                continue

            response_json = resp.json()
            evaluation = evaluate_api_response(response_json, 
                                               msg.get("message") or msg["messages"][-1]["content"])
            pprint(evaluation)
            print("-" * 50)

        except Exception as e:
            print(f"[ERROR] {e}")


if __name__ == "__main__":
    os.environ["SAK_USE_LLM"] = "true"  # ensure LLM is used
    run_api_evaluation()
