"""Compose the cast from Liberated Pixel Cup (LPC) layers: free, licensed, and already animated.

Reads tools/art/cast.toml, downloads each named layer sheet once from the pinned Universal LPC Spritesheet
Character Generator commit, stacks the layers, and writes one sheet per figure with the rows the game needs
(walk, idle, slash, spellcast, thrust in four directions; hurt), plus an atlas and a CREDITS file. The browser
knows nothing about LPC. Costs no PixelLab pictures.

Row layout of the universal sheet (64px frames), verified by rendering: spellcast 0-3, thrust 4-7, walk 8-11,
slash 12-15, shoot 16-19, hurt 20; that is the 21-row base sheet most clothing has. Rows of a four-direction
animation go up, left, down, right. Walk column 0 is the standing pose, so idle is cut from there.
"""

from __future__ import annotations

import csv
import json
import tomllib
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image

from tools.art.settings import CACHE, CAST_SPEC, SPRITES_DIR

RAW = "https://raw.githubusercontent.com/{repo}/{ref}/{path}"
FRAME = 64
BASE_ROWS = 21  # spellcast, thrust, walk, slash, shoot and hurt; every layer has at least these
BASE_HEIGHT = FRAME * BASE_ROWS
FETCH_TIMEOUT_SECONDS = 30
DIRECTIONS = {"up": 0, "left": 1, "down": 2, "right": 3}
HURT_ROW = 20
WALK_ROW = 8
# name -> (first row facing up, frames)
FOUR_WAY = {
    "walk": (WALK_ROW, 9),
    "idle": (WALK_ROW, 1),
    "slash": (12, 6),
    "spellcast": (0, 7),
    "thrust": (4, 8),
}
HURT_FRAMES = 6
COLUMNS = max(frames for _row, frames in FOUR_WAY.values())
ATLAS_SCHEMA = "sprites/1"
CAST_DIR = "cast"  # one file per chapter: tools/art/cast/ch3.toml and so on


class LayerError(RuntimeError):
    """A layer could not be fetched or is not an extended LPC sheet."""


@dataclass(frozen=True)
class Source:
    """The pinned generator commit."""

    repo: str
    ref: str


@dataclass(frozen=True)
class Figure:
    """One character: layers back to front."""

    id: str
    layers: tuple[str, ...]


@dataclass(frozen=True)
class Row:
    """One row of the output sheet."""

    name: str
    sheet_row: int
    frames: int


def rows() -> list[Row]:
    """The output rows, in order."""
    out: list[Row] = []
    for name, (first, frames) in FOUR_WAY.items():
        out.extend(Row(f"{name}_{direction}", first + offset, frames) for direction, offset in DIRECTIONS.items())
    out.append(Row("hurt", HURT_ROW, HURT_FRAMES))
    return out


def figures_in(raw: dict[str, Any]) -> list[Figure]:
    """The `[[figure]]` tables of one cast file."""
    entries = raw.get("figure", [])
    return [Figure(id=str(entry["id"]), layers=tuple(str(layer) for layer in entry["layers"])) for entry in entries]


def load_cast(path: Path = CAST_SPEC) -> tuple[Source, list[Figure]]:
    """The source from cast.toml, and every figure in it plus each chapter's own file in cast/ beside it."""
    raw = tomllib.loads(path.read_text())
    source = Source(repo=str(raw["source"]["repo"]), ref=str(raw["source"]["ref"]))
    figures = figures_in(raw)
    for extra in sorted((path.parent / CAST_DIR).glob("*.toml")):
        figures.extend(figures_in(tomllib.loads(extra.read_text())))
    ids = [figure.id for figure in figures]
    duplicates = sorted({name for name in ids if ids.count(name) > 1})
    if duplicates:
        raise LayerError(f"figure ids used twice: {duplicates}")
    return source, figures


def fetch(source: Source, path: str) -> Path:
    """Download one file from the pinned commit into the cache, once. The only network call here."""
    target = CACHE / source.ref / path
    if target.exists():
        return target
    target.parent.mkdir(parents=True, exist_ok=True)
    url = RAW.format(repo=source.repo, ref=source.ref, path=path)
    try:
        with urllib.request.urlopen(url, timeout=FETCH_TIMEOUT_SECONDS) as response:  # noqa: S310 pinned https url
            target.write_bytes(response.read())
    except urllib.error.URLError as error:
        raise LayerError(f"could not fetch {path}: {error}") from error
    return target


