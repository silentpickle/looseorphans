"""Pictures from Nano Banana (tools/media/images.toml): plan, dry-run, draw from references, key, downscale.

Nano Banana redraws a reference photo in the style of a PixelLab picture. The runner keys out the flat background
it was asked for, downscales to pixel size, and writes the PNG beside the PixelLab art; the shared palette is then
applied by `uv run python -m tools.art palette`, the same as for every PixelLab picture.

A picture whose PNG is on disk is never redrawn: delete it to redo the key and downscale for free, and delete the
raw PNG under .cache/media/image/ too to spend on it again. A picture whose references are not on disk (the photos
are gitignored) is reported and skipped. Every Nano Banana call is one row in docs/media-ledger.md, and a batch that
would cross `media_usd_cap` in config.toml is refused before any call is made: the pictures count toward the media
total and have no cap of their own.
"""

from __future__ import annotations

import io
import math
import tomllib
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image, ImageColor

from tools.media import budget, gemini
from tools.media.jobs import Job, batch_cents
from tools.media.settings import ART_DIR, IMAGES_SPEC, MEDIA_LEDGER, RAW_DIR, ROOT, MediaSettings

KIND = "nano_banana"
ASPECT_RATIOS = {"1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"}
MIME_TYPES = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png"}
HOUSE_STYLE = "No text, no letters, no logos, no watermark, no frame."
KEY_TOLERANCE = 96  # how far a background pixel may drift from the key, summed over the channels
OPAQUE = 255
CLEAR = (0, 0, 0, 0)
HALF_ALPHA = 128  # after the downscale a pixel is either kept whole or dropped: pixel art has no soft edges
Drawer = Callable[[str, list[tuple[bytes, str]], str, str], bytes]


class ImageError(RuntimeError):
    """The manifest is wrong."""


@dataclass(frozen=True)
class Picture:
    """One picture in the manifest."""

    id: str
    group: str
    prompt: str
    width: int
    height: int
    references: tuple[Path, ...]
    key: tuple[int, int, int] | None

    @property
    def raw(self) -> Path:
        """Nano Banana's own picture, kept so the key and downscale can be redone for free."""
        return RAW_DIR / "image" / f"{self.id}.png"

    @property
    def output(self) -> Path:
        """Where the finished PNG lands, beside the PixelLab pictures of its group."""
        return ART_DIR / self.group / f"{self.id}.png"

    @property
    def aspect_ratio(self) -> str:
        """`W:H` in lowest terms."""
        common = math.gcd(self.width, self.height)
        return f"{self.width // common}:{self.height // common}"

    def full_prompt(self) -> str:
        """The prompt with the background to key out and the house clauses."""
        parts = [self.prompt]
        if self.key is not None:
            parts.append(f"Plain flat solid background of the single colour {key_hex(self.key)}, nothing else on it.")
        parts.append(HOUSE_STYLE)
        return " ".join(parts)


def key_hex(color: tuple[int, int, int]) -> str:
    """`#rrggbb`."""
    return "#{:02x}{:02x}{:02x}".format(*color)


def parse_key(raw: dict[str, Any]) -> tuple[int, int, int] | None:
    """The background colour to key out, if the table names one."""
    if "key" not in raw:
        return None
    red, green, blue = ImageColor.getrgb(str(raw["key"]))[:3]
    return red, green, blue


def picture_from(raw: dict[str, Any]) -> Picture:
    """A Picture from one `[[image]]` table; references are paths from the repo root."""
    return Picture(
        id=str(raw["id"]),
        group=str(raw["group"]),
        prompt=str(raw["prompt"]),
        width=int(raw["width"]),
        height=int(raw["height"]),
        references=tuple(ROOT / str(path) for path in raw["references"]),
        key=parse_key(raw),
    )


def check_picture(picture: Picture) -> None:
    """An aspect ratio Nano Banana draws, and references it can read."""
    if picture.aspect_ratio not in ASPECT_RATIOS:
        raise ImageError(f"{picture.id}: {picture.width}x{picture.height} is not one of {sorted(ASPECT_RATIOS)}")
    if not picture.references:
        raise ImageError(f"{picture.id}: needs at least one reference picture")
    unknown = [path.name for path in picture.references if path.suffix.lower() not in MIME_TYPES]
    if unknown:
        raise ImageError(f"{picture.id}: references must be {sorted(MIME_TYPES)}, not {unknown}")


def check_unique(pictures: list[Picture]) -> None:
    """Ids are unique."""
    ids = [picture.id for picture in pictures]
    duplicates = sorted({name for name in ids if ids.count(name) > 1})
    if duplicates:
        raise ImageError(f"duplicate picture ids: {duplicates}")


