"""The soundtrack from the manifest (tools/media/music.toml): plan, dry-run, generate with Lyria, trim, encode.

A track whose .ogg and .mp3 are on disk is never regenerated: delete them to redo it, and delete the raw MP3 under
.cache/media/music/ to spend on it again. Every Lyria call is one row in docs/media-ledger.md, and a batch that
would cross the music cap in config.toml is refused before any call is made.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from tools.adventure import read_manifest
from tools.media import budget, gemini, post
from tools.media.jobs import Job, batch_cents
from tools.media.settings import MEDIA_LEDGER, MUSIC_DIR, MUSIC_SPEC, RAW_DIR, MediaSettings

KIND = "lyria"
MODELS = {"clip": gemini.MUSIC_CLIP_MODEL, "song": gemini.MUSIC_SONG_MODEL}
INSTRUMENTAL = "Instrumental only, no vocals."
LOOPABLE = "Loops seamlessly: steady tempo throughout, no intro build-up and no fade-out ending."
Composer = Callable[[str, str, str], bytes]


class MusicError(RuntimeError):
    """The manifest is wrong."""


@dataclass(frozen=True)
class Track:
    """One track in the manifest."""

    id: str
    group: str
    model: str
    prompt: str
    loop: bool
    seconds: int | None
    loop_start: float
    loop_end: float | None

    @property
    def raw(self) -> Path:
        """Lyria's own MP3, kept so the encodes can be redone for free."""
        return RAW_DIR / "music" / f"{self.id}.mp3"

    @property
    def outputs(self) -> tuple[Path, Path]:
        """The two encodes the game loads."""
        return MUSIC_DIR / f"{self.id}.ogg", MUSIC_DIR / f"{self.id}.mp3"

    def full_prompt(self) -> str:
        """The prompt with the house clauses: instrumental, loopable, and the length for a song."""
        parts = [self.prompt, INSTRUMENTAL]
        if self.loop:
            parts.append(LOOPABLE)
        if self.seconds is not None:
            parts.append(f"About {self.seconds} seconds long.")
        return " ".join(parts)


def track_from(raw: dict[str, Any]) -> Track:
    """A Track from one `[[track]]` table."""
    return Track(
        id=str(raw["id"]),
        group=str(raw["group"]),
        model=str(raw["model"]),
        prompt=str(raw["prompt"]),
        loop=bool(raw.get("loop", True)),
        seconds=None if "seconds" not in raw else int(raw["seconds"]),
        loop_start=float(raw.get("loop_start", 0.0)),
        loop_end=None if "loop_end" not in raw else float(raw["loop_end"]),
    )


def check_track(track: Track) -> None:
    """The model is one Lyria has, and a clip's length is not ours to choose."""
    if track.model not in MODELS:
        raise MusicError(f"{track.id}: model must be one of {sorted(MODELS)}")
    if track.model == "clip" and track.seconds is not None:
        raise MusicError(f"{track.id}: a clip is always 30 seconds; drop `seconds`")
    if track.loop_end is not None and track.loop_end <= track.loop_start:
        raise MusicError(f"{track.id}: loop_end must come after loop_start")


def check_unique(tracks: list[Track]) -> None:
    """Ids are unique."""
    ids = [track.id for track in tracks]
    duplicates = sorted({name for name in ids if ids.count(name) > 1})
    if duplicates:
        raise MusicError(f"duplicate track ids: {duplicates}")


def load_tracks(path: Path = MUSIC_SPEC) -> list[Track]:
    """Every track in the manifest, checked."""
    tracks = [track_from(raw) for raw in read_manifest(path).get("track", [])]
    for track in tracks:
        check_track(track)
    check_unique(tracks)
    return tracks


def job_for(track: Track, settings: MediaSettings) -> Job:
    """The job that brings one track to disk."""
    cost = settings.lyria_clip_cents if track.model == "clip" else settings.lyria_song_cents
    loop = "loop" if track.loop else "once"
    return Job(KIND, track.id, track.raw, track.outputs, cost, f"{track.group} {track.model} {loop}")


def groups(tracks: list[Track]) -> dict[str, str]:
    """Id to group, for `--only`."""
    return {track.id: track.group for track in tracks}


def compose(track: Track, key: str, composer: Composer, ledger: Path, settings: MediaSettings) -> None:
    """Call Lyria for one track, cache the MP3, record the cost."""
    track.raw.parent.mkdir(parents=True, exist_ok=True)
    track.raw.write_bytes(composer(MODELS[track.model], track.full_prompt(), key))
    cost = job_for(track, settings).estimate_cents
    budget.record(ledger, budget.LedgerRow(KIND, track.id, cost, MODELS[track.model], settings.adventure))


def encode(track: Track, settings: MediaSettings) -> None:
    """Trim and encode the cached MP3 into the two files the game loads."""
    end = post.duration(track.raw) if track.loop_end is None else track.loop_end
    segment = post.Segment(track.loop_start, end, track.loop)
    post.run_all(post.audio_commands(track.raw, *track.outputs, segment, settings))


def run(
    tracks: list[Track],
    settings: MediaSettings,
    key: str,
    composer: Composer = gemini.generate_music,
    ledger: Path = MEDIA_LEDGER,
) -> list[Path]:
    """Bring every track given to disk, after the budget check; the files made."""
    jobs = [job_for(track, settings) for track in tracks]
    budget.check(
        ledger,
        KIND,
        batch_cents(jobs),
        settings.music_cap_cents,
        settings.media_cap_cents,
        adventure=settings.adventure,
    )
    made: list[Path] = []
    for track in tracks:
        if not track.raw.exists():
            compose(track, key, composer, ledger, settings)
        encode(track, settings)
        made.extend(track.outputs)
    return made
