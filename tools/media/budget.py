"""The dollar budget: what the ledger says is spent, and whether a batch may run.

The ledger (docs/media-ledger.md) is a Markdown table; every row is one Lyria, Omni or Nano Banana call with its
estimated cost, ending with the adventure it was for (a row without one is main's). Each adventure has its own caps
and counts only its own rows.
Money is handled in whole cents so sums are exact. A batch is allowed when spent + batch <= cap, both for its own
kind's cap and for the total cap over every kind: one that lands exactly on a cap runs, one that crosses it is
refused.
"""

from __future__ import annotations

import datetime as dt
from dataclasses import dataclass
from pathlib import Path

from tools.adventure import MAIN, row_adventure
from tools.media.settings import CENTS

ROW_PREFIX = "| 20"  # every ledger row starts with an ISO date
KIND_COLUMN = 2  # | date | kind | id | est. usd | note | adventure |
USD_COLUMN = 4
ANY_KIND = None


class BudgetError(RuntimeError):
    """The batch would cross the cap."""


def usd(amount_cents: int) -> str:
    """Cents as a dollar string."""
    return f"{amount_cents / CENTS:.2f}"


@dataclass(frozen=True)
class LedgerRow:
    """One paid call."""

    kind: str
    id: str
    cost_cents: int
    note: str
    adventure: str = MAIN

    def line(self, today: str) -> str:
        """The Markdown row."""
        return f"| {today} | {self.kind} | {self.id} | {usd(self.cost_cents)} | {self.note} | {self.adventure} |"


def row_cents(line: str) -> int:
    """The cost column of one ledger row, in cents."""
    return round(float(line.split("|")[USD_COLUMN].strip()) * CENTS)


def row_kind(line: str) -> str:
    """The kind column of one ledger row."""
    return line.split("|")[KIND_COLUMN].strip()


def ledger_rows(ledger: Path) -> list[str]:
    """Every call row in the ledger; none when there is no ledger yet."""
    if not ledger.exists():
        return []
    return [line for line in ledger.read_text().splitlines() if line.startswith(ROW_PREFIX)]


def adventure_rows(ledger: Path, adventure: str) -> list[str]:
    """The ledger rows spent for one adventure."""
    return [line for line in ledger_rows(ledger) if row_adventure(line) == adventure]


def spent(ledger: Path, kind: str | None = ANY_KIND, *, adventure: str = MAIN) -> int:
    """Cents already spent on one adventure according to the ledger, on one kind or on everything."""
    rows = adventure_rows(ledger, adventure)
    return sum(row_cents(line) for line in rows if kind in (ANY_KIND, row_kind(line)))


def check_one(used: int, batch_cents: int, cap_cents: int, label: str) -> int:
    """Refuse a batch that would cross one cap; the cents left after it otherwise."""
    if used + batch_cents > cap_cents:
        after = usd(used + batch_cents)
        raise BudgetError(f"${usd(batch_cents)} would take {label} to ${after}, over its cap of ${usd(cap_cents)}")
    return cap_cents - used - batch_cents


def check(  # noqa: PLR0913 - the ledger, the batch and its two caps, plus whose budget it is
    ledger: Path, kind: str, batch_cents: int, kind_cap_cents: int, total_cap_cents: int, *, adventure: str = MAIN
) -> int:
    """Refuse a batch that would cross its kind's cap or the adventure's total cap; the smaller remainder otherwise."""
    left_for_kind = check_one(spent(ledger, kind, adventure=adventure), batch_cents, kind_cap_cents, kind)
    total_spent = spent(ledger, adventure=adventure)
    left_in_total = check_one(total_spent, batch_cents, total_cap_cents, "the media total")
    return min(left_for_kind, left_in_total)


def record(ledger: Path, row: LedgerRow) -> None:
    """Append one row to the ledger."""
    today = dt.datetime.now(tz=dt.UTC).date().isoformat()
    with ledger.open("a") as handle:
        handle.write(row.line(today) + "\n")
