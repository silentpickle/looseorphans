"""The Gemini API HTTP boundary; nothing else in the media pipeline talks to the network.

The Interactions endpoint answers for Lyria, Gemini Omni and Nano Banana; the Files endpoint serves a video
delivered by URI.

Endpoint, headers and response shapes were checked against https://aistudio.google.com/docs/music-generation,
https://aistudio.google.com/docs/omni and https://aistudio.google.com/docs/background-execution on 2026-11-02, and
https://aistudio.google.com/docs/image-generation on 2026-11-03.
Veo 3.1 was shut down on the Gemini API on 2026-10-22; Gemini Omni Flash is its image-to-video replacement.
"""

from __future__ import annotations

import base64
import json
import os
import re
import time
import urllib.error
import urllib.request
from typing import Any

API = "https://generativelanguage.googleapis.com/v1beta"
INTERACTIONS = "/interactions"
API_REVISION = "2026-05-20"
KEY_VARIABLE = "GEMINI_API_KEY"
MUSIC_CLIP_MODEL = "lyria-3-clip-preview"
MUSIC_SONG_MODEL = "lyria-3.5"
VIDEO_MODEL = "gemini-omni-1.1-flash"
IMAGE_MODEL = "gemini-nano-banana-2.1"  # Nano Banana 2.1, the stable image model the docs recommend
IMAGE_SIZE = "1K"  # the smallest 2.1 offers; every picture is downscaled to pixel size anyway
GENERATION_TIMEOUT_SECONDS = 900
POLL_TIMEOUT_SECONDS = 60
POLL_INTERVAL_SECONDS = 5.0
POLL_LIMIT = 120  # ten minutes of polling at most
ERROR_EXCERPT = 300
STATUS_RUNNING = "in_progress"
STATUS_DONE = "completed"
FILE_ID = re.compile(r"/files/([^:?/]+)")


class GeminiError(RuntimeError):
    """The key is missing or the API refused."""


def api_key() -> str:
    """The key from the environment (loaded from secrets.env by `uv run --env-file`)."""
    key = os.environ.get(KEY_VARIABLE, "")
    if not key:
        raise GeminiError(f"{KEY_VARIABLE} is not set; run with `uv run --env-file secrets.env ...`")
    return key


def headers(key: str) -> dict[str, str]:
    """Every request carries the key and the API revision."""
    return {"x-goog-api-key": key, "Api-Revision": API_REVISION, "Content-Type": "application/json"}


def fetch(request: urllib.request.Request, timeout: int) -> bytes:
    """One HTTPS exchange; the body back. The only network call in the media pipeline."""
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:  # noqa: S310 pinned https url
            body: bytes = response.read()
    except urllib.error.HTTPError as error:
        raise GeminiError(
            f"{request.full_url}: Gemini answered {error.code}: {error.read().decode()[:ERROR_EXCERPT]}"
        ) from error
    except urllib.error.URLError as error:
        raise GeminiError(f"{request.full_url}: could not reach Gemini: {error}") from error
    return body


def call(method: str, path: str, key: str, body: dict[str, Any] | None, timeout: int) -> dict[str, Any]:
    """One JSON request to the API; the JSON back."""
    data = None if body is None else json.dumps(body).encode()
    request = urllib.request.Request(API + path, data=data, headers=headers(key), method=method)  # noqa: S310
    payload: dict[str, Any] = json.loads(fetch(request, timeout))
    return payload


def interact(body: dict[str, Any], key: str, sleep: float = POLL_INTERVAL_SECONDS) -> dict[str, Any]:
    """Create one interaction and wait until it is no longer running; the finished interaction."""
    payload = call("POST", INTERACTIONS, key, body, GENERATION_TIMEOUT_SECONDS)
    for _ in range(POLL_LIMIT):
        if payload.get("status") != STATUS_RUNNING:
            return payload
        time.sleep(sleep)
        payload = call("GET", f"{INTERACTIONS}/{payload['id']}", key, None, POLL_TIMEOUT_SECONDS)
    raise GeminiError(f"interaction {payload.get('id')} still running after {POLL_LIMIT} polls")


def output_parts(payload: dict[str, Any], kind: str) -> list[dict[str, Any]]:
    """The model-output content blocks of one type (`audio`, `video`, `text`)."""
    if payload.get("status") != STATUS_DONE:
        raise GeminiError(f"interaction {payload.get('id')} ended {payload.get('status')}: {payload.get('error')}")
    steps = [step for step in payload.get("steps", []) if step.get("type") == "model_output"]
    return [part for step in steps for part in step.get("content", []) if part.get("type") == kind]


def download(uri: str, key: str) -> bytes:
    """A generated file delivered by URI: the bytes."""
    match = FILE_ID.search(uri)
    if match is None:
        raise GeminiError(f"not a files URI: {uri}")
    url = f"{API}/files/{match.group(1)}:download?alt=media"
    return fetch(urllib.request.Request(url, headers=headers(key)), GENERATION_TIMEOUT_SECONDS)  # noqa: S310


def media_bytes(part: dict[str, Any], key: str) -> bytes:
    """The bytes of one audio or video part, inline or by URI."""
    if "data" in part:
        return base64.b64decode(part["data"])
    return download(str(part["uri"]), key)


def first_media(payload: dict[str, Any], kind: str, key: str) -> bytes:
    """The bytes of the first part of `kind` in a finished interaction."""
    parts = output_parts(payload, kind)
    if not parts:
        raise GeminiError(f"interaction {payload.get('id')} returned no {kind}")
    return media_bytes(parts[0], key)


def music_body(model: str, prompt: str) -> dict[str, Any]:
    """The Lyria request."""
    return {"model": model, "input": prompt}


def generate_music(model: str, prompt: str, key: str) -> bytes:
    """One Lyria song; MP3 bytes back."""
    return first_media(interact(music_body(model, prompt), key), "audio", key)


def video_body(prompt: str, still_png: bytes, resolution: str) -> dict[str, Any]:
    """The Omni image-to-video request, the still as the first frame."""
    return {
        "model": VIDEO_MODEL,
        "input": [
            {"type": "image", "mime_type": "image/png", "data": base64.b64encode(still_png).decode()},
            {"type": "text", "text": prompt},
        ],
        "generation_config": {"video_config": {"task": "image_to_video"}},
        "response_format": {"type": "video", "aspect_ratio": "16:9", "resolution": resolution},
    }


def generate_video(prompt: str, still_png: bytes, resolution: str, key: str) -> bytes:
    """One Omni clip from a still; MP4 bytes back."""
    return first_media(interact(video_body(prompt, still_png, resolution), key), "video", key)


def image_part(data: bytes, mime_type: str) -> dict[str, str]:
    """One inline image block of an interaction's input."""
    return {"type": "image", "mime_type": mime_type, "data": base64.b64encode(data).decode()}


def image_body(prompt: str, references: list[tuple[bytes, str]], aspect_ratio: str) -> dict[str, Any]:
    """The Nano Banana request: the prompt, then each reference image in order."""
    images = [image_part(data, mime_type) for data, mime_type in references]
    return {
        "model": IMAGE_MODEL,
        "input": [{"type": "text", "text": prompt}, *images],
        "response_format": {"type": "image", "aspect_ratio": aspect_ratio, "image_size": IMAGE_SIZE},
    }


def generate_image(prompt: str, references: list[tuple[bytes, str]], aspect_ratio: str, key: str) -> bytes:
    """One Nano Banana picture from a prompt and reference images; the image bytes back."""
    return first_media(interact(image_body(prompt, references, aspect_ratio), key), "image", key)
