"""Contact sheets: every picture of a group on one labelled grid, to look at before redrawing. Pillow only, no cost."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

from tools.art.settings import ROOT

SHEETS_DIR = ROOT / "reports" / "art"
COLUMNS = 4
GUTTER = 8
LABEL_HEIGHT = 14
BACKGROUND = (40, 40, 48, 255)
LABEL_COLOR = (230, 230, 230, 255)
MODE_RGBA = "RGBA"


def cell_size(images: list[Image.Image]) -> tuple[int, int]:
    """The grid cell: the largest picture plus a label strip."""
    width = max(image.width for image in images)
    height = max(image.height for image in images)
    return width + GUTTER, height + LABEL_HEIGHT + GUTTER


def sheet(paths: list[Path]) -> Image.Image:
    """The grid of the pictures given, each labelled with its file stem."""
    images = [Image.open(path).convert(MODE_RGBA) for path in paths]
    cell_width, cell_height = cell_size(images)
    rows = -(-len(images) // COLUMNS)
    canvas = Image.new(MODE_RGBA, (COLUMNS * cell_width, rows * cell_height), BACKGROUND)
    pen = ImageDraw.Draw(canvas)
    for index, (path, image) in enumerate(zip(paths, images, strict=True)):
        left = (index % COLUMNS) * cell_width + GUTTER // 2
        top = (index // COLUMNS) * cell_height + GUTTER // 2
        pen.text((left, top), path.stem, fill=LABEL_COLOR)
        canvas.alpha_composite(image, (left, top + LABEL_HEIGHT))
    return canvas


def export(art_dir: Path, only: str | None = None, out_dir: Path = SHEETS_DIR) -> list[Path]:
    """Write one sheet per group (or the one group named) under `out_dir`; the paths written."""
    groups = sorted(folder for folder in art_dir.iterdir() if folder.is_dir() and only in (None, folder.name))
    written: list[Path] = []
    for group in groups:
        paths = sorted(group.glob("*.png"))
        if not paths:
            continue
        out_dir.mkdir(parents=True, exist_ok=True)
        target = out_dir / f"{group.name}.png"
        sheet(paths).save(target)
        written.append(target)
    return written
