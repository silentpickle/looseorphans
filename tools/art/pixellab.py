"""The PixelLab v2 HTTP boundary: balance and the Pixen image endpoint. Nothing else in the pipeline talks to it.

Base URL and schemas were checked against https://api.pixellab.ai/v2/openapi.json on 2026-11-02.
"""

from __future__ import annotations

import base64
import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any

API = "https://api.pixellab.ai/v2"
BALANCE = "/balance"
PIXEN = "/create-image-pixen"
KEY_VARIABLE = "PIXELLAB_AI_SECRET"
GENERATION_TIMEOUT_SECONDS = 300
BALANCE_TIMEOUT_SECONDS = 30
ERROR_EXCERPT = 300


class PixelLabError(RuntimeError):
    """The key is missing or PixelLab refused."""


@dataclass(frozen=True)
class Balance:
    """What the account has left."""

    status: str
    plan: str
    generations: int
    total: int
    credits_usd: float


def api_key() -> str:
    """The key from the environment (loaded from secrets.env by `uv run --env-file`)."""
    key = os.environ.get(KEY_VARIABLE, "")
    if not key:
        raise PixelLabError(f"{KEY_VARIABLE} is not set; run with `uv run --env-file secrets.env ...`")
    return key


def call(method: str, path: str, key: str, body: dict[str, Any] | None, timeout: int) -> dict[str, Any]:
    """One HTTPS request to PixelLab; the JSON back. The only network call in the art pipeline."""
    data = None if body is None else json.dumps(body).encode()
    request = urllib.request.Request(  # noqa: S310 pinned https url
        API + path,
        data=data,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method=method,
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:  # noqa: S310
            payload: dict[str, Any] = json.loads(response.read())
    except urllib.error.HTTPError as error:
        raise PixelLabError(
            f"{path}: PixelLab answered {error.code}: {error.read().decode()[:ERROR_EXCERPT]}"
        ) from error
    except urllib.error.URLError as error:
        raise PixelLabError(f"{path}: could not reach PixelLab: {error}") from error
    return payload


def parse_balance(payload: dict[str, Any]) -> Balance:
    """The balance from the /balance JSON."""
    subscription = payload["subscription"]
    return Balance(
        status=str(subscription.get("status", "")),
        plan=str(subscription.get("plan") or ""),
        generations=int(subscription.get("generations", 0)),
        total=int(subscription.get("total", 0)),
        credits_usd=float(payload["credits"].get("usd", 0.0)),
    )


def balance(key: str) -> Balance:
    """Ask PixelLab what is left."""
    return parse_balance(call("GET", BALANCE, key, None, BALANCE_TIMEOUT_SECONDS))


def decode_image(payload: dict[str, Any]) -> bytes:
    """The PNG bytes from a Pixen response."""
    return base64.b64decode(payload["image"]["base64"])


def pixen(body: dict[str, Any], key: str) -> bytes:
    """One Pixen generation; the PNG bytes back."""
    return decode_image(call("POST", PIXEN, key, body, GENERATION_TIMEOUT_SECONDS))
