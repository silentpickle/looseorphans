"""Per-adventure caps: each adventure reads its own [budget.<id>], counts only its own ledger rows, and finds its
manifests under adventures/<id>/; a ledger row from before the adventure column counts as main's."""

import sys
from pathlib import Path

import pytest

from tools import adventure
from tools.art import __main__ as art_cli
from tools.art import budget as art_budget
from tools.art import pictures
from tools.art import settings as art_settings
from tools.media import __main__ as media_cli
from tools.media import budget as media_budget
from tools.media import cutscenes, image, music
from tools.media import settings as media_settings

STAY = "stay"
ART_HEADER = "| Date | Piece | Size | Pictures | Note | Adventure |\n|---|---|---|---|---|---|\n"
LEGACY_ART_ROWS = 3
MAIN_ART_ROWS = 2
STAY_ART_ROWS = 5
PICTURE_CAP = 8
STAY_TO_CAP = PICTURE_CAP - STAY_ART_ROWS

STAY_PICTURES_CAP = 200
STAY_MUSIC_CENTS = 100
STAY_CUTSCENES_CENTS = 600
STAY_IMAGES_CENTS = 800
STAY_MEDIA_CENTS = 1500
MAIN_IMAGES_CENTS = 1000

LEGACY_LYRIA_CENTS = 400
STAY_LYRIA_CENTS = 90
STAY_OMNI_CENTS = 1300
STAY_TOTAL_CENTS = STAY_LYRIA_CENTS + STAY_OMNI_CENTS
STAY_TO_TOTAL_CENTS = STAY_MEDIA_CENTS - STAY_TOTAL_CENTS
STAY_TO_MUSIC_CENTS = STAY_MUSIC_CENTS - STAY_LYRIA_CENTS
LEFT_AT_CAP = 0
SPENT_BY_FAKE = 0


def art_ledger(tmp_path: Path) -> Path:
    path = tmp_path / "art-ledger.md"
    legacy = "".join(f"| 2026-11-02 | old{i} | 32x32 | 1 | pixen |\n" for i in range(LEGACY_ART_ROWS))
    main = "".join(f"| 2026-11-04 | m{i} | 32x32 | 1 | pixen | main |\n" for i in range(MAIN_ART_ROWS))
    stay = "".join(f"| 2026-11-05 | s{i} | 32x32 | 1 | pixen | stay |\n" for i in range(STAY_ART_ROWS))
    path.write_text(ART_HEADER + legacy + main + stay)
    return path


def media_ledger(tmp_path: Path) -> Path:
    path = tmp_path / "media-ledger.md"
    path.write_text(
        "| 2026-11-02 | lyria | old | 4.00 | song |\n"
        "| 2026-11-05 | lyria | s1 | 0.90 | song | stay |\n"
        "| 2026-11-05 | omni | s2 | 13.00 | 720p | stay |\n"
    )
    return path


def test_legacy_row_counts_as_main() -> None:
    assert adventure.row_adventure("| 2026-11-02 | p | 32x32 | 1 | pixen |") == adventure.MAIN
    assert adventure.row_adventure("| 2026-11-05 | p | 32x32 | 1 | pixen | stay |") == STAY
    assert adventure.row_adventure("| 2026-11-05 | p | 32x32 | 1 | pixen |  |") == adventure.MAIN


@pytest.mark.parametrize(
    "bad", ["../main", "Stay", "", "stay/x", "1stay"], ids=["dotdot", "upper", "empty", "slash", "digit"]
)
def test_unsafe_adventure_id_rejected(bad: str) -> None:
    with pytest.raises(adventure.AdventureError):
        adventure.checked_id(bad)


def test_unknown_adventure_has_no_budget() -> None:
    with pytest.raises(adventure.AdventureError, match=r"\[budget.nowhere\]"):
        art_settings.load_settings(adventure="nowhere")


def test_art_spent_counts_only_that_adventure(tmp_path: Path) -> None:
    ledger = art_ledger(tmp_path)
    assert art_budget.spent(ledger) == LEGACY_ART_ROWS + MAIN_ART_ROWS
    assert art_budget.spent(ledger, adventure=STAY) == STAY_ART_ROWS


def test_stay_picture_batch_at_cap_runs(tmp_path: Path) -> None:
    ledger = art_ledger(tmp_path)
    assert art_budget.check(ledger, STAY_TO_CAP, PICTURE_CAP, adventure=STAY) == LEFT_AT_CAP


def test_stay_picture_batch_over_cap_refused(tmp_path: Path) -> None:
    ledger = art_ledger(tmp_path)
    with pytest.raises(art_budget.BudgetError, match="to 9, over the cap of 8"):
        art_budget.check(ledger, STAY_TO_CAP + 1, PICTURE_CAP, adventure=STAY)


def test_art_record_writes_adventure_column(tmp_path: Path) -> None:
    ledger = tmp_path / "art-ledger.md"
    art_budget.record(ledger, art_budget.LedgerRow("stay/a", "32x32", 1, "pixen", STAY))
    assert ledger.read_text().endswith("| stay/a | 32x32 | 1 | pixen | stay |\n")
    assert art_budget.spent(ledger, adventure=STAY) == 1
    assert art_budget.spent(ledger) == 0


def test_media_spent_counts_only_that_adventure(tmp_path: Path) -> None:
    ledger = media_ledger(tmp_path)
    assert media_budget.spent(ledger) == LEGACY_LYRIA_CENTS
    assert media_budget.spent(ledger, adventure=STAY) == STAY_TOTAL_CENTS
    assert media_budget.spent(ledger, "lyria", adventure=STAY) == STAY_LYRIA_CENTS


