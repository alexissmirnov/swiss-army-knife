from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class PendingTool:
    name: str
    parameters: Dict[str, Any] = field(default_factory=dict)
    missing: List[str] = field(default_factory=list)
    confidence: float = 1.0


@dataclass
class ConversationState:
    session_id: str
    messages: List[Dict[str, str]] = field(default_factory=list)
    pending_tool: Optional[PendingTool] = None
    awaiting_approval: bool = False


class SessionStore:
    def __init__(self) -> None:
        self._store: Dict[str, ConversationState] = {}

    def get(self, session_id: Optional[str] = None) -> ConversationState:
        if not session_id:
            session_id = str(uuid.uuid4())
        if session_id not in self._store:
            self._store[session_id] = ConversationState(session_id=session_id)
        return self._store[session_id]


SESSION_STORE = SessionStore()
