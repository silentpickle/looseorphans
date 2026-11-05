import base64
import io
from pathlib import Path
from typing import Any

import pytest
from PIL import Image

from tools.media import budget, gemini, image
from tools.media.jobs import pending
from tools.media.settings import load_settings

SETTINGS = load_settings()
GREEN = (0, 255, 0)
FACE = (200, 120, 90)
RAW_SIDE = 64
FACE_BOX = (16, 16, 48, 48)
POCKET_BOX = (20, 20, 28, 28)  # green left inside the face, as through a pair of glasses
POCKET_CENTRE = (12, 12)  # that pocket after the halving downscale
OUT_SIDE = 32
IMAGE_CENTS = 4


def picture(tmp_path: Path, **overrides: Any) -> image.Picture:  # noqa: ANN401
    reference = tmp_path / "ref.png"
    Image.new("RGB", (OUT_SIDE, OUT_SIDE), FACE).save(reference)
    base: dict[str, Any] = {
        "id": "x",
        "group": "portraits",
        "prompt": "a bust",
        "width": OUT_SIDE,
        "height": OUT_SIDE,
        "references": (reference,),
        "key": GREEN,
    }
    return image.Picture(**{**base, **overrides})


def drawn_png() -> bytes:
    canvas = Image.new("RGB", (RAW_SIDE, RAW_SIDE), GREEN)
    canvas.paste(FACE, FACE_BOX)
    canvas.paste(GREEN, POCKET_BOX)
    out = io.BytesIO()
    canvas.save(out, format="PNG")
    return out.getvalue()


class FakeApi:
    """The HTTP layer: every call answers with a finished interaction holding one picture."""

    def __init__(self) -> None:
        self.bodies: list[dict[str, Any]] = []

    def __call__(self, method: str, path: str, _key: str, body: Any, _timeout: int) -> dict[str, Any]:  # noqa: ANN401
        assert (method, path) == ("POST", "/interactions")
        self.bodies.append(body)
        part = {"type": "image", "mime_type": "image/png", "data": base64.b64encode(drawn_png()).decode()}
        return {"id": "v1_x", "status": "completed", "steps": [{"type": "model_output", "content": [part]}]}


@pytest.fixture
def api(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> FakeApi:
    monkeypatch.setattr(image, "RAW_DIR", tmp_path / "raw")
    monkeypatch.setattr(image, "ART_DIR", tmp_path / "art")
    fake = FakeApi()
    monkeypatch.setattr(gemini, "call", fake)
    return fake


def ledger_spent_up_to(tmp_path: Path, cents: int) -> Path:
    ledger = tmp_path / "ledger.md"
    ledger.write_text(f"| 2026-11-03 | lyria | old | {budget.usd(cents)} | song |\n")
    return ledger


def test_shipped_manifest_loads_with_no_pictures_in_it() -> None:
    assert image.load_pictures() == []


def test_image_price_comes_from_config() -> None:
    assert SETTINGS.image_cents == IMAGE_CENTS


def test_aspect_ratio_nano_banana_cannot_draw_is_refused(tmp_path: Path) -> None:
    with pytest.raises(image.ImageError):
        image.check_picture(picture(tmp_path, width=100, height=36))


def test_reference_of_unknown_type_is_refused(tmp_path: Path) -> None:
    with pytest.raises(image.ImageError):
        image.check_picture(picture(tmp_path, references=(tmp_path / "ref.gif",)))


def test_picture_without_references_is_refused(tmp_path: Path) -> None:
    with pytest.raises(image.ImageError):
        image.check_picture(picture(tmp_path, references=()))


def test_duplicate_ids_are_refused(tmp_path: Path) -> None:
    with pytest.raises(image.ImageError):
        image.check_unique([picture(tmp_path), picture(tmp_path)])


def test_missing_reference_waits(tmp_path: Path) -> None:
    ready = picture(tmp_path, id="ready")
    waiting = picture(tmp_path, id="waiting", references=(tmp_path / "gone.jpg",))
    assert image.split_by_references([ready, waiting]) == ([ready], [waiting])


def test_full_prompt_asks_for_the_key_background_and_no_text(tmp_path: Path) -> None:
    prompt = picture(tmp_path).full_prompt()
    assert prompt.startswith("a bust ")
    assert "#00ff00" in prompt
    assert "No text" in prompt
    assert "#00ff00" not in picture(tmp_path, key=None).full_prompt()


def test_crop_to_aspect_takes_the_centre() -> None:
    wide = Image.new("RGB", (160, 90))
    assert image.crop_to_aspect(wide, 1, 1).size == (90, 90)
    assert image.crop_to_aspect(wide, 16, 9).size == (160, 90)


def test_run_draws_through_the_api_keys_downscales_and_records(tmp_path: Path, api: FakeApi) -> None:
    item = picture(tmp_path)
    ledger = tmp_path / "ledger.md"
    made = image.run([item], SETTINGS, "key", ledger=ledger)
    assert made == [item.output]
    body = api.bodies[0]
    assert body["model"] == gemini.IMAGE_MODEL
    assert [part["type"] for part in body["input"]] == ["text", "image"]
    assert body["response_format"] == {"type": "image", "aspect_ratio": "1:1", "image_size": gemini.IMAGE_SIZE}
    with Image.open(item.output) as out:
        assert out.size == (OUT_SIDE, OUT_SIDE)
        assert out.getpixel((0, 0)) == (0, 0, 0, 0), "the key colour is cleared"
        assert out.getpixel((OUT_SIDE // 2, OUT_SIDE // 2)) == (*FACE, 255)
        assert out.getpixel(POCKET_CENTRE) == (0, 0, 0, 0), "a pocket of key colour inside a shape is cleared too"
    assert f"| nano_banana | x | 0.0{IMAGE_CENTS} | {gemini.IMAGE_MODEL} 1K 1:1 |" in ledger.read_text()


def test_picture_on_disk_is_never_redrawn(tmp_path: Path, api: FakeApi) -> None:
    item = picture(tmp_path)
    ledger = tmp_path / "ledger.md"
    image.run([item], SETTINGS, "key", ledger=ledger)
    assert image.run([item], SETTINGS, "key", ledger=ledger) == []
    assert pending([image.job_for(item, SETTINGS)], None, {}) == []
    item.output.unlink()
    image.run([item], SETTINGS, "key", ledger=ledger)
    assert len(api.bodies) == 1, "a cached raw picture is only keyed and downscaled again"
    assert ledger.read_text().count("nano_banana") == 1


def test_batch_landing_exactly_on_the_media_cap_runs(tmp_path: Path, api: FakeApi) -> None:
    ledger = ledger_spent_up_to(tmp_path, SETTINGS.media_cap_cents - IMAGE_CENTS)
    image.run([picture(tmp_path)], SETTINGS, "key", ledger=ledger)
    assert len(api.bodies) == 1
    assert budget.spent(ledger) == SETTINGS.media_cap_cents


def test_batch_one_cent_over_the_media_cap_is_refused(tmp_path: Path, api: FakeApi) -> None:
    ledger = ledger_spent_up_to(tmp_path, SETTINGS.media_cap_cents - IMAGE_CENTS + 1)
    with pytest.raises(budget.BudgetError):
        image.run([picture(tmp_path)], SETTINGS, "key", ledger=ledger)
    assert api.bodies == [], "nothing is drawn when the batch is refused"
    assert not (tmp_path / "raw").exists()
