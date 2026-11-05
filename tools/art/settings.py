"""Paths and the settings this pipeline reads from config.toml."""

from __future__ import annotations

import tomllib
from dataclasses import dataclass
from pathlib import Path

from tools.adventure import MAIN, budget_table, manifest_dir

ROOT = Path(__file__).resolve().parent.parent.parent
CONFIG = ROOT / "config.toml"
ART_DIR = ROOT / "web" / "public" / "assets" / "art"
SPRITES_DIR = ROOT / "web" / "public" / "assets" / "sprites"
CACHE = ROOT / ".cache" / "lpc"
ART_LEDGER = ROOT / "docs" / "art-ledger.md"
TOOL_DIR = ROOT / "tools" / "art"
PICTURES_SPEC = TOOL_DIR / "pixellab.toml"
PICTURES_SPEC_NAME = PICTURES_SPEC.name
CREDITS_NAME = "CREDITS.md"
CAST_SPEC = ROOT / "tools" / "art" / "cast.toml"


@dataclass(frozen=True)
class ArtSettings:
    """One adventure's `[budget.<id>]` table and the `[art]` table of config.toml."""

    pictures_cap: int
    palette_colors: int
    lpc_frame: int
    adventure: str = MAIN


def pictures_spec(adventure: str = MAIN) -> Path:
    """An adventure's PixelLab manifest."""
    return manifest_dir(TOOL_DIR, adventure) / PICTURES_SPEC_NAME


def credits_path(adventure: str = MAIN) -> Path:
    """Where an adventure's PixelLab credits are written: main's keep `CREDITS.md`, so no run overwrites another's."""
    if adventure == MAIN:
        return ART_DIR / CREDITS_NAME
    return ART_DIR / f"CREDITS-{adventure}.md"


def load_settings(path: Path = CONFIG, adventure: str = MAIN) -> ArtSettings:
    """Read the settings file for one adventure; every field is required."""
    raw = tomllib.loads(path.read_text())
    return ArtSettings(
        pictures_cap=int(budget_table(raw, adventure)["pixellab_pictures_cap"]),
        palette_colors=int(raw["art"]["palette_colors"]),
        lpc_frame=int(raw["art"]["lpc_frame"]),
        adventure=adventure,
    )
