"""PixelLab pictures from the manifest (tools/art/pixellab.toml): plan, dry-run, draw, record.

A piece already on disk is never redrawn: delete its PNG to draw it again. Every drawn piece is one row in
docs/art-ledger.md, and a batch that would cross the cap in config.toml is refused before any call is made.
"""

from __future__ import annotations

import json
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image

from tools.adventure import MAIN, read_manifest
from tools.art import budget, pixellab
from tools.art.settings import ART_DIR, ART_LEDGER, PICTURES_SPEC

MANIFEST_NAME = "manifest.json"
MANIFEST_INDENT = 2

SIDE_MULTIPLE = 4  # Pixen wants each side divisible by four
SQUARE_BELOW = 32  # and a square canvas when either side is smaller than this
MIN_SIDE = 16
MAX_AREA = 512 * 512
MAX_TRANSPARENT_AREA = 256 * 256
PICTURES_PER_PIECE = 1
KINDS = {"scene": False, "object": True}  # kind -> transparent background
VIEWS = {"side", "low top-down", "high top-down"}
DETAILS = {"low detail", "medium detail", "highly detailed"}
DEFAULT_DETAIL = "highly detailed"

Drawer = Callable[[dict[str, Any], str], bytes]


class PictureError(RuntimeError):
    """The manifest is wrong."""


@dataclass(frozen=True)
class Piece:
    """One picture in the manifest."""

    id: str
    group: str
    kind: str
    width: int
    height: int
    prompt: str
    seed: int
    view: str | None
    detail: str

    @property
    def path(self) -> Path:
        """Where the PNG lands."""
        return ART_DIR / self.group / f"{self.id}.png"

    @property
    def size(self) -> str:
        """`WxH`."""
        return f"{self.width}x{self.height}"

    def request_body(self) -> dict[str, Any]:
        """The Pixen request."""
        body: dict[str, Any] = {
            "description": self.prompt,
            "image_size": {"width": self.width, "height": self.height},
            "no_background": KINDS[self.kind],
            "detail": self.detail,
            "seed": self.seed,
        }
        if self.view is not None:
            body["view"] = self.view
        return body


def piece_from(raw: dict[str, Any]) -> Piece:
    """A Piece from one `[[piece]]` table."""
    return Piece(
        id=str(raw["id"]),
        group=str(raw["group"]),
        kind=str(raw["kind"]),
        width=int(raw["width"]),
        height=int(raw["height"]),
        prompt=str(raw["prompt"]),
        seed=int(raw.get("seed", 0)),
        view=None if "view" not in raw else str(raw["view"]),
        detail=str(raw.get("detail", DEFAULT_DETAIL)),
    )


def check_kind(piece: Piece) -> None:
    """Kind, view and detail must be ones Pixen knows."""
    if piece.kind not in KINDS:
        raise PictureError(f"{piece.id}: kind must be one of {sorted(KINDS)}")
    if piece.view is not None and piece.view not in VIEWS:
        raise PictureError(f"{piece.id}: view must be one of {sorted(VIEWS)}")
    if piece.detail not in DETAILS:
        raise PictureError(f"{piece.id}: detail must be one of {sorted(DETAILS)}")


def check_size(piece: Piece) -> None:
    """Pixen's canvas rules."""
    width, height = piece.width, piece.height
    if min(width, height) < MIN_SIDE:
        raise PictureError(f"{piece.id}: each side must be at least {MIN_SIDE}")
    if width % SIDE_MULTIPLE or height % SIDE_MULTIPLE:
        raise PictureError(f"{piece.id}: width and height must be multiples of {SIDE_MULTIPLE}")
    if min(width, height) < SQUARE_BELOW and width != height:
        raise PictureError(f"{piece.id}: a side under {SQUARE_BELOW} needs a square canvas")
    limit = MAX_TRANSPARENT_AREA if KINDS[piece.kind] else MAX_AREA
    if width * height > limit:
        raise PictureError(f"{piece.id}: {piece.size} is over the {limit} pixel limit for a {piece.kind}")


def check_unique(pieces: list[Piece]) -> None:
    """Ids are unique."""
    ids = [piece.id for piece in pieces]
    duplicates = sorted({name for name in ids if ids.count(name) > 1})
    if duplicates:
        raise PictureError(f"duplicate piece ids: {duplicates}")


