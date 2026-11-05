from pathlib import Path

import pytest

from tools.media import budget

HEADER = "# Media ledger\n\n| Date | Kind | Id | Est. USD | Note |\n|---|---|---|---|---|\n"
CAP_CENTS = 500  # $5.00
TOTAL_CAP_CENTS = 1000  # $10.00
ROW_CENTS = 4  # $0.04
KIND = "lyria"


def ledger_with(tmp_path: Path, rows: int, other_kind_cents: int = 0) -> Path:
    path = tmp_path / "ledger.md"
    body = "".join(f"| 2026-11-02 | lyria | t{i} | 0.04 | clip |\n" for i in range(rows))
    other = f"| 2026-11-02 | omni | clip | {other_kind_cents / 100:.2f} | 720p |\n" if other_kind_cents else ""
    path.write_text(HEADER + body + other)
    return path


def test_missing_ledger_has_spent_nothing() -> None:
    assert budget.spent(Path("/nonexistent/ledger.md")) == 0


def test_spent_sums_usd_column_in_exact_cents(tmp_path: Path) -> None:
    assert budget.spent(ledger_with(tmp_path, 3)) == 3 * ROW_CENTS


def test_spent_can_count_one_kind_only(tmp_path: Path) -> None:
    ledger = ledger_with(tmp_path, 3, other_kind_cents=63)
    assert budget.spent(ledger, "lyria") == 3 * ROW_CENTS
    assert budget.spent(ledger, "omni") == 63
    assert budget.spent(ledger) == 3 * ROW_CENTS + 63


def test_batch_landing_exactly_on_kind_cap_is_allowed(tmp_path: Path) -> None:
    ledger = ledger_with(tmp_path, 100)  # $4.00
    assert budget.check(ledger, KIND, CAP_CENTS - 100 * ROW_CENTS, CAP_CENTS, TOTAL_CAP_CENTS) == 0


def test_batch_crossing_kind_cap_by_one_cent_is_refused(tmp_path: Path) -> None:
    ledger = ledger_with(tmp_path, 100)
    with pytest.raises(budget.BudgetError):
        budget.check(ledger, KIND, CAP_CENTS - 100 * ROW_CENTS + 1, CAP_CENTS, TOTAL_CAP_CENTS)


def test_other_kind_does_not_count_against_kind_cap(tmp_path: Path) -> None:
    ledger = ledger_with(tmp_path, 100, other_kind_cents=400)  # $4.00 lyria + $4.00 omni
    assert budget.check(ledger, KIND, 50, CAP_CENTS, TOTAL_CAP_CENTS) == 50, "the kind cap leaves $0.50"


def test_batch_landing_exactly_on_total_cap_is_allowed(tmp_path: Path) -> None:
    ledger = ledger_with(tmp_path, 25, other_kind_cents=800)  # $1.00 lyria + $8.00 omni
    assert budget.check(ledger, KIND, 100, CAP_CENTS, TOTAL_CAP_CENTS) == 0


def test_batch_crossing_total_cap_is_refused_under_kind_cap(tmp_path: Path) -> None:
    ledger = ledger_with(tmp_path, 25, other_kind_cents=800)
    with pytest.raises(budget.BudgetError):
        budget.check(ledger, KIND, 101, CAP_CENTS, TOTAL_CAP_CENTS)


def test_record_appends_a_row(tmp_path: Path) -> None:
    path = ledger_with(tmp_path, 0)
    budget.record(path, budget.LedgerRow("omni", "sample_ongsang", 62, "720p 6.0s"))
    assert budget.spent(path) == 62
    assert "| omni | sample_ongsang | 0.62 |" in path.read_text()
