from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict


DEFAULT_SETTINGS_PATH = "settings.json"


@dataclass(frozen=True)
class AppSettings:
    openai_api_key: str | None
    openai_model: str
    system_prompt: str


DEFAULT_SYSTEM_PROMPT = (
    "You are a virtual care assistant for a digital health experience. "
    "Use tools to complete tasks like booking, canceling, refilling prescriptions, "
    "retrieving lab results, and verifying insurance. "
    "If a tool is required, call it. If required parameters are missing, ask the user. "
    "If the user is unclear, ask a brief clarifying question."
)


def load_settings() -> AppSettings:
    data = _read_settings_file()
    openai_api_key = (
        os.getenv("OPENAI_API_KEY")
        or os.getenv("SAK_OPENAI_API_KEY")
        or data.get("openai_api_key")
    )
    openai_model = os.getenv("SAK_OPENAI_MODEL") or data.get("openai_model") or "gpt-4o-mini"
    system_prompt = os.getenv("SAK_SYSTEM_PROMPT") or data.get("system_prompt") or DEFAULT_SYSTEM_PROMPT

    return AppSettings(
        openai_api_key=openai_api_key,
        openai_model=openai_model,
        system_prompt=system_prompt,
    )


def _read_settings_file() -> Dict[str, Any]:
    path = os.getenv("SAK_SETTINGS_PATH", DEFAULT_SETTINGS_PATH)
    file_path = Path(path).expanduser()
    if not file_path.exists():
        return {}
    try:
        return json.loads(file_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
