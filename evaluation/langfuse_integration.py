# /evaluation/langfuse_integration.py
import os
from contextlib import contextmanager

# Install Langfuse SDK: pip install langfuse
try:
    from langfuse import Client, Trace
except ImportError:
    Client = None
    Trace = None

LF_API_KEY = os.environ.get("LANGFUSE_API_KEY", "your_api_key_here")
LF_PROJECT_NAME = os.environ.get("LANGFUSE_PROJECT_NAME", "evaluation_project")

client = Client(api_key=LF_API_KEY, project_name=LF_PROJECT_NAME) if Client else None

@contextmanager
def start_trace(input_text: str):
    """
    Context manager for Langfuse trace.
    """
    if client:
        trace = client.trace(input_text)
    else:
        trace = DummyTrace(input_text)
    try:
        yield trace
    finally:
        trace.finish()

class DummyTrace:
    """Fallback trace if Langfuse SDK is not installed."""
    def __init__(self, input_text):
        self.input_text = input_text
        self.logs = []

    def log_output(self, data):
        self.logs.append({"output": data})

    def log_metrics(self, metrics):
        self.logs.append({"metrics": metrics})

    def finish(self):
        print(f"[DummyTrace] Input: {self.input_text}, Logs: {self.logs}")
