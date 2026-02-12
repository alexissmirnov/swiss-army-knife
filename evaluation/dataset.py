# /evaluation/dataset.py
from dataclasses import dataclass
from typing import Any, List

@dataclass
class EvalExample:
    """Represents a single evaluation example."""
    input_text: str
    expected_tool: str
    expected_params: dict
    expected_output: Any

def load_dataset() -> List[EvalExample]:
    """
    Load a sample dataset for evaluation.
    You can replace this with your project-specific examples.
    """
    dataset = [
        EvalExample(
            input_text="Calculate 5 + 3",
            expected_tool="calculator",
            expected_params={"expression": "5+3"},
            expected_output=8
        ),
        EvalExample(
            input_text="Get current weather in Paris",
            expected_tool="weather_api",
            expected_params={"location": "Paris"},
            expected_output={"temperature": "20C"}  # just example
        ),
    ]
    return dataset
