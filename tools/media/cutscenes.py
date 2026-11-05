"""The cutscenes from the manifest (tools/media/cutscenes.toml): plan, dry-run, animate, pixel pass, encode.

Gemini Omni animates each clip image-to-video from its still as the first frame.

A clip whose .webm and .mp4 are on disk is never regenerated: delete them to redo it, and delete the raw MP4 under
.cache/media/video/ to spend on it again. A clip whose still is not drawn yet is reported and skipped. Every Omni
call is one row in docs/media-ledger.md, and a batch that would cross the cutscenes cap in config.toml is refused
before any call is made.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from tools.adventure import read_manifest
from tools.media import budget, gemini, post
from tools.media.jobs import Job, batch_cents
from tools.media.settings import ART_DIR, CUTSCENES_SPEC, MEDIA_LEDGER, RAW_DIR, VIDEO_DIR, MediaSettings

KIND = "omni"
MIN_SECONDS = 3
MAX_SECONDS = 10
RESOLUTIONS = {"360p", "720p"}
DEFAULT_RESOLUTION = "720p"
HOUSE_STYLE = "No text, no captions, no subtitles, no dialogue. Keep the drawn pixel-art look of the first frame."
Animator = Callable[[str, bytes, str, str], bytes]


class CutsceneError(RuntimeError):
    """The manifest is wrong."""


@dataclass(frozen=True)
class Clip:
    """One cutscene in the manifest."""

    id: str
    group: str
    prompt: str
    seconds: int
    resolution: str
    still: Path

    @property
    def raw(self) -> Path:
        """Omni's own MP4, kept so the pixel pass can be redone for free."""
        return RAW_DIR / "video" / f"{self.id}.mp4"

    @property
    def outputs(self) -> tuple[Path, Path]:
        """The two encodes the game loads."""
        return VIDEO_DIR / f"{self.id}.webm", VIDEO_DIR / f"{self.id}.mp4"

    def full_prompt(self) -> str:
        """The prompt with the length and the house clauses."""
        return f"{self.prompt} A {self.seconds} second clip. {HOUSE_STYLE}"


def clip_from(raw: dict[str, Any]) -> Clip:
    """A Clip from one `[[clip]]` table; the still defaults to stills/<id>.png."""
    still = str(raw.get("still", f"stills/{raw['id']}.png"))
    return Clip(
        id=str(raw["id"]),
        group=str(raw["group"]),
        prompt=str(raw["prompt"]),
        seconds=int(raw["seconds"]),
        resolution=str(raw.get("resolution", DEFAULT_RESOLUTION)),
        still=ART_DIR / still,
    )


def check_clip(clip: Clip) -> None:
    """Omni's length and the resolutions worth paying for."""
    if not MIN_SECONDS <= clip.seconds <= MAX_SECONDS:
        raise CutsceneError(f"{clip.id}: seconds must be between {MIN_SECONDS} and {MAX_SECONDS}")
    if clip.resolution not in RESOLUTIONS:
        raise CutsceneError(f"{clip.id}: resolution must be one of {sorted(RESOLUTIONS)}")


def check_unique(clips: list[Clip]) -> None:
    """Ids are unique."""
    ids = [clip.id for clip in clips]
    duplicates = sorted({name for name in ids if ids.count(name) > 1})
    if duplicates:
        raise CutsceneError(f"duplicate clip ids: {duplicates}")


def load_clips(path: Path = CUTSCENES_SPEC) -> list[Clip]:
    """Every clip in the manifest, checked."""
    clips = [clip_from(raw) for raw in read_manifest(path).get("clip", [])]
    for clip in clips:
        check_clip(clip)
    check_unique(clips)
    return clips


def split_by_still(clips: list[Clip]) -> tuple[list[Clip], list[Clip]]:
    """The clips whose still is drawn, and the ones still waiting for it."""
    ready = [clip for clip in clips if clip.still.exists()]
    waiting = [clip for clip in clips if not clip.still.exists()]
    return ready, waiting


def job_for(clip: Clip, settings: MediaSettings) -> Job:
    """The job that brings one clip to disk."""
    cost = settings.video_cents(clip.seconds)
    return Job(KIND, clip.id, clip.raw, clip.outputs, cost, f"{clip.group} {clip.seconds}s {clip.resolution}")


def groups(clips: list[Clip]) -> dict[str, str]:
    """Id to group, for `--only`."""
    return {clip.id: clip.group for clip in clips}


def animate(clip: Clip, key: str, animator: Animator, ledger: Path, settings: MediaSettings) -> None:
    """Call Omni for one clip, cache the MP4, record the cost of the length it actually returned."""
    clip.raw.parent.mkdir(parents=True, exist_ok=True)
    clip.raw.write_bytes(animator(clip.full_prompt(), clip.still.read_bytes(), clip.resolution, key))
    seconds = post.duration(clip.raw)
    note = f"{gemini.VIDEO_MODEL} {clip.resolution} {seconds:.1f}s"
    budget.record(ledger, budget.LedgerRow(KIND, clip.id, settings.video_cents(seconds), note, settings.adventure))


def encode(clip: Clip, settings: MediaSettings) -> None:
    """The pixel-art pass and the two encodes from the cached MP4."""
    post.run_all(post.video_commands(clip.raw, *clip.outputs, settings))


def run(
    clips: list[Clip],
    settings: MediaSettings,
    key: str,
    animator: Animator = gemini.generate_video,
    ledger: Path = MEDIA_LEDGER,
) -> list[Path]:
    """Bring every clip given to disk, after the budget check; the files made."""
    jobs = [job_for(clip, settings) for clip in clips]
    budget.check(
        ledger,
        KIND,
        batch_cents(jobs),
        settings.cutscenes_cap_cents,
        settings.media_cap_cents,
        adventure=settings.adventure,
    )
    made: list[Path] = []
    for clip in clips:
        if not clip.raw.exists():
            animate(clip, key, animator, ledger, settings)
        encode(clip, settings)
        made.extend(clip.outputs)
    return made
