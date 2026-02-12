# test_eval.py
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from evaluation.runner import run_evaluation

# Dummy model function to simulate tool selection and execution
def dummy_model(input_text: str):
    """
    Simulates a model predicting a tool, its parameters, and output.
    """
    input_text_lower = input_text.lower()
    if "calculate" in input_text_lower:
        return "calculator", {"expression": "5+3"}, 8
    elif "weather" in input_text_lower:
        return "weather_api", {"location": "Paris"}, {"temperature": "20C"}
    else:
        return "unknown_tool", {}, None

if __name__ == "__main__":
    results = run_evaluation(dummy_model)
    print("Evaluation Results:")
    for i, res in enumerate(results, start=1):
        print(f"Example {i}: {res}")
