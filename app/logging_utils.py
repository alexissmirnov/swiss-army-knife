from __future__ import annotations

import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict


_LOGGER: logging.Logger | None = None


def get_logger() -> logging.Logger:
    global _LOGGER
    if _LOGGER is not None:
        return _LOGGER

    log_path = os.getenv("SAK_LOG_PATH", "logs/agent.log")
    path = Path(log_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    logger = logging.getLogger("sak")
    logger.setLevel(logging.INFO)
    handler = logging.FileHandler(path, encoding="utf-8")
    formatter = logging.Formatter("%(message)s")
    handler.setFormatter(formatter)

    if not logger.handlers:
        logger.addHandler(handler)

    _LOGGER = logger
    return logger


def log_event(event: str, payload: Dict[str, Any]) -> None:
    logger = get_logger()
    record = {
        "ts": datetime.utcnow().isoformat() + "Z",
        "event": event,
        **payload,
    }
    logger.info(json.dumps(record, ensure_ascii=False))
