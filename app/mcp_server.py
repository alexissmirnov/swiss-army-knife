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


register_workflow_tools()
