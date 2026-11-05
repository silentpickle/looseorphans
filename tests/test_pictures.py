import json
from pathlib import Path
from typing import Any

import pytest
from PIL import Image

from tools.art import pictures

PNG = b"\x89PNG fake"


def piece(**overrides: Any) -> pictures.Piece:  # noqa: ANN401
    base: dict[str, Any] = {
        "id": "x",
        "group": "g",
        "kind": "object",
        "width": 64,
        "height": 64,
        "prompt": "a thing",
        "seed": 1,
        "view": None,
        "detail": "highly detailed",
    }
    return pictures.Piece(**{**base, **overrides})


def test_side_not_multiple_of_four_is_refused() -> None:
    with pytest.raises(pictures.PictureError):
        pictures.check_size(piece(width=66))


def test_small_side_needs_square() -> None:
    with pytest.raises(pictures.PictureError):
        pictures.check_size(piece(width=16, height=32))
    pictures.check_size(piece(width=16, height=16))


def test_transparent_area_limit_edge() -> None:
    pictures.check_size(piece(width=256, height=256))
    with pytest.raises(pictures.PictureError):
        pictures.check_size(piece(width=256, height=260))


def test_scene_area_limit_edge() -> None:
    pictures.check_size(piece(kind="scene", width=512, height=512))
    with pytest.raises(pictures.PictureError):
        pictures.check_size(piece(kind="scene", width=512, height=516))


def test_unknown_view_is_refused() -> None:
    with pytest.raises(pictures.PictureError):
        pictures.check_kind(piece(view="isometric"))


def test_duplicate_ids_are_refused() -> None:
    with pytest.raises(pictures.PictureError):
        pictures.check_unique([piece(), piece()])


def test_request_body_matches_pixen_schema() -> None:
    body = piece(view="side").request_body()
    assert body["image_size"] == {"width": 64, "height": 64}
    assert body["no_background"] is True
    assert body["view"] == "side"
    assert "view" not in piece().request_body()


def test_run_draws_records_and_skips_existing(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(pictures, "ART_DIR", tmp_path / "art")
    ledger = tmp_path / "ledger.md"
    calls: list[str] = []

    def fake_drawer(body: dict[str, Any], _key: str) -> bytes:
        calls.append(str(body["description"]))
        return PNG

    first = piece(id="a")
    drawn = pictures.run([first], 10, "key", fake_drawer, ledger)
    assert drawn == [first.path]
    assert first.path.read_bytes() == PNG
    assert pictures.missing([first]) == []
    assert calls == ["a thing"]
    assert "g/a" in ledger.read_text()


def test_manifest_loads() -> None:
    pieces = pictures.load_pieces()
    assert {p.group for p in pieces} >= {"portraits", "backdrops"}


def test_manifest_lists_every_png_by_group(tmp_path: Path) -> None:
    art = tmp_path / "art"
    pngs = [("props", "shard", (32, 32)), ("backdrops", "dorm", (320, 180)), ("props", "doll", (48, 48))]
    for group, name, size in pngs:
        (art / group).mkdir(parents=True, exist_ok=True)
        Image.new("RGBA", size).save(art / group / f"{name}.png")
    (art / "props" / "notes.txt").write_text("ignored")

    target = pictures.write_manifest(art)

    assert target == art / "manifest.json"
    assert json.loads(target.read_text()) == {
        "backdrops": [{"id": "dorm", "width": 320, "height": 180}],
        "props": [{"id": "doll", "width": 48, "height": 48}, {"id": "shard", "width": 32, "height": 32}],
    }


def test_manifest_of_empty_dir_is_empty(tmp_path: Path) -> None:
    assert json.loads(pictures.write_manifest(tmp_path).read_text()) == {}
