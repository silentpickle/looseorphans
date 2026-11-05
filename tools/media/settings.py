"""Paths and the settings the media pipeline reads from config.toml."""

from __future__ import annotations

import math
import tomllib
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CONFIG = ROOT / "config.toml"
ASSETS = ROOT / "web" / "public" / "assets"
MUSIC_DIR = ASSETS / "music"
VIDEO_DIR = ASSETS / "video"
ART_DIR = ASSETS / "art"
RAW_DIR = ROOT / ".cache" / "media"  # the API's own output, kept so post-processing can be redone for free
MEDIA_LEDGER = ROOT / "docs" / "media-ledger.md"
MUSIC_SPEC = ROOT / "tools" / "media" / "music.toml"
CUTSCENES_SPEC = ROOT / "tools" / "media" / "cutscenes.toml"
IMAGES_SPEC = ROOT / "tools" / "media" / "images.toml"
CENTS = 100
MILLION = 1_000_000


@dataclass(frozen=True)
class MediaSettings:
    """The `[budget]` caps and the `[media]` table of config.toml, money in whole cents."""

    music_cap_cents: int
    cutscenes_cap_cents: int
    media_cap_cents: int
    lyria_clip_cents: int
    lyria_song_cents: int
    omni_tokens_per_second: int
    omni_usd_per_million_tokens: float
    omni_input_cents: int
    image_cents: int
    audio_bitrate_kbps: int
    loop_crossfade_seconds: float
    sting_fade_seconds: float
    video_fps: int
    video_colors: int
    pixel_size: tuple[int, int]
    video_size: tuple[int, int]

    def video_cents(self, seconds: float) -> int:
        """What one clip of `seconds` costs, rounded up to the cent."""
        tokens = seconds * self.omni_tokens_per_second
        usd = tokens * self.omni_usd_per_million_tokens / MILLION
        return self.omni_input_cents + math.ceil(usd * CENTS)


def cents(usd: float) -> int:
    """Whole cents from a dollar amount."""
    return round(usd * CENTS)


def load_settings(path: Path = CONFIG) -> MediaSettings:
    """Read the settings file; every field is required."""
    raw = tomllib.loads(path.read_text())
    budget, media = raw["budget"], raw["media"]
    return MediaSettings(
        music_cap_cents=cents(float(budget["music_usd_cap"])),
        cutscenes_cap_cents=cents(float(budget["cutscenes_usd_cap"])),
        media_cap_cents=cents(float(budget["media_usd_cap"])),
        lyria_clip_cents=cents(float(media["lyria_clip_usd"])),
        lyria_song_cents=cents(float(media["lyria_song_usd"])),
        omni_tokens_per_second=int(media["omni_tokens_per_second"]),
        omni_usd_per_million_tokens=float(media["omni_usd_per_million_tokens"]),
        omni_input_cents=cents(float(media["omni_input_usd"])),
        image_cents=cents(float(media["image_usd"])),
        audio_bitrate_kbps=int(media["audio_bitrate_kbps"]),
        loop_crossfade_seconds=float(media["loop_crossfade_seconds"]),
        sting_fade_seconds=float(media["sting_fade_seconds"]),
        video_fps=int(media["video_fps"]),
        video_colors=int(media["video_colors"]),
        pixel_size=(int(media["pixel_width"]), int(media["pixel_height"])),
        video_size=(int(media["video_width"]), int(media["video_height"])),
    )