def load_pieces(path: Path = PICTURES_SPEC) -> list[Piece]:
    """Every piece in the manifest, checked."""
    pieces = [piece_from(raw) for raw in read_manifest(path).get("piece", [])]
    for piece in pieces:
        check_kind(piece)
        check_size(piece)
    check_unique(pieces)
    return pieces


def missing(pieces: list[Piece], only: str | None = None) -> list[Piece]:
    """The pieces not yet on disk, optionally one group or id."""
    wanted = [piece for piece in pieces if only in (None, piece.group, piece.id)]
    return [piece for piece in wanted if not piece.path.exists()]


def dry_run(pieces: list[Piece], cap: int, ledger: Path = ART_LEDGER, *, adventure: str = MAIN) -> str:
    """What a run would draw and cost against one adventure's cap, without drawing."""
    cost = len(pieces) * PICTURES_PER_PIECE
    used = budget.spent(ledger, adventure=adventure)
    lines = [f"{piece.group}/{piece.id} {piece.size} {piece.kind}" for piece in pieces]
    lines.append(f"{len(pieces)} piece(s) = {cost} picture(s); ledger {used} + {cost} of cap {cap}")
    return "\n".join(lines)


def draw(piece: Piece, key: str, drawer: Drawer, ledger: Path, adventure: str = MAIN) -> Path:
    """Draw one piece, write it, record it against its adventure."""
    piece.path.parent.mkdir(parents=True, exist_ok=True)
    piece.path.write_bytes(drawer(piece.request_body(), key))
    row = budget.LedgerRow(f"{piece.group}/{piece.id}", piece.size, PICTURES_PER_PIECE, "pixen", adventure)
    budget.record(ledger, row)
    return piece.path


def run(  # noqa: PLR0913 - the batch, its cap, the key, the drawer and the ledger, plus whose budget it is
    pieces: list[Piece],
    cap: int,
    key: str,
    drawer: Drawer = pixellab.pixen,
    ledger: Path = ART_LEDGER,
    *,
    adventure: str = MAIN,
) -> list[Path]:
    """Draw every piece given, after the adventure's budget check; the paths drawn."""
    budget.check(ledger, len(pieces) * PICTURES_PER_PIECE, cap, adventure=adventure)
    return [draw(piece, key, drawer, ledger, adventure) for piece in pieces]


def credits_markdown(pieces: list[Piece]) -> str:
    """The credits file for every PixelLab piece."""
    lines = [
        "# Art credits: PixelLab pictures",
        "",
        (
            "Drawn by PixelLab's Pixen model (https://pixellab.ai) from the prompts below, under the PixelLab "
            "account's terms of service; the project keeps the output. Prompts and seeds live in "
            "`tools/art/pixellab.toml`."
        ),
        "",
        "| Piece | Kind | Size | Seed | Prompt |",
        "|---|---|---|---|---|",
    ]
    for piece in pieces:
        prompt = piece.prompt.replace("|", "\\|")
        lines.append(f"| {piece.group}/{piece.id} | {piece.kind} | {piece.size} | {piece.seed} | {prompt} |")
    return "\n".join(lines) + "\n"


def png_size(path: Path) -> tuple[int, int]:
    """Width and height of a PNG on disk."""
    with Image.open(path) as image:
        width, height = image.size
    return width, height


def manifest_entries(art_dir: Path) -> dict[str, list[dict[str, int | str]]]:
    """Every PNG under `<art_dir>/<group>/`, by group: `{group: [{id, width, height}]}`."""
    groups: dict[str, list[dict[str, int | str]]] = {}
    for png in sorted(art_dir.glob("*/*.png")):
        width, height = png_size(png)
        groups.setdefault(png.parent.name, []).append({"id": png.stem, "width": width, "height": height})
    return groups


def write_manifest(art_dir: Path = ART_DIR) -> Path:
    """Write `<art_dir>/manifest.json` from the pictures on disk, so the game needs no hard-coded lists."""
    target = art_dir / MANIFEST_NAME
    target.write_text(json.dumps(manifest_entries(art_dir), indent=MANIFEST_INDENT) + "\n")
    return target