def layer_image(source: Source, layer: str) -> Image.Image:
    """One layer sheet, checked for the base rows."""
    image = Image.open(fetch(source, f"spritesheets/{layer}.png")).convert("RGBA")
    if image.height < BASE_HEIGHT:
        raise LayerError(f"{layer} is {image.height}px tall; it lacks the base rows")
    return image


def frame_box(sheet_row: int, column: int) -> tuple[int, int, int, int]:
    """The crop box of one frame on a universal sheet."""
    top = sheet_row * FRAME
    left = column * FRAME
    return (left, top, left + FRAME, top + FRAME)


def paste_row(sheet: Image.Image, out: Image.Image, row: Row, index: int) -> None:
    """Composite one layer's frames of one row onto the output."""
    for column in range(row.frames):
        cell = sheet.crop(frame_box(row.sheet_row, column))
        out.alpha_composite(cell, (column * FRAME, index * FRAME))


def compose(source: Source, figure: Figure) -> Image.Image:
    """Stack the layers (first at the back) into one output sheet."""
    layout = rows()
    out = Image.new("RGBA", (FRAME * COLUMNS, FRAME * len(layout)))
    for layer in figure.layers:
        sheet = layer_image(source, layer)
        for index, row in enumerate(layout):
            paste_row(sheet, out, row, index)
    return out


def atlas(figures: list[Figure]) -> dict[str, Any]:
    """What the browser needs to cut the sheets."""
    layout = rows()
    return {
        "schema": ATLAS_SCHEMA,
        "frame": FRAME,
        "columns": COLUMNS,
        "rows": {row.name: {"row": index, "frames": row.frames} for index, row in enumerate(layout)},
        "figures": {figure.id: f"{figure.id}.png" for figure in figures},
    }


def credit_rows(source: Source) -> list[dict[str, str]]:
    """The generator's CREDITS.csv."""
    with fetch(source, "CREDITS.csv").open(newline="") as handle:
        return list(csv.DictReader(handle))


def credit_for(credit_table: list[dict[str, str]], layer: str) -> dict[str, str] | None:
    """The credits row whose filename is the longest prefix of the layer path (rows name directories)."""
    matches = [row for row in credit_table if row["filename"] and layer.startswith(row["filename"])]
    if not matches:
        return None
    return max(matches, key=lambda row: len(row["filename"]))


def credit_line(credit_table: list[dict[str, str]], layer: str) -> str:
    """One Markdown row of the credits table."""
    row = credit_for(credit_table, layer)
    if row is None:
        return f"| {layer} | (no credits row) | | |"
    urls = [row[key] for key in row if key.startswith("url") and row[key]]
    return f"| {layer} | {row['authors']} | {row['licenses']} | {' '.join(urls)} |"


def credits_markdown(source: Source, layers: set[str]) -> str:
    """The credits file for every layer used."""
    credit_table = credit_rows(source)
    lines = [
        "# Sprite credits",
        "",
        (
            "Figures are composed from Liberated Pixel Cup (LPC) layers in the Universal LPC Spritesheet Character "
            f"Generator (https://github.com/{source.repo}, commit `{source.ref}`). Each layer keeps its own licence; "
            "the strictest terms here are CC-BY-SA 3.0 and GPL 3.0, which require attribution and share-alike for "
            "the art. Generated by `tools/art/lpc.py`."
        ),
        "",
        "| Layer | Authors | Licences | Source |",
        "|---|---|---|---|",
    ]
    lines.extend(credit_line(credit_table, layer) for layer in sorted(layers))
    return "\n".join(lines) + "\n"


def export(path: Path = CAST_SPEC, out_dir: Path = SPRITES_DIR) -> list[Path]:
    """Compose every figure; the sheets written."""
    source, figures = load_cast(path)
    out_dir.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    used: set[str] = set()
    for figure in figures:
        target = out_dir / f"{figure.id}.png"
        compose(source, figure).save(target)
        written.append(target)
        used.update(figure.layers)
    (out_dir / "atlas.json").write_text(json.dumps(atlas(figures), indent=2) + "\n")
    (out_dir / "CREDITS.md").write_text(credits_markdown(source, used))
    return written
