"""The picture budget: what the ledger says is spent, and whether a batch may run.

The ledger (docs/art-ledger.md) is a Markdown table; every row is one PixelLab call, ending with the adventure it
was for (a row without one is main's). Each adventure's cap comes from config.toml and counts only its own rows.
A batch is allowed when spent + batch <= cap, so a batch that lands exactly on the cap runs and one that crosses it
is refused.
"""

from __future__ import annotations

import datetime as dt
from dataclasses import dataclass
from pathlib import Path

from tools.adventure import MAIN, row_adventure

ROW_PREFIX = "| 20"  # every ledger row starts with an ISO date
PICTURES_COLUMN = 3  # | date | piece | size | pictures | note | adventure |


class BudgetError(RuntimeError):
    """The batch would cross the cap."""


@dataclass(frozen=True)
class LedgerRow:
    """One PixelLab call."""

    piece: str
    size: str
    pictures: int
    note: str
    adventure: str = MAIN

    def line(self, today: str) -> str:
        """The Markdown row."""
        return f"| {today} | {self.piece} | {self.size} | {self.pictures} | {self.note} | {self.adventure} |"


def ledger_rows(ledger: Path) -> list[str]:
    """Every call row in the ledger; none when there is no ledger yet."""
    if not ledger.exists():
        return []
    return [line for line in ledger.read_text().splitlines() if line.startswith(ROW_PREFIX)]


def row_pictures(line: str) -> int:
    """The pictures column of one ledger row."""
    return int(line.split("|")[PICTURES_COLUMN + 1].strip())


def spent(ledger: Path, *, adventure: str = MAIN) -> int:
    """Pictures already spent on one adventure according to the ledger."""
    return sum(row_pictures(line) for line in ledger_rows(ledger) if row_adventure(line) == adventure)


def check(ledger: Path, batch: int, cap: int, *, adventure: str = MAIN) -> int:
    """Refuse a batch that would cross the adventure's cap; the pictures left after it otherwise."""
    used = spent(ledger, adventure=adventure)
    if used + batch > cap:
        raise BudgetError(f"{batch} picture(s) would take the ledger to {used + batch}, over the cap of {cap}")
    return cap - used - batch


def record(ledger: Path, row: LedgerRow) -> None:
    """Append one row to the ledger."""
    today = dt.datetime.now(tz=dt.UTC).date().isoformat()
    with ledger.open("a") as handle:
        handle.write(row.line(today) + "\n")
