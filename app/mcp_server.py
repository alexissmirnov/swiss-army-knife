from __future__ import annotations

from typing import Any, Dict, Iterable, List

from fastmcp import FastMCP
from fastmcp.tools.tool import Tool, ToolResult
from pydantic import Field

from app.config import get_confidence_threshold
from app.confidence import get_confidence_model
from app.tools import TOOLS, ToolHandler


mcp = FastMCP("ServiceOS Tools", stateless_http=True, json_response=True)


class WorkflowTool(Tool):
    handler: ToolHandler = Field(exclude=True)

    async def run(self, arguments: dict[str, Any]) -> ToolResult:
        result = self.handler(arguments)
        return ToolResult(structured_content=result)


class ConfidenceEvalTool(Tool):
    async def run(self, arguments: dict[str, Any]) -> ToolResult:
        raw_messages = arguments.get("messages")
        mode = arguments.get("mode", "full_conversation")
        top_k = _coerce_int(arguments.get("top_k"), default=5)

        messages = _normalize_messages(raw_messages)
        text = _messages_to_text(messages, mode=mode)

        model = get_confidence_model()
        result = model.score(text, TOOLS)

        scores = {tool.name: float(result.scores.get(tool.name, 0.0)) for tool in TOOLS}
        ordered = sorted(scores.items(), key=lambda item: item[1], reverse=True)
        tools_payload = [
            {
                "name": name,
                "mcp_name": f"tool-{name}",
                "confidence": score,
            }
            for name, score in ordered
        ]

        selected = None
        if result.tool_name:
            selected_score = scores.get(result.tool_name, float(result.confidence))
            selected = {
                "name": result.tool_name,
                "mcp_name": f"tool-{result.tool_name}",
                "confidence": selected_score,
            }

        return ToolResult(
            structured_content={
                "threshold": get_confidence_threshold(),
                "selected": selected,
                "tools": tools_payload,
                "top_k": max(1, min(top_k, len(TOOLS))),
                "mode": "last_user" if mode == "last_user" else "full_conversation",
            }
        )


def register_workflow_tools() -> None:
    for tool in TOOLS:
        mcp.add_tool(
            WorkflowTool(
                name=f"tool-{tool.name}",
                description=tool.description,
                parameters=tool.parameters,
                handler=tool.handler,
            )
        )


def register_meta_tools() -> None:
    mcp.add_tool(
        ConfidenceEvalTool(
            name="meta-confidence-eval",
            description=(
                "Evaluate tool confidence scores from the conversation and return a ranked list."
            ),
            parameters={
                "type": "object",
                "properties": {
                    "messages": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "role": {"type": "string"},
                                "content": {"type": "string"},
                            },
                            "required": ["role", "content"],
                        },
                    },
                    "mode": {
                        "type": "string",
                        "enum": ["full_conversation", "last_user"],
                        "default": "full_conversation",
                    },
                    "top_k": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 20,
                        "default": 5,
                    },
                },
                "required": ["messages"],
            },
        )
    )


def _normalize_messages(messages: Any) -> List[Dict[str, str]]:
    if not isinstance(messages, list):
        return []
    normalized: List[Dict[str, str]] = []
    for message in messages:
        if not isinstance(message, dict):
            continue
        role = message.get("role")
        content = message.get("content")
        if not isinstance(role, str) or not isinstance(content, str):
            continue
        normalized.append({"role": role, "content": content})
    return normalized


def _messages_to_text(messages: Iterable[Dict[str, str]], mode: str) -> str:
    if mode == "last_user":
        for message in reversed(list(messages)):
            if message.get("role") == "user":
                return message.get("content", "")
        return ""
    return "\n".join(
        f"{message.get('role')}: {message.get('content', '')}" for message in messages
    )


def _coerce_int(value: Any, default: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    return parsed


register_meta_tools()
register_workflow_tools()
