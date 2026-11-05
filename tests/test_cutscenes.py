from pathlib import Path
from typing import Any

import pytest

from tools.media import budget, cutscenes, post
from tools.media.jobs import dry_run, pending
from tools.media.settings import ART_DIR, load_settings

SETTINGS = load_settings()
MP4 = b"ftyp fake"
SIX_SECOND_CENTS = 62
SIX_SECONDS = 6


def clip(**overrides: Any) -> cutscenes.Clip:  # noqa: ANN401
    base: dict[str, Any] = {
        "id": "x",
        "group": "trope",
        "prompt": "push in",
        "seconds": 6,
        "resolution": "720p",
        "still": Path("/nonexistent/x.png"),
    }
    return cutscenes.Clip(**{**base, **overrides})


MAIN_TROPES = 7
MAIN_CLIPS = 11


def main_clips() -> list[cutscenes.Clip]:
    return cutscenes.load_clips()


def test_manifest_loads_the_eleven_clips_and_the_sample() -> None:
    clips = main_clips()
    tropes = [item for item in clips if item.group == "trope"]
    assert len(tropes) == MAIN_TROPES
    assert {item.group for item in clips} == {"sample", "prologue", "trope", "ending", "finale"}
    assert len([item for item in clips if item.group != "sample"]) == MAIN_CLIPS
    assert all(item.seconds == SIX_SECONDS for item in cutscenes.load_clips()), "6 s each keeps the set in budget"


def test_manifest_still_ids_match_the_art_manifest() -> None:
    stills = {item.still.name for item in main_clips() if item.still.parent.name == "stills"}
    art_session = {"shatter", "declaration", "piggyback", "wrist_grab", "long_game", "shared_umbrella"}
    art_session |= {"intercepted_letter", "duet", "confession", "moon_pan"}
    assert stills == {f"{name}.png" for name in art_session}


def test_still_defaults_to_stills_folder() -> None:
    item = cutscenes.clip_from({"id": "ch1_declaration", "group": "trope", "prompt": "p", "seconds": 6})
    assert item.still == ART_DIR / "stills" / "ch1_declaration.png"


def test_length_outside_omni_range_is_refused() -> None:
    with pytest.raises(cutscenes.CutsceneError):
        cutscenes.check_clip(clip(seconds=11))
    cutscenes.check_clip(clip(seconds=10))


def test_unknown_resolution_is_refused() -> None:
    with pytest.raises(cutscenes.CutsceneError):
        cutscenes.check_clip(clip(resolution="1080p"))


def test_missing_still_is_skipped_not_an_error(tmp_path: Path) -> None:
    drawn = tmp_path / "drawn.png"
    drawn.write_bytes(b"png")
    ready, waiting = cutscenes.split_by_still([clip(id="a", still=drawn), clip(id="b")])
    assert [item.id for item in ready] == ["a"]
    assert [item.id for item in waiting] == ["b"]


def test_full_prompt_carries_the_length_and_house_style() -> None:
    assert "A 6 second clip." in clip().full_prompt()
    assert "no captions" in clip().full_prompt()


def test_dry_run_prices_a_six_second_clip(tmp_path: Path) -> None:
    job = cutscenes.job_for(clip(), SETTINGS)
    text = dry_run([job], "omni", SETTINGS.cutscenes_cap_cents, SETTINGS.media_cap_cents, tmp_path / "ledger.md")
    assert "$0.62" in text
    assert "of cap $25.00" in text
    assert "media total $0.00 + $0.62 of cap $10.00" in text


def test_run_animates_records_measured_length_and_encodes(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(cutscenes, "RAW_DIR", tmp_path / "raw")
    monkeypatch.setattr(cutscenes, "VIDEO_DIR", tmp_path / "video")
    still = tmp_path / "still.png"
    still.write_bytes(b"png")
    ledger = tmp_path / "ledger.md"
    prompts: list[str] = []
    commands: list[list[str]] = []

    def fake_animator(prompt: str, still_png: bytes, resolution: str, _key: str) -> bytes:
        assert still_png == b"png"
        assert resolution == "720p"
        prompts.append(prompt)
        return MP4

    monkeypatch.setattr(post, "duration", lambda _path: 8.0)
    monkeypatch.setattr(post, "run_all", commands.extend)
    item = clip(id="a", still=still)
    made = cutscenes.run([item], SETTINGS, "key", fake_animator, ledger)
    assert made == list(item.outputs)
    assert item.raw.read_bytes() == MP4
    assert len(commands) == 2
    assert "| omni | a | 0.83 |" in ledger.read_text(), "the ledger holds the measured 8 s, not the asked-for 6"

    cutscenes.run([item], SETTINGS, "key", fake_animator, ledger)
    assert len(prompts) == 1, "a cached raw clip is not animated again"
    assert pending([cutscenes.job_for(item, SETTINGS)], None, {}) == [cutscenes.job_for(item, SETTINGS)]


def test_run_refuses_a_batch_past_the_cap(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(cutscenes, "RAW_DIR", tmp_path / "raw")
    ledger = tmp_path / "ledger.md"
    ledger.write_text("| 2026-11-02 | omni | old | 9.39 | 720p |\n")  # + a $0.62 clip = $10.01, a cent past the cap
    with pytest.raises(budget.BudgetError):
        cutscenes.run([clip()], SETTINGS, "key", lambda *_: MP4, ledger)
    assert not (tmp_path / "raw").exists()
