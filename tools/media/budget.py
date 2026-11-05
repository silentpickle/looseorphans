"""The dollar budget: what the ledger says is spent, and whether a batch may run.

The ledger (docs/media-ledger.md) is a Markdown table; every row is one Lyria or Omni call with its estimated cost.
Money is handled in whole cents so sums are exact. A batch is allowed when spent + batch <= cap, both for its own
kind's cap and for the total cap over every kind: one that lands exactly on a cap runs, one that crosses it is
refused.
"""

from __future__ import annotations

import datetime as dt
from dataclasses import dataclass
from pathlib import Path

from tools.media.settings import CENTS

ROW_PREFIX = "| 20"  # every ledger row starts with an ISO date
KIND_COLUMN = 2  # | date | kind | id | est. usd | note |
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

    def line(self, today: str) -> str:
        """The Markdown row."""
        return f"| {today} | {self.kind} | {self.id} | {usd(self.cost_cents)} | {self.note} |"


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


def spent(ledger: Path, kind: str | None = ANY_KIND) -> int:
    """Cents already spent according to the ledger, on one kind or on everything."""
    return sum(row_cents(line) for line in ledger_rows(ledger) if kind in (ANY_KIND, row_kind(line)))


def check_one(used: int, batch_cents: int, cap_cents: int, label: str) -> int:
    """Refuse a batch that would cross one cap; the cents left after it otherwise."""
    if used + batch_cents > cap_cents:
        after = usd(used + batch_cents)
        raise BudgetError(f"${usd(batch_cents)} would take {label} to ${after}, over its cap of ${usd(cap_cents)}")
    return cap_cents - used - batch_cents


def check(ledger: Path, kind: str, batch_cents: int, kind_cap_cents: int, total_cap_cents: int) -> int:
    """Refuse a batch that would cross its kind's cap or the total cap; the smaller remainder otherwise."""
    left_for_kind = check_one(spent(ledger, kind), batch_cents, kind_cap_cents, kind)
    left_in_total = check_one(spent(ledger), batch_cents, total_cap_cents, "the media total")
    return min(left_for_kind, left_in_total)


def record(ledger: Path, row: LedgerRow) -> None:
    """Append one row to the ledger."""
    today = dt.datetime.now(tz=dt.UTC).date().isoformat()
    with ledger.open("a") as handle:
        handle.write(row.line(today) + "\n")
