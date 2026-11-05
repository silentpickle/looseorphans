"""The art pipeline CLI.

uv run --env-file secrets.env python -m tools.art balance
uv run python -m tools.art pictures                 # dry run: what would be drawn and what it costs
uv run --env-file secrets.env python -m tools.art pictures --run [--only portraits|m1_portrait]
uv run python -m tools.art cast                     # compose the LPC figures (free)
uv run python -m tools.art palette [--only m1_]     # snap every PixelLab picture (or those ids) to the shared palette
uv run python -m tools.art manifest                 # rewrite web/public/assets/art/manifest.json from disk
uv run python -m tools.art sheets [--only group]    # contact sheets of what is on disk, in reports/art/ (free)
"""

from __future__ import annotations

import argparse

from tools.art import lpc, palette, pictures, pixellab, sheets
from tools.art.settings import ART_DIR, load_settings


def cmd_balance(_args: argparse.Namespace) -> None:
    """Print what the account has left."""
    left = pixellab.balance(pixellab.api_key())
    print(f"{left.status} {left.plan}: {left.generations} of {left.total} generations, ${left.credits_usd:.2f} credits")


def cmd_pictures(args: argparse.Namespace) -> None:
    """Dry-run or draw the missing pieces."""
    settings = load_settings()
    pieces = pictures.missing(pictures.load_pieces(), args.only)
    print(pictures.dry_run(pieces, settings.pictures_cap))
    if not args.run or not pieces:
        return
    key = pixellab.api_key()
    before = pixellab.balance(key)
    drawn = pictures.run(pieces, settings.pictures_cap, key)
    after = pixellab.balance(key)
    (ART_DIR / "CREDITS.md").write_text(pictures.credits_markdown(pictures.load_pieces()))
    pictures.write_manifest()
    print(f"drew {len(drawn)}; generations {before.generations} -> {after.generations}")


def cmd_manifest(_args: argparse.Namespace) -> None:
    """Rewrite the manifest from the pictures on disk."""
    print(pictures.write_manifest())


def cmd_sheets(args: argparse.Namespace) -> None:
    """One contact sheet per group under reports/art/."""
    for path in sheets.export(ART_DIR, args.only):
        print(path)


def cmd_cast(_args: argparse.Namespace) -> None:
    """Compose the LPC figures."""
    for path in lpc.export():
        print(path)


def cmd_palette(args: argparse.Namespace) -> None:
    """Snap every PixelLab picture, or those whose id starts with `--only`, to one palette built from all of them."""
    paths = sorted(ART_DIR.rglob("*.png"))
    shared = palette.shared_palette(paths, load_settings().palette_colors)
    chosen = [path for path in paths if path.stem.startswith(args.only or "")]
    palette.quantize_files(chosen, shared)
    print(f"quantized {len(chosen)} picture(s)")


def main() -> None:
    """Parse and dispatch."""
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("balance").set_defaults(func=cmd_balance)
    pics = commands.add_parser("pictures")
    pics.add_argument("--run", action="store_true", help="draw; without it, only report")
    pics.add_argument("--only", help="one group or one piece id")
    pics.set_defaults(func=cmd_pictures)
    commands.add_parser("cast").set_defaults(func=cmd_cast)
    shared = commands.add_parser("palette")
    shared.add_argument("--only", help="an id prefix: snap only those pictures (the palette still comes from all)")
    shared.set_defaults(func=cmd_palette)
    commands.add_parser("manifest").set_defaults(func=cmd_manifest)
    sheet = commands.add_parser("sheets")
    sheet.add_argument("--only", help="one group")
    sheet.set_defaults(func=cmd_sheets)
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
