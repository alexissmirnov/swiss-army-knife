import os


def get_confidence_threshold() -> float:
    raw = os.getenv("SAK_CONFIDENCE_THRESHOLD", "0.6").strip()
    try:
        value = float(raw)
    except ValueError:
        value = 0.6
    return max(0.0, min(1.0, value))


def get_debug() -> bool:
    return os.getenv("SAK_DEBUG", "").lower() in {"1", "true", "yes", "on"}
