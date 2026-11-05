"""The ffmpeg boundary: loop trims and encodes for the soundtrack, the pixel-art pass and encodes for the cutscenes.

Command lines are built by pure functions (tested) and run by one subprocess call.
"""

from __future__ import annotations

import subprocess
from dataclasses import dataclass
from pathlib import Path

from tools.media.settings import MediaSettings

FFMPEG = "ffmpeg"
FFPROBE = "ffprobe"
QUIET = ["-hide_banner", "-loglevel", "error", "-y"]
OPUS = ["-c:a", "libopus"]
MP3 = ["-c:a", "libmp3lame"]
VP9 = ["-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0"]
H264 = ["-c:v", "libx264", "-crf", "18", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart"]
ERROR_EXCERPT = 400


class PostError(RuntimeError):
    """ffmpeg or ffprobe failed."""


@dataclass(frozen=True)
class Segment:
    """The part of a track to keep, in seconds, and whether it loops; `end` is the track's length by default."""

    start: float
    end: float
    loop: bool


def loop_filter(segment: Segment, crossfade: float) -> str:
    """Fold the last `crossfade` seconds over the head so the track loops without a seam.

    The output runs from `start` to `end - crossfade`; its opening is the tail fading out under the head fading in,
    so a jump from the end back to the start is continuous.
    """
    body_end = segment.end - crossfade
    body = f"[0:a]atrim=start={segment.start}:end={body_end},asetpts=PTS-STARTPTS,afade=t=in:st=0:d={crossfade}[body]"
    tail = f"[0:a]atrim=start={body_end}:end={segment.end},asetpts=PTS-STARTPTS,afade=t=out:st=0:d={crossfade}[tail]"
    mix = "[body][tail]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[out]"
    return f"{body};{tail};{mix}"


def trim_filter(segment: Segment, fade: float) -> str:
    """Keep one segment of a track that does not loop, fading out over its last `fade` seconds."""
    trim = f"[0:a]atrim=start={segment.start}:end={segment.end},asetpts=PTS-STARTPTS"
    return f"{trim},afade=t=out:st={segment.end - segment.start - fade}:d={fade}[out]"


def audio_command(raw: Path, out: Path, audio_filter: str, codec: list[str], bitrate_kbps: int) -> list[str]:
    """One encode of the filtered track."""
    encode = [*codec, "-b:a", f"{bitrate_kbps}k"]
    return [FFMPEG, *QUIET, "-i", str(raw), "-filter_complex", audio_filter, "-map", "[out]", *encode, str(out)]


def audio_commands(raw: Path, ogg: Path, mp3: Path, segment: Segment, settings: MediaSettings) -> list[list[str]]:
    """The two encodes of one track."""
    fold, fade = settings.loop_crossfade_seconds, settings.sting_fade_seconds
    audio_filter = loop_filter(segment, fold) if segment.loop else trim_filter(segment, fade)
    return [
        audio_command(raw, ogg, audio_filter, OPUS, settings.audio_bitrate_kbps),
        audio_command(raw, mp3, audio_filter, MP3, settings.audio_bitrate_kbps),
    ]


def pixel_filter(settings: MediaSettings) -> str:
    """Cap the frame rate, downscale with nearest neighbour, quantize to a few colours, show at 2x."""
    small = f"scale={settings.pixel_size[0]}:{settings.pixel_size[1]}:flags=neighbor"
    big = f"scale={settings.video_size[0]}:{settings.video_size[1]}:flags=neighbor"
    return ";".join(
        [
            f"[0:v]fps={settings.video_fps},{small},split[a][b]",
            f"[a]palettegen=max_colors={settings.video_colors}:stats_mode=full[p]",
            "[b][p]paletteuse=dither=none[q]",
            f"[q]{big},format=yuv420p[out]",
        ]
    )


def video_command(raw: Path, out: Path, video_filter: str, codec: list[str]) -> list[str]:
    """One silent encode of the filtered clip."""
    return [FFMPEG, *QUIET, "-i", str(raw), "-filter_complex", video_filter, "-map", "[out]", "-an", *codec, str(out)]


def video_commands(raw: Path, webm: Path, mp4: Path, settings: MediaSettings) -> list[list[str]]:
    """The two encodes of one clip."""
    video_filter = pixel_filter(settings)
    return [video_command(raw, webm, video_filter, VP9), video_command(raw, mp4, video_filter, H264)]


def probe_command(path: Path) -> list[str]:
    """Ask ffprobe for the duration in seconds."""
    show = ["-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1"]
    return [FFPROBE, "-v", "error", *show, str(path)]


def run(command: list[str]) -> str:
    """Run one ffmpeg or ffprobe command; its stdout. The only subprocess call in the media pipeline."""
    try:
        done = subprocess.run(command, check=True, capture_output=True, text=True)  # noqa: S603 fixed executable
    except subprocess.CalledProcessError as error:
        raise PostError(f"{command[0]} failed: {error.stderr[-ERROR_EXCERPT:]}") from error
    except FileNotFoundError as error:
        raise PostError(f"{command[0]} is not installed") from error
    return done.stdout


def duration(path: Path) -> float:
    """The length of a media file in seconds."""
    return float(run(probe_command(path)).strip())


def run_all(commands: list[list[str]]) -> None:
    """Run every command in order, making the output folders first."""
    for command in commands:
        Path(command[-1]).parent.mkdir(parents=True, exist_ok=True)
        run(command)
