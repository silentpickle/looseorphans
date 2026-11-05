"""Paths and the settings this pipeline reads from config.toml."""

from __future__ import annotations

import tomllib
from dataclasses import dataclass
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent.parent
CONFIG = ROOT / "config.toml"
ART_DIR = ROOT / "web" / "public" / "assets" / "art"
SPRITES_DIR = ROOT / "web" / "public" / "assets" / "sprites"
CACHE = ROOT / ".cache" / "lpc"
ART_LEDGER = ROOT / "docs" / "art-ledger.md"
PICTURES_SPEC = ROOT / "tools" / "art" / "pixellab.toml"
CAST_SPEC = ROOT / "tools" / "art" / "cast.toml"


@dataclass(frozen=True)
class ArtSettings:
    """The `[budget]` and `[art]` tables of config.toml."""

    pictures_cap: int
    palette_colors: int
    lpc_frame: int


def budget_table(raw: dict[str, Any]) -> dict[str, Any]:
    """The caps in config.toml."""
    table: dict[str, Any] = raw["budget"]
    return table


def load_settings(path: Path = CONFIG) -> ArtSettings:
    """Read the settings file; every field is required."""
    raw = tomllib.loads(path.read_text())
    return ArtSettings(
        pictures_cap=int(budget_table(raw)["pixellab_pictures_cap"]),
        palette_colors=int(raw["art"]["palette_colors"]),
        lpc_frame=int(raw["art"]["lpc_frame"]),
    )
