from __future__ import annotations

import json
import math
import os
import urllib.request
import urllib.error
from dataclasses import dataclass
from typing import Dict, List, Optional

from app.tools import ToolDefinition


@dataclass
class ConfidenceResult:
    tool_name: Optional[str]
    confidence: float
    scores: Dict[str, float]


class ConfidenceModel:
    def score(self, message: str, tools: List[ToolDefinition]) -> ConfidenceResult:
        raise NotImplementedError


class KeywordConfidenceModel(ConfidenceModel):
    def __init__(self, temperature: float = 1.0) -> None:
        self.temperature = max(0.1, temperature)

    def score(self, message: str, tools: List[ToolDefinition]) -> ConfidenceResult:
        text = message.lower()
        raw_scores: Dict[str, float] = {}

        for tool in tools:
            matches = sum(1 for kw in tool.keywords if kw in text)
            if matches == 0:
                raw_scores[tool.name] = 0.0
                continue
            # Weight by keyword density to reduce long keyword lists bias.
            raw_scores[tool.name] = matches / max(1, len(tool.keywords))

        if all(score == 0.0 for score in raw_scores.values()):
            return ConfidenceResult(tool_name=None, confidence=0.0, scores=raw_scores)

        scores = _softmax(raw_scores, temperature=self.temperature)
        tool_name = max(scores, key=scores.get)
        return ConfidenceResult(tool_name=tool_name, confidence=scores[tool_name], scores=scores)


class RemoteConfidenceModel(ConfidenceModel):
    def __init__(self, endpoint: str, timeout: float, fallback: ConfidenceModel) -> None:
        self.endpoint = endpoint
        self.timeout = timeout
        self.fallback = fallback

    def score(self, message: str, tools: List[ToolDefinition]) -> ConfidenceResult:
        payload = {
            "message": message,
            "tools": [
                {"name": tool.name, "description": tool.description, "keywords": tool.keywords}
                for tool in tools
            ],
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(self.endpoint, data=data, headers={"Content-Type": "application/json"})

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                body = json.loads(response.read().decode("utf-8"))
        except (urllib.error.URLError, json.JSONDecodeError):
            return self.fallback.score(message, tools)

        scores = body.get("scores")
        if isinstance(scores, dict):
            normalized = {k: float(v) for k, v in scores.items() if k in {t.name for t in tools}}
            if normalized:
                tool_name = max(normalized, key=normalized.get)
                return ConfidenceResult(tool_name=tool_name, confidence=normalized[tool_name], scores=normalized)

        tool_name = body.get("tool_name")
        confidence = float(body.get("confidence", 0.0))
        if tool_name not in {t.name for t in tools}:
            return self.fallback.score(message, tools)

        return ConfidenceResult(tool_name=tool_name, confidence=confidence, scores={tool_name: confidence})


def get_confidence_model() -> ConfidenceModel:
    mode = os.getenv("SAK_CONFIDENCE_MODEL", "keyword").lower()
    temperature = _env_float("SAK_CONFIDENCE_TEMPERATURE", 1.0)
    keyword_model = KeywordConfidenceModel(temperature=temperature)

    if mode == "remote":
        endpoint = os.getenv("SAK_MODEL_ENDPOINT", "").strip()
        timeout = _env_float("SAK_MODEL_TIMEOUT", 3.0)
        if endpoint:
            return RemoteConfidenceModel(endpoint=endpoint, timeout=timeout, fallback=keyword_model)

    return keyword_model


def _env_float(name: str, default: float) -> float:
    raw = os.getenv(name)
    if not raw:
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def _softmax(scores: Dict[str, float], temperature: float) -> Dict[str, float]:
    if not scores:
        return {}
    exp_values: Dict[str, float] = {}
    max_score = max(scores.values())

    for key, score in scores.items():
        exp_values[key] = math.exp((score - max_score) / temperature)

    total = sum(exp_values.values())
    if total == 0:
        return {key: 0.0 for key in scores}
    return {key: value / total for key, value in exp_values.items()}
