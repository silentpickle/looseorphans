"""What the two runners share: a job is one id with a cached raw output, final outputs, and a cost.

A job whose outputs are all on disk is done and never touched again. One whose raw API output is cached costs
nothing more: only the post-processing runs. Only a job with no raw output spends money.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from tools.adventure import MAIN
from tools.media import budget


@dataclass(frozen=True)
class Job:
    """One track or clip to bring to disk."""

    kind: str
    id: str
    raw: Path
    outputs: tuple[Path, ...]
    estimate_cents: int
    summary: str

    @property
    def done(self) -> bool:
        """Every output is on disk."""
        return all(path.exists() for path in self.outputs)

    @property
    def cost_cents(self) -> int:
        """What running it would spend: nothing when the raw output is cached."""
        return 0 if self.raw.exists() else self.estimate_cents


def pending(jobs: list[Job], only: str | None, groups: dict[str, str]) -> list[Job]:
    """The jobs not yet done, optionally one group or one id."""
    wanted = [job for job in jobs if only in (None, job.id, groups.get(job.id))]
    return [job for job in wanted if not job.done]


def batch_cents(jobs: list[Job]) -> int:
    """What a batch would spend."""
    return sum(job.cost_cents for job in jobs)


def dry_run(  # noqa: PLR0913 - the batch, its two caps and the ledger, plus whose budget it is
    jobs: list[Job], kind: str, cap_cents: int, total_cap_cents: int, ledger: Path, *, adventure: str = MAIN
) -> str:
    """What a run would make and cost against one adventure's caps, without making anything."""
    cost = batch_cents(jobs)
    used_kind, used_all = budget.spent(ledger, kind, adventure=adventure), budget.spent(ledger, adventure=adventure)
    lines = [f"{job.id}: {job.summary}  ${budget.usd(job.cost_cents)}" for job in jobs]
    lines.append(
        f"{len(jobs)} job(s) = ${budget.usd(cost)}; {kind} ${budget.usd(used_kind)} + ${budget.usd(cost)}"
        f" of cap ${budget.usd(cap_cents)}; media total ${budget.usd(used_all)} + ${budget.usd(cost)}"
        f" of cap ${budget.usd(total_cap_cents)}"
    )
    return "\n".join(lines)
