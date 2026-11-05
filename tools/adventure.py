"""Which adventure a generation run spends for: its id, its ledger rows and its manifest folder.

Every adventure has its own caps in `config.toml [budget.<id>]` and its own rows in the shared ledgers, told apart
by a last `adventure` column. A row written before that column existed belongs to `main`. The manifests of `main`
stay where they always were; any other adventure keeps its own under `<tool dir>/adventures/<id>/`.
"""

from __future__ import annotations

import re
import tomllib
from pathlib import Path
from typing import Any

MAIN = "main"
ADVENTURE_CELL = 6  # "| date | a | b | c | note | adventure |".split("|")[6]
ID_PATTERN = re.compile(r"[a-z][a-z0-9_]*")
ADVENTURES_DIR = "adventures"


class AdventureError(ValueError):
    """An adventure id that cannot name a folder or a budget table."""


def checked_id(adventure: str) -> str:
    """The id itself, once it is lowercase letters, digits and underscores (so it can only name one folder)."""
    if not ID_PATTERN.fullmatch(adventure):
        raise AdventureError(f"adventure id {adventure!r} must be lowercase letters, digits and underscores")
    return adventure


def row_adventure(line: str) -> str:
    """The adventure a ledger row was spent for; `main` for a row from before the column."""
    cells = line.split("|")
    if len(cells) <= ADVENTURE_CELL + 1:
        return MAIN
    return cells[ADVENTURE_CELL].strip() or MAIN


def manifest_dir(tool_dir: Path, adventure: str) -> Path:
    """Where an adventure's manifests live: the tool's own folder for `main`, `adventures/<id>/` otherwise."""
    if adventure == MAIN:
        return tool_dir
    return tool_dir / ADVENTURES_DIR / checked_id(adventure)


def read_manifest(path: Path) -> dict[str, Any]:
    """A TOML manifest, or an empty one when the file is not there yet (an adventure with nothing to make)."""
    if not path.exists():
        return {}
    return tomllib.loads(path.read_text())


def budget_table(raw: dict[str, Any], adventure: str) -> dict[str, Any]:
    """The `[budget.<id>]` table of a parsed config.toml."""
    tables: dict[str, Any] = raw["budget"]
    if checked_id(adventure) not in tables:
        raise AdventureError(f"config.toml has no [budget.{adventure}] table")
    table: dict[str, Any] = tables[adventure]
    return table
