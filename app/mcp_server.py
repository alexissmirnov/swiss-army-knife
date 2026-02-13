from __future__ import annotations

from typing import Any, Dict

from fastmcp import FastMCP
from fastmcp.tools.tool import Tool, ToolResult
from pydantic import Field

from app.tools import TOOLS, ToolHandler


mcp = FastMCP("ServiceOS Tools", stateless_http=True, json_response=True)


class WorkflowTool(Tool):
    handler: ToolHandler = Field(exclude=True)

    async def run(self, arguments: dict[str, Any]) -> ToolResult:
        result = self.handler(arguments)
        return ToolResult(structured_content=result)


def _title_from_name(name: str) -> str:
    return name.replace("_", " ").strip().title()


@mcp.tool(
    name="serviceos_disambiguate",
    description="Ask the user to choose between multiple workflows.",
)
def serviceos_disambiguate(user_query: str, candidates: list[str]) -> ToolResult:
    options = []
    for tool_name in candidates:
        tool = next((item for item in TOOLS if item.name == tool_name), None)
        if tool is None:
            options.append(
                {
                    "id": tool_name,
                    "toolName": tool_name,
                    "title": _title_from_name(tool_name),
                    "description": "",
                }
            )
            continue

        options.append(
            {
                "id": tool.name,
                "toolName": tool.name,
                "title": _title_from_name(tool.name),
                "description": tool.description,
            }
        )

    payload: Dict[str, Any] = {
        "question": "Which workflow should I run?",
        "userQuery": user_query,
        "options": options,
    }

    return ToolResult(
        content="Please choose one option.",
        structured_content=payload,
        meta={"serviceos": {"type": "tool-choice", **payload}},
    )


def register_workflow_tools() -> None:
    for tool in TOOLS:
        mcp.add_tool(
            WorkflowTool(
                name=tool.name,
                description=tool.description,
                parameters=tool.parameters,
                handler=tool.handler,
            )
        )


register_workflow_tools()
