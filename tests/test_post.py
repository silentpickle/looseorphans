from pathlib import Path

from tools.media import post
from tools.media.settings import load_settings

SETTINGS = load_settings()
RAW = Path("/raw/x.mp3")
OGG = Path("/out/x.ogg")
MP3 = Path("/out/x.mp3")


def test_loop_filter_folds_tail_over_head() -> None:
    graph = post.loop_filter(post.Segment(0.0, 30.0, loop=True), 1.5)
    assert "atrim=start=0.0:end=28.5" in graph
    assert "atrim=start=28.5:end=30.0" in graph
    assert "afade=t=in:st=0:d=1.5" in graph
    assert "afade=t=out:st=0:d=1.5" in graph
    assert graph.endswith("amix=inputs=2:duration=first:dropout_transition=0:normalize=0[out]")


def test_trim_filter_keeps_one_segment_and_fades_its_end() -> None:
    assert post.trim_filter(post.Segment(2.0, 10.0, loop=False), 1.0) == (
        "[0:a]atrim=start=2.0:end=10.0,asetpts=PTS-STARTPTS,afade=t=out:st=7.0:d=1.0[out]"
    )


def test_audio_commands_encode_opus_and_mp3_at_the_bitrate() -> None:
    ogg, mp3 = post.audio_commands(RAW, OGG, MP3, post.Segment(0.0, 30.0, loop=False), SETTINGS)
    assert ogg[0] == "ffmpeg"
    assert ogg[-1] == str(OGG)
    assert ogg[ogg.index("-c:a") + 1] == "libopus"
    assert mp3[mp3.index("-c:a") + 1] == "libmp3lame"
    assert ogg[ogg.index("-b:a") + 1] == "96k"
    assert ogg[ogg.index("-filter_complex") + 1] == mp3[mp3.index("-filter_complex") + 1]


def test_pixel_filter_downscales_quantizes_and_caps_fps() -> None:
    graph = post.pixel_filter(SETTINGS)
    assert graph.startswith("[0:v]fps=12,scale=320:180:flags=neighbor,split[a][b];")
    assert "palettegen=max_colors=48" in graph
    assert "paletteuse=dither=none" in graph
    assert graph.endswith("scale=640:360:flags=neighbor,format=yuv420p[out]")


def test_video_commands_are_silent_vp9_and_h264() -> None:
    webm, mp4 = post.video_commands(Path("/raw/x.mp4"), Path("/out/x.webm"), Path("/out/x.mp4"), SETTINGS)
    assert "-an" in webm
    assert "-an" in mp4
    assert webm[webm.index("-c:v") + 1] == "libvpx-vp9"
    assert mp4[mp4.index("-c:v") + 1] == "libx264"
    assert "+faststart" in mp4
    assert webm[-1].endswith(".webm")
    assert mp4[-1].endswith(".mp4")


def test_probe_command_asks_for_duration_only() -> None:
    command = post.probe_command(RAW)
    assert command[0] == "ffprobe"
    assert "format=duration" in command
    assert command[-1] == str(RAW)
