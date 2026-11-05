"""Characterization pin: today's budget checks, ledger rows and dry-run text, before per-adventure caps.

Every expectation here is the whole output as it is now. A batch exactly at a cap runs; one unit over is refused.
"""

import sys
from pathlib import Path

import pytest

from tools.art import __main__ as art_cli
from tools.art import budget as art_budget
from tools.art import pictures
from tools.art import settings as art_settings
from tools.media import __main__ as media_cli
from tools.media import budget as media_budget
from tools.media import cutscenes, image, jobs, music
from tools.media import settings as media_settings

ART_HEADER = "# Art ledger\n\n| Date | Piece | Size | Pictures | Note |\n|---|---|---|---|---|\n"
MEDIA_HEADER = "# Media ledger\n\n| Date | Kind | Id | Est. USD | Note |\n|---|---|---|---|---|\n"

PICTURE_CAP = 10
PICTURES_SPENT = 7
PICTURES_TO_CAP = PICTURE_CAP - PICTURES_SPENT
LEFT_AT_CAP = 0

KIND_CAP_CENTS = 500
TOTAL_CAP_CENTS = 1000
LYRIA_ROWS = 25  # 25 x $0.04 = $1.00
LYRIA_SPENT_CENTS = 100
OMNI_SPENT_CENTS = 800
TOTAL_SPENT_CENTS = LYRIA_SPENT_CENTS + OMNI_SPENT_CENTS
TO_TOTAL_CAP_CENTS = TOTAL_CAP_CENTS - TOTAL_SPENT_CENTS
OMNI_ONLY_SPENT_CENTS = 0
TO_KIND_CAP_CENTS = KIND_CAP_CENTS - LYRIA_SPENT_CENTS

JOB_CENTS = 62
CLI_SPENT_CENTS = 37

MAIN_PICTURES_CAP = 200
MAIN_MUSIC_CENTS = 500
MAIN_CUTSCENES_CENTS = 2500
MAIN_MEDIA_CENTS = 1000


def art_ledger(tmp_path: Path, rows: int) -> Path:
    path = tmp_path / "art-ledger.md"
    body = "".join(f"| 2026-11-02 | p{i} | 32x32 | 1 | pixen |\n" for i in range(rows))
    path.write_text(ART_HEADER + body)
    return path


def media_ledger(tmp_path: Path) -> Path:
    path = tmp_path / "media-ledger.md"
    body = "".join(f"| 2026-11-02 | lyria | t{i} | 0.04 | clip |\n" for i in range(LYRIA_ROWS))
    path.write_text(MEDIA_HEADER + body + "| 2026-11-02 | omni | c1 | 8.00 | 720p |\n")
    return path


def piece(name: str, group: str = "props") -> pictures.Piece:
    return pictures.Piece(name, group, "object", 32, 32, "a lamp", 0, None, "highly detailed")


# --- art: the picture cap ----------------------------------------------------------------------------------------


def test_art_missing_ledger_spends_nothing(tmp_path: Path) -> None:
    assert art_budget.spent(tmp_path / "absent.md") == 0


def test_art_batch_exactly_at_cap_runs(tmp_path: Path) -> None:
    assert art_budget.check(art_ledger(tmp_path, PICTURES_SPENT), PICTURES_TO_CAP, PICTURE_CAP) == LEFT_AT_CAP


def test_art_batch_one_over_cap_refused(tmp_path: Path) -> None:
    ledger = art_ledger(tmp_path, PICTURES_SPENT)
    with pytest.raises(art_budget.BudgetError) as refused:
        art_budget.check(ledger, PICTURES_TO_CAP + 1, PICTURE_CAP)
    assert str(refused.value) == "4 picture(s) would take the ledger to 11, over the cap of 10"


