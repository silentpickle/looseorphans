from tools.media import settings

SIX_SECONDS = 6
# 6 s * 5792 tokens * $17.50 / 1M = $0.60816 -> 61 cents, plus the 1 cent input allowance
SIX_SECOND_CLIP_CENTS = 62
MUSIC_CAP_CENTS = 500
CUTSCENES_CAP_CENTS = 2500
MEDIA_CAP_CENTS = 1000  # $10


def test_settings_load_from_config() -> None:
    loaded = settings.load_settings()
    assert loaded.music_cap_cents == MUSIC_CAP_CENTS
    assert loaded.cutscenes_cap_cents == CUTSCENES_CAP_CENTS
    assert loaded.media_cap_cents == MEDIA_CAP_CENTS
    assert loaded.lyria_clip_cents == 4
    assert loaded.lyria_song_cents == 8
    assert loaded.pixel_size == (320, 180)
    assert loaded.video_size == (640, 360)


def test_video_cost_rounds_up_to_the_cent() -> None:
    assert settings.load_settings().video_cents(SIX_SECONDS) == SIX_SECOND_CLIP_CENTS