def load_pictures(path: Path = IMAGES_SPEC) -> list[Picture]:
    """Every picture in the manifest, checked."""
    pictures = [picture_from(raw) for raw in tomllib.loads(path.read_text()).get("image", [])]
    for picture in pictures:
        check_picture(picture)
    check_unique(pictures)
    return pictures


def split_by_references(pictures: list[Picture]) -> tuple[list[Picture], list[Picture]]:
    """The pictures whose references are all on disk, and the ones waiting for one."""
    ready = [picture for picture in pictures if all(path.exists() for path in picture.references)]
    waiting = [picture for picture in pictures if picture not in ready]
    return ready, waiting


def job_for(picture: Picture, settings: MediaSettings) -> Job:
    """The job that brings one picture to disk."""
    summary = f"{picture.group} {picture.width}x{picture.height} from {len(picture.references)} reference(s)"
    return Job(KIND, picture.id, picture.raw, (picture.output,), settings.image_cents, summary)


def groups(pictures: list[Picture]) -> dict[str, str]:
    """Id to group, for `--only`."""
    return {picture.id: picture.group for picture in pictures}


def reference_parts(picture: Picture) -> list[tuple[bytes, str]]:
    """Each reference's bytes and media type, in manifest order."""
    return [(path.read_bytes(), MIME_TYPES[path.suffix.lower()]) for path in picture.references]


def draw(picture: Picture, key: str, drawer: Drawer, ledger: Path, settings: MediaSettings) -> None:
    """Call Nano Banana for one picture, cache it as PNG, record the cost."""
    answer = drawer(picture.full_prompt(), reference_parts(picture), picture.aspect_ratio, key)
    picture.raw.parent.mkdir(parents=True, exist_ok=True)
    Image.open(io.BytesIO(answer)).save(picture.raw, format="PNG")
    note = f"{gemini.IMAGE_MODEL} {gemini.IMAGE_SIZE} {picture.aspect_ratio}"
    budget.record(ledger, budget.LedgerRow(KIND, picture.id, settings.image_cents, note))


def crop_to_aspect(image: Image.Image, width: int, height: int) -> Image.Image:
    """The largest centred crop with the target's aspect ratio."""
    scale = min(image.width / width, image.height / height)
    crop_width, crop_height = round(width * scale), round(height * scale)
    left, top = (image.width - crop_width) // 2, (image.height - crop_height) // 2
    return image.crop((left, top, left + crop_width, top + crop_height))


def key_out(image: Image.Image, color: tuple[int, int, int]) -> Image.Image:
    """Clear the background: every pixel near the key colour, including pockets it leaves inside a shape."""
    keyed = image.convert("RGBA")
    target = (*color, OPAQUE)
    keyed.putdata([CLEAR if close(pixel, target) else pixel for pixel in keyed.get_flattened_data()])
    return keyed


def close(pixel: Any, target: tuple[int, int, int, int]) -> bool:  # noqa: ANN401 Pillow's pixel type is a union
    """The pixel is within the key tolerance of the target colour."""
    return sum(abs(int(have) - want) for have, want in zip(pixel, target, strict=True)) <= KEY_TOLERANCE


def hard_alpha(image: Image.Image) -> Image.Image:
    """Alpha snapped to fully opaque or fully clear."""
    alpha = image.getchannel("A").point(lambda value: OPAQUE if value >= HALF_ALPHA else 0)
    image.putalpha(alpha)
    return image


def finish(picture: Picture) -> None:
    """Key, crop and downscale the cached picture into the PNG the game loads."""
    image = Image.open(picture.raw).convert("RGBA")
    if picture.key is not None:
        image = key_out(image, picture.key)
    small = crop_to_aspect(image, picture.width, picture.height).resize(
        (picture.width, picture.height), Image.Resampling.BOX
    )
    picture.output.parent.mkdir(parents=True, exist_ok=True)
    hard_alpha(small).save(picture.output)


def run(
    pictures: list[Picture],
    settings: MediaSettings,
    key: str,
    drawer: Drawer = gemini.generate_image,
    ledger: Path = MEDIA_LEDGER,
) -> list[Path]:
    """Bring every picture given that is not on disk yet, after the budget check; the files made."""
    todo = [picture for picture in pictures if not picture.output.exists()]
    jobs = [job_for(picture, settings) for picture in todo]
    budget.check(ledger, KIND, batch_cents(jobs), settings.media_cap_cents, settings.media_cap_cents)
    for picture in todo:
        if not picture.raw.exists():
            draw(picture, key, drawer, ledger, settings)
        finish(picture)
    return [picture.output for picture in todo]
