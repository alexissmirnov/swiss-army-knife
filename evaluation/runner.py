# /evaluation/runner.py
import sys
import os
sys.path.append(os.path.dirname(__file__)) 
from .dataset import load_dataset
from .evaluator import evaluate_example
from .langfuse_integration import start_trace




def run_evaluation(model_callable):
    """
    Run evaluation over the dataset.
    `model_callable` should accept input_text and return (pred_tool, pred_params, pred_output)
    """
    dataset = load_dataset()
    results = []

    for example in dataset:
        with start_trace(example.input_text) as trace:
            pred_tool, pred_params, pred_output = model_callable(example.input_text)
            trace.log_output({
                "pred_tool": pred_tool,
                "pred_params": pred_params,
                "pred_output": pred_output
            })

            metrics = evaluate_example(
                pred_tool=pred_tool,
                pred_params=pred_params,
                pred_output=pred_output,
                expected_tool=example.expected_tool,
                expected_params=example.expected_params,
                expected_output=example.expected_output
            )
            trace.log_metrics(metrics)
            results.append(metrics)

    return results
