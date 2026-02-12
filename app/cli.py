from __future__ import annotations

import json
import os
import typer

from app.agent import process_message
from app.settings import load_settings
from app.store import SESSION_STORE
from app.tools import openai_tools_schema

app = typer.Typer(add_completion=False)


@app.command()
def main():
    """Run the interactive CLI demo."""
    typer.echo("swiss-army-knife CLI demo. Type /exit to quit, /tools to list tools.")
    _ensure_api_key()
    state = SESSION_STORE.get(None)

    while True:
        user_input = typer.prompt("you")
        if user_input.strip().lower() in {"/exit", "exit", "quit"}:
            break
        if user_input.strip().lower() in {"/tools", "tools"}:
            typer.echo(json.dumps(openai_tools_schema(), indent=2))
            continue

        result = process_message(state, user_input)
        _handle_result(state, result)


def _handle_result(state, result):
    action = result.get("action")
    if action == "need_parameters":
        missing = result.get("missing_parameters", [])
        collected = result.get("collected_parameters", {})
        typer.echo(result.get("assistant_message", ""))
        for param in missing:
            value = typer.prompt(f"provide {param}")
            collected[param] = value
        followup = process_message(state, "provided parameters", provided_parameters=collected)
        _handle_result(state, followup)
        return

    if action == "need_approval":
        typer.echo(result.get("assistant_message", ""))
        decision = typer.prompt("approve (yes/no)")
        followup = process_message(state, decision)
        _handle_result(state, followup)
        return

    typer.echo(result.get("assistant_message", ""))
    if action == "executed":
        typer.echo(json.dumps(result.get("tool_result", {}), indent=2))


def _ensure_api_key():
    settings = load_settings()
    use_llm = os.getenv("SAK_USE_LLM", "true").lower() in {"1", "true", "yes", "on"}
    if not use_llm:
        return
    if settings.openai_api_key:
        return
    key = typer.prompt("OpenAI API key", hide_input=True)
    os.environ["OPENAI_API_KEY"] = key


if __name__ == "__main__":
    app()
