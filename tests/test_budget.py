from pathlib import Path

import pytest

from tools.art import budget

HEADER = "# Art ledger\n\n| Date | Piece | Size | Pictures | Note |\n|---|---|---|---|---|\n"
CAP = 10


def ledger_with(tmp_path: Path, rows: int) -> Path:
    path = tmp_path / "ledger.md"
    body = "".join(f"| 2026-11-02 | p{i} | 32x32 | 1 | pixen |\n" for i in range(rows))
    path.write_text(HEADER + body)
    return path


def test_spent_counts_rows() -> None:
    assert budget.spent(Path("/nonexistent/ledger.md")) == 0


def test_spent_sums_pictures_column(tmp_path: Path) -> None:
    assert budget.spent(ledger_with(tmp_path, 3)) == 3


def test_batch_landing_exactly_on_cap_is_allowed(tmp_path: Path) -> None:
    assert budget.check(ledger_with(tmp_path, 7), 3, CAP) == 0


def test_batch_crossing_cap_is_refused(tmp_path: Path) -> None:
    with pytest.raises(budget.BudgetError):
        budget.check(ledger_with(tmp_path, 7), 4, CAP)


def test_record_appends_a_row(tmp_path: Path) -> None:
    path = ledger_with(tmp_path, 0)
    budget.record(path, budget.LedgerRow("portraits/m1", "128x128", 1, "pixen"))
    assert budget.spent(path) == 1
    assert "portraits/m1" in path.read_text()
