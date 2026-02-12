from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple, Type

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.tools import StructuredTool
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field, create_model

from app.settings import load_settings
from app.tools import ToolDefinition


def get_llm() -> ChatOpenAI:
    settings = load_settings()
    if not settings.openai_api_key:
        raise RuntimeError("Missing OpenAI API key.")
    return ChatOpenAI(
        api_key=settings.openai_api_key,
        model=settings.openai_model,
        temperature=0.2,
    )


def build_langchain_tools(tool_defs: List[ToolDefinition]) -> List[StructuredTool]:
    tools: List[StructuredTool] = []
    for tool_def in tool_defs:
        args_schema = _args_schema_from_tool(tool_def)

        def _make_handler(defn: ToolDefinition):
            def _run(**kwargs):
                return defn.handler(kwargs)

            return _run

        tools.append(
            StructuredTool.from_function(
                func=_make_handler(tool_def),
                name=tool_def.name,
                description=tool_def.description,
                args_schema=args_schema,
            )
        )
    return tools


def build_llm_messages(history: List[Dict[str, str]]) -> List[Any]:
    settings = load_settings()
    messages: List[Any] = [SystemMessage(content=settings.system_prompt)]
    for item in history:
        role = item.get("role")
        content = item.get("content", "")
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant":
            messages.append(AIMessage(content=content))
    return messages


def parse_tool_call(message: AIMessage) -> Optional[Tuple[str, Dict[str, Any]]]:
    tool_calls = getattr(message, "tool_calls", None)
    if not tool_calls:
        return None
    call = tool_calls[0]
    name = call.get("name")
    args = call.get("args", {}) or {}
    if isinstance(args, str):
        return name, {}
    if not isinstance(args, dict):
        return name, {}
    return name, args


def _args_schema_from_tool(tool_def: ToolDefinition) -> Type[BaseModel]:
    properties = tool_def.parameters.get("properties", {})
    required = set(tool_def.required)
    fields: Dict[str, tuple] = {}

    for name, spec in properties.items():
        py_type = _python_type(spec.get("type"))
        description = spec.get("description", "")
        if name in required:
            fields[name] = (py_type, Field(..., description=description))
        else:
            fields[name] = (Optional[py_type], Field(None, description=description))

    return create_model(f"{tool_def.name}_Args", **fields)


def _python_type(json_type: str | None):
    if json_type == "boolean":
        return bool
    if json_type == "integer":
        return int
    if json_type == "number":
        return float
    return str
