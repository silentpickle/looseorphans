"""One shared palette for every PixelLab picture, so they read as one game next to the LPC cast.

Every picture gives the palette the same number of pixels, so a 32px prop counts as much as a 320x180 backdrop and
its colours keep a slot. Pillow's octree over that montage gives the palette; each picture is then quantized to it
without dithering, keeping its alpha. Runs locally and costs nothing.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

MODE_RGB = "RGB"
MODE_RGBA = "RGBA"
MODE_PALETTE = "P"
NO_DITHER = Image.Dither.NONE
ALPHA_BAND = 3
BANDS = 4
OPAQUE = 255
SAMPLE_PIXELS = 4096  # pixels each picture gives the palette, whatever its size


def opaque_pixels(image: Image.Image) -> Image.Image:
    """The RGB of every opaque pixel, as a one-row image (transparent pixels would poison the palette)."""
    raw = image.convert(MODE_RGBA).tobytes()
    starts = range(0, len(raw), BANDS)
    pixels = [tuple(raw[start : start + ALPHA_BAND]) for start in starts if raw[start + ALPHA_BAND] == OPAQUE]
    strip = Image.new(MODE_RGB, (max(len(pixels), 1), 1))
    strip.putdata(pixels)
    return strip


def sample(strip: Image.Image) -> Image.Image:
    """The strip resized to SAMPLE_PIXELS, evenly spaced, so every picture weighs the same in the palette."""
    return strip.resize((SAMPLE_PIXELS, 1), Image.Resampling.NEAREST)


def shared_palette(paths: list[Path], colors: int) -> Image.Image:
    """A palette image built from an equal sample of the opaque pixels of every picture given."""
    strips = [sample(opaque_pixels(Image.open(path))) for path in paths]
    montage = Image.new(MODE_RGB, (SAMPLE_PIXELS * len(strips), 1))
    for index, strip in enumerate(strips):
        montage.paste(strip, (index * SAMPLE_PIXELS, 0))
    return montage.quantize(colors=colors, method=Image.Quantize.FASTOCTREE, dither=NO_DITHER)


def apply(image: Image.Image, palette: Image.Image) -> Image.Image:
    """The image snapped to the palette, alpha kept."""
    rgba = image.convert(MODE_RGBA)
    snapped = rgba.convert(MODE_RGB).quantize(palette=palette, dither=NO_DITHER).convert(MODE_RGB)
    snapped.putalpha(rgba.getchannel("A"))
    return snapped


def quantize_files(paths: list[Path], palette: Image.Image) -> None:
    """Snap every file in place."""
    for path in paths:
        apply(Image.open(path), palette).save(path)
