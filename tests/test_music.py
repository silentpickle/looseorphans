from pathlib import Path
from typing import Any

import pytest

from tools.media import budget, music, post
from tools.media.jobs import pending
from tools.media.settings import load_settings

SETTINGS = load_settings()
MP3 = b"ID3 fake"
SONG_CENTS = 8


def track(**overrides: Any) -> music.Track:  # noqa: ANN401
    base: dict[str, Any] = {
        "id": "x",
        "group": "theme",
        "model": "song",
        "prompt": "a tune",
        "loop": True,
        "seconds": 60,
        "loop_start": 0.0,
        "loop_end": None,
    }
    return music.Track(**{**base, **overrides})


def test_manifest_loads_with_every_cue_from_the_design() -> None:
    ids = {item.id for item in music.load_tracks()}
    shared = {"title", "overworld", "battle", "boss", "final_boss_1", "final_boss_2", "final_boss_3"}
    stings = {"victory", "ost_swell"}
    locations = {"ongsang", "squish", "goryeo", "glory", "bog", "hamilsung", "kpdh"}
    assert shared | stings | locations <= ids


def test_stings_do_not_loop() -> None:
    assert all(not item.loop for item in music.load_tracks() if item.group == "sting")


def test_unknown_model_is_refused() -> None:
    with pytest.raises(music.MusicError):
        music.check_track(track(model="pro"))


def test_clip_length_is_not_ours_to_choose() -> None:
    with pytest.raises(music.MusicError):
        music.check_track(track(model="clip", seconds=30))


def test_loop_end_must_follow_loop_start() -> None:
    with pytest.raises(music.MusicError):
        music.check_track(track(loop_start=10.0, loop_end=10.0))


def test_duplicate_ids_are_refused() -> None:
    with pytest.raises(music.MusicError):
        music.check_unique([track(), track()])


def test_full_prompt_adds_instrumental_loop_and_length() -> None:
    prompt = track().full_prompt()
    assert prompt.startswith("a tune ")
    assert "Instrumental only" in prompt
    assert "Loops seamlessly" in prompt
    assert "About 60 seconds" in prompt
    assert "Loops seamlessly" not in track(loop=False, seconds=None).full_prompt()


def test_run_composes_records_encodes_and_skips_cached(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(music, "RAW_DIR", tmp_path / "raw")
    monkeypatch.setattr(music, "MUSIC_DIR", tmp_path / "music")
    ledger = tmp_path / "ledger.md"
    prompts: list[str] = []
    commands: list[list[str]] = []

    def fake_composer(_model: str, prompt: str, _key: str) -> bytes:
        prompts.append(prompt)
        return MP3

    monkeypatch.setattr(post, "duration", lambda _path: 60.0)
    monkeypatch.setattr(post, "run_all", commands.extend)
    item = track(id="a")
    made = music.run([item], SETTINGS, "key", fake_composer, ledger)
    assert made == list(item.outputs)
    assert item.raw.read_bytes() == MP3
    assert len(prompts) == 1
    assert len(commands) == 2
    assert f"| lyria | a | 0.0{SONG_CENTS} |" in ledger.read_text()

    music.run([item], SETTINGS, "key", fake_composer, ledger)
    assert len(prompts) == 1, "a cached raw track is not composed again"
    assert pending([music.job_for(item, SETTINGS)], None, {}) == [music.job_for(item, SETTINGS)]


def test_run_refuses_a_batch_past_the_cap(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(music, "RAW_DIR", tmp_path / "raw")
    ledger = tmp_path / "ledger.md"
    ledger.write_text("| 2026-11-02 | lyria | old | 4.95 | song |\n")
    with pytest.raises(budget.BudgetError):
        music.run([track()], SETTINGS, "key", lambda *_: MP3, ledger)
    assert not (tmp_path / "raw").exists(), "nothing is composed when the batch is refused"
