"""The picture budget: what the ledger says is spent, and whether a batch may run.

The ledger (docs/art-ledger.md) is a Markdown table; every row is one PixelLab call. The cap comes from
config.toml. A batch is allowed when spent + batch <= cap, so a batch that lands exactly on the cap runs and one
that crosses it is refused.
"""

from __future__ import annotations

import datetime as dt
from dataclasses import dataclass
from pathlib import Path

ROW_PREFIX = "| 20"  # every ledger row starts with an ISO date
PICTURES_COLUMN = 3  # | date | piece | size | pictures | note |


class BudgetError(RuntimeError):
    """The batch would cross the cap."""


@dataclass(frozen=True)
class LedgerRow:
    """One PixelLab call."""

    piece: str
    size: str
    pictures: int
    note: str

    def line(self, today: str) -> str:
        """The Markdown row."""
        return f"| {today} | {self.piece} | {self.size} | {self.pictures} | {self.note} |"


def ledger_rows(ledger: Path) -> list[str]:
    """Every call row in the ledger; none when there is no ledger yet."""
    if not ledger.exists():
        return []
    return [line for line in ledger.read_text().splitlines() if line.startswith(ROW_PREFIX)]


def row_pictures(line: str) -> int:
    """The pictures column of one ledger row."""
    return int(line.split("|")[PICTURES_COLUMN + 1].strip())


def spent(ledger: Path) -> int:
    """Pictures already spent according to the ledger."""
    return sum(row_pictures(line) for line in ledger_rows(ledger))


def check(ledger: Path, batch: int, cap: int) -> int:
    """Refuse a batch that would cross the cap; the pictures left after it otherwise."""
    used = spent(ledger)
    if used + batch > cap:
        raise BudgetError(f"{batch} picture(s) would take the ledger to {used + batch}, over the cap of {cap}")
    return cap - used - batch


def record(ledger: Path, row: LedgerRow) -> None:
    """Append one row to the ledger."""
    today = dt.datetime.now(tz=dt.UTC).date().isoformat()
    with ledger.open("a") as handle:
        handle.write(row.line(today) + "\n")
