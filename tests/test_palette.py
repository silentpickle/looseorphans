import math
from pathlib import Path

from PIL import Image

from tools.art import palette


def test_apply_keeps_alpha_and_snaps_colors() -> None:
    image = Image.new("RGBA", (2, 1))
    image.putdata([(250, 0, 0, 255), (0, 0, 250, 0)])
    pal = Image.new("RGB", (2, 1))
    pal.putdata([(255, 0, 0), (0, 0, 255)])
    snapped = palette.apply(image, pal.quantize(colors=2))
    assert snapped.getpixel((0, 0)) == (255, 0, 0, 255)
    faded = snapped.getpixel((1, 0))
    assert isinstance(faded, tuple)
    assert faded[3] == 0


def test_opaque_pixels_ignores_transparent() -> None:
    image = Image.new("RGBA", (2, 1))
    image.putdata([(1, 2, 3, 255), (9, 9, 9, 0)])
    strip = palette.opaque_pixels(image)
    assert strip.size == (1, 1)
    assert strip.getpixel((0, 0)) == (1, 2, 3)


BIG_SIDE = 160
SMALL_SIDE = 8
COLORS = 8
PURPLE = (150, 60, 200)
NEAR = 40  # how far a snapped colour may drift, as RGB distance, and still read as itself


def write_dark_scene(path: Path) -> None:
    """A big picture of many dark blue-greys, the kind that used to take every palette slot."""
    image = Image.new("RGBA", (BIG_SIDE, BIG_SIDE))
    image.putdata([(x // 4, y // 4, (x + y) // 6, 255) for y in range(BIG_SIDE) for x in range(BIG_SIDE)])
    image.save(path)


def test_small_picture_keeps_its_colour_beside_a_big_scene(tmp_path: Path) -> None:
    scene = tmp_path / "scene.png"
    write_dark_scene(scene)
    badge = tmp_path / "badge.png"
    Image.new("RGBA", (SMALL_SIDE, SMALL_SIDE), (*PURPLE, 255)).save(badge)

    shared = palette.shared_palette([scene, badge], COLORS)
    snapped = palette.apply(Image.open(badge), shared).getpixel((0, 0))

    assert isinstance(snapped, tuple)
    assert math.dist(snapped[:3], PURPLE) < NEAR


def test_sample_gives_every_picture_the_same_weight() -> None:
    small = Image.new("RGB", (SMALL_SIDE, 1))
    big = Image.new("RGB", (BIG_SIDE * BIG_SIDE, 1))
    assert palette.sample(small).size == palette.sample(big).size == (palette.SAMPLE_PIXELS, 1)
