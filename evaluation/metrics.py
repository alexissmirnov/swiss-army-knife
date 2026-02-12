# /evaluation/metrics.py

def tool_selection_accuracy(pred_tool: str, expected_tool: str) -> float:
    return 1.0 if pred_tool == expected_tool else 0.0

def parameter_correctness(pred_params: dict, expected_params: dict) -> float:
    """Simple exact match metric."""
    return 1.0 if pred_params == expected_params else 0.0

def action_accuracy(pred_output: any, expected_output: any) -> float:
    """Compare output values."""
    return 1.0 if pred_output == expected_output else 0.0

def state_consistency(pred_states: list, expected_states: list) -> float:
    """Checks if state history matches expected states."""
    if len(pred_states) != len(expected_states):
        return 0.0
    correct = sum(1 for p, e in zip(pred_states, expected_states) if p == e)
    return correct / len(expected_states)
