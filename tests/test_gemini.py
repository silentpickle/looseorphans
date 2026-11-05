import base64
from typing import Any

import pytest

from tools.media import gemini

MP3 = b"ID3 fake mp3"
MP4 = b"\x00\x00\x00\x18ftyp fake mp4"


def finished(kind: str, data: bytes) -> dict[str, Any]:
    part = {"type": kind, "mime_type": f"{kind}/x", "data": base64.b64encode(data).decode()}
    return {"id": "v1_x", "status": "completed", "steps": [{"type": "model_output", "content": [part]}]}


def test_missing_key_is_an_error(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv(gemini.KEY_VARIABLE, raising=False)
    with pytest.raises(gemini.GeminiError):
        gemini.api_key()


def test_music_body_is_model_and_prompt() -> None:
    assert gemini.music_body("lyria-3.5", "a tune") == {"model": "lyria-3.5", "input": "a tune"}


def test_video_body_puts_the_still_first() -> None:
    body = gemini.video_body("push in", b"png", "720p")
    assert body["model"] == gemini.VIDEO_MODEL
    assert body["input"][0] == {"type": "image", "mime_type": "image/png", "data": base64.b64encode(b"png").decode()}
    assert body["input"][1] == {"type": "text", "text": "push in"}
    assert body["generation_config"]["video_config"]["task"] == "image_to_video"
    assert body["response_format"]["resolution"] == "720p"


def test_interact_polls_while_running(monkeypatch: pytest.MonkeyPatch) -> None:
    answers = [{"id": "v1_x", "status": "in_progress"}, finished("audio", MP3)]
    calls: list[tuple[str, str]] = []

    def fake_call(method: str, path: str, _key: str, _body: Any, _timeout: int) -> dict[str, Any]:  # noqa: ANN401
        calls.append((method, path))
        return answers.pop(0)

    monkeypatch.setattr(gemini, "call", fake_call)
    payload = gemini.interact({"model": "m"}, "key", sleep=0)
    assert payload["status"] == "completed"
    assert calls == [("POST", "/interactions"), ("GET", "/interactions/v1_x")]


def test_first_media_decodes_inline_data() -> None:
    assert gemini.first_media(finished("video", MP4), "video", "key") == MP4


def test_first_media_downloads_a_uri(monkeypatch: pytest.MonkeyPatch) -> None:
    payload = finished("video", b"")
    payload["steps"][0]["content"][0] = {"type": "video", "uri": "https://x/v1beta/files/abc123:download?alt=media"}
    monkeypatch.setattr(gemini, "download", lambda uri, _key: uri.encode())
    assert b"files/abc123" in gemini.first_media(payload, "video", "key")


def test_failed_interaction_is_an_error() -> None:
    with pytest.raises(gemini.GeminiError):
        gemini.output_parts({"id": "v1_x", "status": "failed", "error": "boom"}, "audio")


def test_no_media_is_an_error() -> None:
    payload = finished("text", b"lyrics")
    with pytest.raises(gemini.GeminiError):
        gemini.first_media(payload, "audio", "key")
