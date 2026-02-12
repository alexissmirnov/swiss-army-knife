# /evaluation/evaluator.py
from typing import Any
from .metrics import (
    tool_selection_accuracy,
    parameter_correctness,
    action_accuracy
)

def evaluate_example(pred_tool: str, pred_params: dict, pred_output: Any, expected_tool: str, expected_params: dict, expected_output: Any) -> dict:
    """
    Evaluate a single example.
    """
    return {
        "tool_selection_accuracy": tool_selection_accuracy(pred_tool, expected_tool),
        "parameter_correctness": parameter_correctness(pred_params, expected_params),
        "action_accuracy": action_accuracy(pred_output, expected_output)
    }
