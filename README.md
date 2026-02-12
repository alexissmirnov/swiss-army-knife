# swiss-army-knife

Prototype conversational AI that disambiguates tool usage and requires human approval when confidence is low.

## Features
- OpenAI-style tool schema with 14 mocked health tools
- LangChain-backed LLM for natural conversation and tool calling
- Confidence-based gating with configurable threshold
- Required-parameter collection before tool invocation
- CLI for interactive demo
- FastAPI server for LibreChat-style integration

## Quickstart

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .

# Run CLI
sak-cli

# Run API
uvicorn app.api:app --reload --port 8000
```

## Configuration
Set confidence threshold (0-1):

```bash
export SAK_CONFIDENCE_THRESHOLD=0.65
```

Enable/disable LLM usage:

```bash
export SAK_USE_LLM=true
```

Provide OpenAI settings via environment variables or `settings.json`:

```bash
export OPENAI_API_KEY=sk-...
export SAK_OPENAI_MODEL=gpt-4o-mini
```

Copy `settings.example.json` to `settings.json` and fill in values if you prefer file-based settings.

Instrumentation logs:

```bash
export SAK_LOG_PATH=logs/agent.log
tail -f logs/agent.log
```

Confidence model selection:

```bash
# Default keyword model
export SAK_CONFIDENCE_MODEL=keyword

# Optional remote model that returns tool scores
export SAK_CONFIDENCE_MODEL=remote
export SAK_MODEL_ENDPOINT=http://localhost:9001/score
export SAK_MODEL_TIMEOUT=3
```

Remote model payload example:

```json
{
  "message": "I need to reschedule my appointment",
  "tools": [
    { "name": "appointment_reschedule", "description": "...", "keywords": ["reschedule", "move appointment"] }
  ]
}
```

Remote model response example:

```json
{ "tool_name": "appointment_reschedule", "confidence": 0.78 }
```

## API (minimal)
- `POST /v1/chat/completions` — OpenAI-compatible-ish response with tool suggestions and gating state
- `GET /healthz` — health check

This is a prototype with mocked tools and in-memory session state.

## Vercel deploy
This repo includes `api/index.py` and `vercel.json` for Vercel serverless deployment.

```bash
vercel deploy
```
