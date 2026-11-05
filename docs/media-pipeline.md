# Media pipeline: Lyria soundtrack and Gemini Omni cutscenes

`tools/media/` makes the soundtrack and the cutscenes the same way `tools/art/` makes the pictures: a TOML manifest,
a dry run that prints the count and the cost, dollar caps in `config.toml [budget.<adventure>]` (one per kind and
`media_usd_cap` over them all) that the runner refuses to cross, every call appended to `docs/media-ledger.md` with
the adventure it was for, and a file already on disk never regenerated. `--adventure <id>` (default `main`) picks
whose caps, ledger rows and manifests a run uses; any adventure but `main` keeps its manifests in
`tools/media/adventures/<id>/`, and a missing manifest is an empty batch.

## Commands

```bash
uv run python -m tools.media music                     # dry run: every track not yet on disk, with its cost
uv run --env-file secrets.env python -m tools.media music --run --only title
uv run python -m tools.media cutscenes                 # dry run; clips whose still is not drawn are listed and skipped
uv run --env-file secrets.env python -m tools.media cutscenes --run --only trope
```

```bash
uv run python -m tools.media image                     # dry run; pictures whose reference photos are missing are skipped
uv run --env-file secrets.env python -m tools.media image --run --only picture_id
uv run python -m tools.art palette --only picture_prefix_   # then the shared palette, as for PixelLab art
```

`--only` takes a group (`theme`, `sting`, `location`; `sample`, `prologue`, `trope`, `ending`, `finale`) or one id.

## What is on disk

| Stage | Music | Cutscenes |
|---|---|---|
| Manifest | `tools/media/music.toml` | `tools/media/cutscenes.toml` |
| Raw API output (gitignored, free to re-process) | `.cache/media/music/<id>.mp3` | `.cache/media/video/<id>.mp4` |
| What the game loads | `web/public/assets/music/<id>.ogg` + `.mp3` | `web/public/assets/video/<id>.webm` + `.mp4` |

Delete the two game files to redo the post-processing for free. Delete the raw file too to call the API again
(that spends and writes a ledger row).

## The API, as checked on 2026-11-02

Both models answer on the Gemini API's Interactions endpoint (`POST /v1beta/interactions`, header
`Api-Revision: 2026-05-20`), which `tools/media/gemini.py` wraps. It is the only network module.

- **Lyria.** `lyria-3-clip-preview` makes a 30 s clip for $0.04; `lyria-3.5` makes a full song for $0.08, its
  length asked for in the prompt. The call is synchronous and returns MP3 inline. No seed, lyrics, duration or
  negative-prompt fields exist; the runner appends "Instrumental only", a loopable clause and the length to the
  prompt.
- **Veo 3.1 was shut down on the Gemini API on 2026-10-22.** Its replacement is `gemini-omni-1.1-flash`, which does
  image-to-video from a still as the first frame, 3 to 10 s at 24 fps, 16:9, 360p to 4K. It is billed per output
  token: 5,792 tokens per second of 720p at $17.50 per million, about $0.10 a second, plus the input still. The
  runner estimates with the manifest's `seconds` before the budget check and records the length ffprobe measures
  afterwards. The model always adds audio; the pixel pass drops it. There is no lite or fast tier any more.

- **Nano Banana** (checked 2026-11-03 at https://aistudio.google.com/docs/image-generation and the pricing page).
  `gemini-nano-banana-2.1` (Nano Banana 2.1, the stable model the docs recommend) takes a text prompt plus up to 14
  reference images (`{"type": "image", "mime_type", "data"}` blocks in `input`) and returns one image block;
  `response_format` carries `aspect_ratio` and `image_size` (`1K`, `2K`, `4K`). A 1K picture is 1120 output tokens
  at $30 per million, $0.0336; input is $1.50 per million. The runner budgets $0.04 a picture (`image_usd`). The
  pictures have no cap of their own: they count toward `media_usd_cap`. Every image carries Google's SynthID
  watermark.

Prices and token rates live in `config.toml [media]`; update them there when the pricing page changes.

## Post-processing (ffmpeg, `tools/media/post.py`)

- **Loops** fold the last `loop_crossfade_seconds` over the head so the jump from the end to the start is
  continuous. `loop_start` / `loop_end` in the manifest trim the kept part; set them after listening. Stings
  (`loop = false`) are trimmed and faded out over `sting_fade_seconds`.
- **Encodes:** `.ogg` is Opus and `.mp3` is LAME, both at `audio_bitrate_kbps` (this ffmpeg build has no
  libvorbis; Opus in Ogg plays in Chrome and Firefox, and Safari takes the MP3).
- **Clips:** frame rate capped at `video_fps`, nearest-neighbour downscale to `pixel_width x pixel_height`, every
  frame quantized to `video_colors` colours with a palette built from the clip, then nearest-neighbour upscale to
  `video_width x video_height`; VP9 WebM and H.264 MP4, no audio track.

## Pictures (Nano Banana, `tools/media/image.py`)

`tools/media/images.toml` lists each picture with its reference images (paths from the repo root, sent in order after
the prompt). The raw answer is cached as `.cache/media/image/<id>.png`; the runner then clears the flat `key`
background the prompt asked for (flood-filled from the edges), crops to the aspect ratio, box-downscales to
`width x height`, snaps alpha to on/off, and writes `web/public/assets/art/<group>/<id>.png` beside the PixelLab art.
`tools.art palette --only <prefix>` then puts it on the shared palette. Reference photos live in `tools/art/refs/`,
which is gitignored and never shipped; a picture whose reference is missing is listed and skipped.
