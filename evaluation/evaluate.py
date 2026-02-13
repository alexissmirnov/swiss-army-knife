# evaluation/evaluate.py

import os
import json
from pprint import pprint
from typing import List, Dict, Any

from app.agent import process_message
from app.store import ConversationState
from app.tools import get_tool, TOOLS

# Optional: LangChain LLM for judgment
from app.llm import get_llm
from langchain_core.messages import HumanMessage


# -------------------------
# Mock Test Scenarios
# -------------------------
TEST_SCENARIOS = [
    {
        "description": "Book an appointment",
        "messages": [
            "I want to book an appointment for a primary care visit tomorrow at 10am",
            "Patient ID is pat_001, location ID is loc_01"
        ],
        "expected_tool": "appointment_book",
        "required_params": ["patient_id", "provider_id", "service_id", "start_time", "location_id"],
    },
    {
        "description": "Reschedule appointment",
        "messages": [
            "Please move my appointment apt_123 to tomorrow at 2pm"
        ],
        "expected_tool": "appointment_reschedule",
        "required_params": ["appointment_id", "new_start_time"],
    },
    {
        "description": "Verify insurance",
        "messages": [
            "Check if patient pat_001 has insurance coverage for service svc_01"
        ],
        "expected_tool": "insurance_verify",
        "required_params": ["patient_id", "insurance_id"],
    },
    {
        "description": "Add dependent",
        "messages": [
            "Add my daughter Jane Doe born 2015-05-20 as dependent"
        ],
        "expected_tool": "dependent_add",
        "required_params": ["primary_patient_id", "dependent_first_name", "dependent_last_name", "dob", "relationship"],
    },
    {
        "description": "Human handoff",
        "messages": [
            "I want to talk to a human agent about my complicated billing issue"
        ],
        "expected_tool": "handoff_to_human",
        "required_params": ["patient_id", "summary"],
    },
]


# -------------------------
# LLM Judge
# -------------------------
def llm_judge_parameters(
    tool_name: str,
    collected: Dict[str, Any],
    required: List[str],
    user_message: str = ""
) -> bool:
    """
    Use LLM to judge a single tool call using enhanced LLM-as-judge prompt.
    Returns True if all required params are present and plausible.
    """
    try:
        llm = get_llm()
        tool = get_tool(tool_name)
        if not tool:
            return False

        # Build tools catalog for prompt
        tools_catalog = "\n".join([f"- {t.name}: {t.description}" for t in TOOLS])

        # Enhanced judge prompt
        JUDGE_PROMPT = f"""
You are an expert evaluator for a virtual care assistant. The assistant can call specific tools
to perform tasks like booking, rescheduling, canceling appointments, checking availability,
verifying insurance, adding dependents, retrieving lab results, symptom triage, prescription refills, 
billing estimates, and handoffs to human agents.

Below is a catalog of the tools you can use:
{tools_catalog}

Your task is to evaluate a single step where the assistant chose a tool.

User message: {user_message}
Agent tool called: {tool_name}
Parameters passed: {collected}
Tool execution result: success

Answer in EXACT JSON format with these keys:
{{
  "tool_selection_correct": bool,
  "parameters_correct": bool,
  "task_completed": bool,
  "comments": str
}}
"""
        messages = [HumanMessage(content=JUDGE_PROMPT)]
        response = llm.invoke(messages)
        result_json = json.loads(response.content)
        return result_json.get("parameters_correct", False)

    except Exception as e:
        print(f"[LLM Judge fallback] {e}")
        return all(param in collected for param in required)


def add_scores_to_evaluation(evaluation: dict) -> dict:
    """
    Add numeric scores to an evaluation dict and compute overall score.
    """
    scores = {
        "parameters": 1.0 if evaluation.get("parameters_correct") else 0.0,
        "state_management": 1.0 if evaluation.get("state_consistent") else 0.0,
        "task_completion": 1.0 if evaluation.get("task_completed") else 0.0,
        "tool_selection": 1.0 if evaluation.get("tool_correct") else 0.0,
    }

    weights = {
        "parameters": 0.3,
        "state_management": 0.2,
        "task_completion": 0.3,
        "tool_selection": 0.2,
    }

    overall_score = sum(scores[k] * weights.get(k, 1.0) for k in scores)
    evaluation["scores"] = scores
    evaluation["overall_score"] = round(overall_score, 2)
    return evaluation



# -------------------------
def evaluate_scenario(scenario: Dict[str, Any], use_llm_judge: bool = True) -> Dict[str, Any]:
    """
    Evaluate a single local scenario using process_message.
    """
    state = ConversationState(session_id="test_session")
    scenario_result = {
        "description": scenario["description"],
        "tool_selected": None,
        "tool_correct": False,
        "parameters_correct": False,
        "missing_parameters": [],
        "task_completed": False,
        "state_consistent": True,
        "errors": [],
    }

    provided_params = {}
    for message in scenario["messages"]:
        try:
            result = process_message(state, message, provided_parameters=provided_params)
        except Exception as e:
            scenario_result["errors"].append(str(e))
            continue

        if scenario_result["tool_selected"] is None and result.get("tool_name"):
            scenario_result["tool_selected"] = result["tool_name"]
            scenario_result["tool_correct"] = result["tool_name"] == scenario["expected_tool"]

        missing = result.get("missing_parameters", [])
        scenario_result["missing_parameters"].extend(missing)

        collected = result.get("collected_parameters", {})
        provided_params.update(collected)

        if result.get("action") == "executed":
            scenario_result["task_completed"] = True

    if use_llm_judge and scenario_result["tool_selected"]:
        scenario_result["parameters_correct"] = llm_judge_parameters(
            scenario_result["tool_selected"],
            provided_params,
            scenario["required_params"],
            user_message=scenario["messages"][-1]
        )
    else:
        scenario_result["parameters_correct"] = len(scenario_result["missing_parameters"]) == 0

    return scenario_result


# -------------------------
# New helper: Evaluate live API response
# -------------------------
def evaluate_api_response(response_json: dict, user_message: str, expected_tool: str, required_params: List[str]) -> dict:
    """
    Evaluate a single API response (live / production) using llm_judge_parameters.
    """
    tool_decision = response_json.get("tool_decision", {})
    tool_name = tool_decision.get("tool_name")
    collected_params = tool_decision.get("collected_parameters", {})

    # Merge executed tool arguments if present
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

    # LLM judge parameters
    parameters_correct = llm_judge_parameters(
        tool_name=tool_name,
        collected=collected_params,
        required=required_params,
        user_message=user_message
    ) if tool_name else False

    # Evaluation dict
    evaluation = {
        "description": "Live API test",
        "tool_selected": tool_name,
        "tool_correct": tool_name == expected_tool,
        "parameters_correct": parameters_correct,
        "missing_parameters": [],
        "task_completed": tool_decision.get("action") == "executed",
        "state_consistent": True,
        "errors": [],
    }

    return add_scores_to_evaluation(evaluation)


# -------------------------
# Run evaluation locally
# -------------------------
def run_evaluation(scenarios: List[Dict[str, Any]], use_llm_judge: bool = True) -> None:
    print("\n=== Running Local Evaluation ===\n")
    for scenario in scenarios:
        result = evaluate_scenario(scenario, use_llm_judge)
        scored_result = add_scores_to_evaluation(result)
        pprint(scored_result)
        print("\n" + "-" * 50 + "\n")


if __name__ == "__main__":
    os.environ["SAK_USE_LLM"] = "true"
    run_evaluation(TEST_SCENARIOS, use_llm_judge=True)
