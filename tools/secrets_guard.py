"""A Claude Code PreToolUse hook (.claude/settings.json): an agent's shell command may not touch secrets.env.

Two uses stay allowed: handing the file to a runner (`uv run --env-file secrets.env ...`) and checking that it exists
(`test -e secrets.env`). Anything else that names it (cat, grep, cp, an editor, a redirect) is denied, with the reason
shown to the agent. The template docs/secrets.env.example is not a secret and may be read.
"""

from __future__ import annotations

import json
import sys
from typing import Any

SECRETS_FILE = "secrets.env"
ALLOWED_PHRASES = (
    "secrets.env.example",
    "--env-file secrets.env",
    "--env-file=secrets.env",
    "test -e secrets.env",
    "test -f secrets.env",
    "[ -e secrets.env ]",
    "[ -f secrets.env ]",
)
REASON = (
    "This command touches secrets.env, which agents never open, print, search or copy (CLAUDE.md, Secrets). "
    "Pass it to a runner with `uv run --env-file secrets.env ...` or check it exists with `test -e secrets.env`."
)


def touches_secret(command: str) -> bool:
    """True when the command names secrets.env outside the allowed phrases."""
    rest = command
    for phrase in ALLOWED_PHRASES:
        rest = rest.replace(phrase, "")
    return SECRETS_FILE in rest


def decision(payload: dict[str, Any]) -> dict[str, Any] | None:
    """The hook's answer for one tool call: a deny for a command that touches the secret, else nothing."""
    command = str(payload.get("tool_input", {}).get("command", ""))
    if not touches_secret(command):
        return None
    return {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": REASON,
        }
    }


def main() -> None:
    """Read the tool call from stdin and print a deny when needed."""
    answer = decision(json.load(sys.stdin))
    if answer is not None:
        print(json.dumps(answer))


if __name__ == "__main__":
    main()