def test_stay_media_batch_at_total_cap_runs(tmp_path: Path) -> None:
    ledger = media_ledger(tmp_path)
    left = media_budget.check(
        ledger, "omni", STAY_TO_TOTAL_CENTS, STAY_CUTSCENES_CENTS * 3, STAY_MEDIA_CENTS, adventure=STAY
    )
    assert left == LEFT_AT_CAP


def test_stay_media_batch_over_total_cap_refused(tmp_path: Path) -> None:
    ledger = media_ledger(tmp_path)
    with pytest.raises(media_budget.BudgetError, match=r"media total to \$15.01"):
        media_budget.check(
            ledger, "omni", STAY_TO_TOTAL_CENTS + 1, STAY_CUTSCENES_CENTS * 3, STAY_MEDIA_CENTS, adventure=STAY
        )


def test_stay_music_batch_at_kind_cap_runs(tmp_path: Path) -> None:
    ledger = media_ledger(tmp_path)
    left = media_budget.check(ledger, "lyria", STAY_TO_MUSIC_CENTS, STAY_MUSIC_CENTS, STAY_MEDIA_CENTS, adventure=STAY)
    assert left == LEFT_AT_CAP
    with pytest.raises(media_budget.BudgetError, match=r"lyria to \$1.01"):
        media_budget.check(ledger, "lyria", STAY_TO_MUSIC_CENTS + 1, STAY_MUSIC_CENTS, STAY_MEDIA_CENTS, adventure=STAY)


def test_stay_caps_from_config() -> None:
    assert art_settings.load_settings(adventure=STAY).pictures_cap == STAY_PICTURES_CAP
    loaded = media_settings.load_settings(adventure=STAY)
    caps = (loaded.music_cap_cents, loaded.cutscenes_cap_cents, loaded.images_cap_cents, loaded.media_cap_cents)
    assert caps == (STAY_MUSIC_CENTS, STAY_CUTSCENES_CENTS, STAY_IMAGES_CENTS, STAY_MEDIA_CENTS)
    assert loaded.adventure == STAY
    assert media_settings.load_settings().images_cap_cents == MAIN_IMAGES_CENTS


def test_manifest_paths_per_adventure() -> None:
    assert art_settings.pictures_spec() == art_settings.PICTURES_SPEC
    assert art_settings.pictures_spec(STAY) == art_settings.TOOL_DIR / "adventures" / STAY / "pixellab.toml"
    assert media_settings.spec(media_settings.MUSIC_SPEC) == media_settings.MUSIC_SPEC
    stay_music = media_settings.spec(media_settings.MUSIC_SPEC, STAY)
    assert stay_music == media_settings.TOOL_DIR / "adventures" / STAY / "music.toml"
    assert art_settings.credits_path() == art_settings.ART_DIR / "CREDITS.md"
    assert art_settings.credits_path(STAY) == art_settings.ART_DIR / "CREDITS-stay.md"


def test_missing_manifests_are_empty(tmp_path: Path) -> None:
    absent = tmp_path / "absent.toml"
    assert pictures.load_pieces(absent) == []
    assert music.load_tracks(absent) == []
    assert cutscenes.load_clips(absent) == []
    assert image.load_pictures(absent) == []


def spy_spent(seen: list[str]) -> object:
    def fake(_ledger: Path, _kind: str | None = None, *, adventure: str) -> int:
        seen.append(adventure)
        return SPENT_BY_FAKE

    return fake


def test_stay_art_cli_dry_run_is_empty(monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]) -> None:
    seen: list[str] = []
    monkeypatch.setattr(art_settings, "TOOL_DIR", Path("/nonexistent"))
    monkeypatch.setattr(art_budget, "spent", spy_spent(seen))
    monkeypatch.setattr(sys, "argv", ["art", "pictures", "--adventure", STAY])
    art_cli.main()
    assert capsys.readouterr().out == "0 piece(s) = 0 picture(s); ledger 0 + 0 of cap 200\n"
    assert seen == [STAY]


@pytest.mark.parametrize(
    ("command", "expected"),
    [
        ("music", "lyria $0.00 + $0.00 of cap $1.00; media total $0.00 + $0.00 of cap $15.00"),
        ("cutscenes", "omni $0.00 + $0.00 of cap $6.00; media total $0.00 + $0.00 of cap $15.00"),
        ("image", "nano_banana $0.00 + $0.00 of cap $8.00; media total $0.00 + $0.00 of cap $15.00"),
    ],
    ids=["stay_music_caps", "stay_cutscenes_caps", "stay_image_caps"],
)
def test_stay_media_cli_dry_run_is_empty(
    command: str, expected: str, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    seen: list[str] = []
    monkeypatch.setattr(media_settings, "TOOL_DIR", Path("/nonexistent"))
    monkeypatch.setattr(media_budget, "spent", spy_spent(seen))
    monkeypatch.setattr(sys, "argv", ["media", command, "--adventure", STAY])
    media_cli.main()
    assert capsys.readouterr().out == f"0 job(s) = $0.00; {expected}\n"
    assert set(seen) == {STAY}


def test_cli_rejects_unsafe_adventure(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(sys, "argv", ["art", "pictures", "--adventure", "../main"])
    with pytest.raises(SystemExit):
        art_cli.main()