def test_art_record_line_is_unchanged(tmp_path: Path) -> None:
    ledger = art_ledger(tmp_path, 0)
    art_budget.record(ledger, art_budget.LedgerRow("portraits/m1", "128x128", 1, "pixen"))
    row = ledger.read_text().removeprefix(ART_HEADER)
    assert row.split("|", 2)[2] == " portraits/m1 | 128x128 | 1 | pixen | main |\n"


def test_art_dry_run_text_is_unchanged(tmp_path: Path) -> None:
    ledger = art_ledger(tmp_path, PICTURES_SPENT)
    text = pictures.dry_run([piece("lamp"), piece("desk", "rooms")], PICTURE_CAP, ledger)
    assert text == (
        "props/lamp 32x32 object\nrooms/desk 32x32 object\n2 piece(s) = 2 picture(s); ledger 7 + 2 of cap 10"
    )


def test_art_run_at_cap_draws_and_records(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(pictures, "ART_DIR", tmp_path / "art")
    ledger = art_ledger(tmp_path, PICTURES_SPENT)
    batch = [piece(f"lamp{i}") for i in range(PICTURES_TO_CAP)]
    drawn = pictures.run(batch, PICTURE_CAP, "key", lambda _body, _key: b"png", ledger)
    assert [path.name for path in drawn] == ["lamp0.png", "lamp1.png", "lamp2.png"]
    assert art_budget.spent(ledger) == PICTURE_CAP


def test_art_run_over_cap_draws_nothing(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(pictures, "ART_DIR", tmp_path / "art")
    ledger = art_ledger(tmp_path, PICTURES_SPENT)
    before = ledger.read_text()
    batch = [piece(f"lamp{i}") for i in range(PICTURES_TO_CAP + 1)]
    with pytest.raises(art_budget.BudgetError):
        pictures.run(batch, PICTURE_CAP, "key", lambda _body, _key: b"png", ledger)
    assert ledger.read_text() == before
    assert not (tmp_path / "art").exists()


# --- media: the kind cap and the total cap ----------------------------------------------------------------------


def test_media_spent_by_kind_and_total(tmp_path: Path) -> None:
    ledger = media_ledger(tmp_path)
    assert media_budget.spent(ledger, "lyria") == LYRIA_SPENT_CENTS
    assert media_budget.spent(ledger, "omni") == OMNI_SPENT_CENTS
    assert media_budget.spent(ledger) == TOTAL_SPENT_CENTS
    assert media_budget.spent(tmp_path / "absent.md") == 0


def test_media_batch_exactly_at_total_cap_runs(tmp_path: Path) -> None:
    ledger = media_ledger(tmp_path)
    left = media_budget.check(ledger, "lyria", TO_TOTAL_CAP_CENTS, KIND_CAP_CENTS, TOTAL_CAP_CENTS)
    assert left == LEFT_AT_CAP


def test_media_batch_one_cent_over_total_cap_refused(tmp_path: Path) -> None:
    ledger = media_ledger(tmp_path)
    with pytest.raises(media_budget.BudgetError) as refused:
        media_budget.check(ledger, "lyria", TO_TOTAL_CAP_CENTS + 1, KIND_CAP_CENTS, TOTAL_CAP_CENTS)
    assert str(refused.value) == "$1.01 would take the media total to $10.01, over its cap of $10.00"


def test_media_batch_exactly_at_kind_cap_runs(tmp_path: Path) -> None:
    ledger = media_ledger(tmp_path)
    roomy_total = TOTAL_CAP_CENTS * 2
    assert media_budget.check(ledger, "lyria", TO_KIND_CAP_CENTS, KIND_CAP_CENTS, roomy_total) == LEFT_AT_CAP


def test_media_batch_one_cent_over_kind_cap_refused(tmp_path: Path) -> None:
    ledger = media_ledger(tmp_path)
    roomy_total = TOTAL_CAP_CENTS * 2
    with pytest.raises(media_budget.BudgetError) as refused:
        media_budget.check(ledger, "lyria", TO_KIND_CAP_CENTS + 1, KIND_CAP_CENTS, roomy_total)
    assert str(refused.value) == "$4.01 would take lyria to $5.01, over its cap of $5.00"


def test_media_record_line_is_unchanged(tmp_path: Path) -> None:
    ledger = tmp_path / "media-ledger.md"
    ledger.write_text(MEDIA_HEADER)
    media_budget.record(ledger, media_budget.LedgerRow("omni", "sample", JOB_CENTS, "720p 6.0s"))
    row = ledger.read_text().removeprefix(MEDIA_HEADER)
    assert row.split("|", 2)[2] == " omni | sample | 0.62 | 720p 6.0s | main |\n"


def test_media_dry_run_text_is_unchanged(tmp_path: Path) -> None:
    ledger = media_ledger(tmp_path)
    cached = tmp_path / "cached.mp3"
    cached.write_bytes(b"")
    todo = [
        jobs.Job("lyria", "theme", tmp_path / "absent.mp3", (), JOB_CENTS, "song"),
        jobs.Job("lyria", "title", cached, (), JOB_CENTS, "clip"),
    ]
    text = jobs.dry_run(todo, "lyria", KIND_CAP_CENTS, TOTAL_CAP_CENTS, ledger)
    assert text == (
        "theme: song  $0.62\ntitle: clip  $0.00\n"
        "2 job(s) = $0.62; lyria $1.00 + $0.62 of cap $5.00; media total $9.00 + $0.62 of cap $10.00"
    )


# --- settings and the CLI dry runs for the one adventure there is today ----------------------------------------


def test_config_caps_are_today() -> None:
    assert art_settings.load_settings().pictures_cap == MAIN_PICTURES_CAP
    loaded = media_settings.load_settings()
    caps = (loaded.music_cap_cents, loaded.cutscenes_cap_cents, loaded.media_cap_cents)
    assert caps == (MAIN_MUSIC_CENTS, MAIN_CUTSCENES_CENTS, MAIN_MEDIA_CENTS)


def fake_spent(_ledger: Path, kind: str | None = None, **_rest: object) -> int:
    return CLI_SPENT_CENTS if kind is None else OMNI_ONLY_SPENT_CENTS


def run_cli(main: object, argv: list[str], monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(sys, "argv", argv)
    assert callable(main)
    main()


def test_art_cli_dry_run_is_unchanged(monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]) -> None:
    monkeypatch.setattr(pictures, "load_pieces", lambda *_a, **_k: [])
    monkeypatch.setattr(art_budget, "spent", fake_spent)
    run_cli(art_cli.main, ["art", "pictures"], monkeypatch)
    assert capsys.readouterr().out == "0 piece(s) = 0 picture(s); ledger 37 + 0 of cap 200\n"


@pytest.mark.parametrize(
    ("command", "expected"),
    [
        ("music", "lyria $0.00 + $0.00 of cap $5.00; media total $0.37 + $0.00 of cap $10.00"),
        ("cutscenes", "omni $0.00 + $0.00 of cap $25.00; media total $0.37 + $0.00 of cap $10.00"),
        ("image", "nano_banana $0.00 + $0.00 of cap $10.00; media total $0.37 + $0.00 of cap $10.00"),
    ],
    ids=["music_cli_caps", "cutscenes_cli_caps", "image_cli_caps"],
)
def test_media_cli_dry_run_is_unchanged(
    command: str, expected: str, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setattr(music, "load_tracks", lambda *_a, **_k: [])
    monkeypatch.setattr(cutscenes, "load_clips", lambda *_a, **_k: [])
    monkeypatch.setattr(image, "load_pictures", lambda *_a, **_k: [])
    monkeypatch.setattr(media_budget, "spent", fake_spent)
    run_cli(media_cli.main, ["media", command], monkeypatch)
    assert capsys.readouterr().out == f"0 job(s) = $0.00; {expected}\n"
