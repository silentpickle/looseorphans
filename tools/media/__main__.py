"""The media pipeline CLI.

uv run python -m tools.media music                        # dry run: what would be composed and what it costs
uv run --env-file secrets.env python -m tools.media music --run [--only theme|title]
uv run python -m tools.media cutscenes                    # dry run, listing the clips whose still is not drawn yet
uv run --env-file secrets.env python -m tools.media cutscenes --run [--only trope|ch1_declaration]
uv run python -m tools.media image                        # dry run, listing the pictures whose references are missing
uv run --env-file secrets.env python -m tools.media image --run [--only portraits|picture_id]
uv run python -m tools.media music --adventure stay       # another adventure: its own caps, ledger rows and manifests
"""

from __future__ import annotations

import argparse

from tools.adventure import MAIN, checked_id
from tools.media import cutscenes, gemini, image, jobs, music
from tools.media.settings import CUTSCENES_SPEC, IMAGES_SPEC, MEDIA_LEDGER, MUSIC_SPEC, load_settings, spec


def key_for(todo: list[jobs.Job]) -> str:
    """The API key, needed only when the batch spends; a re-encode from cache runs without secrets."""
    return gemini.api_key() if jobs.batch_cents(todo) else ""


def cmd_music(args: argparse.Namespace) -> None:
    """Dry-run or compose one adventure's missing tracks."""
    settings = load_settings(adventure=args.adventure)
    tracks = music.load_tracks(spec(MUSIC_SPEC, args.adventure))
    todo = jobs.pending([music.job_for(track, settings) for track in tracks], args.only, music.groups(tracks))
    caps = (settings.music_cap_cents, settings.media_cap_cents)
    print(jobs.dry_run(todo, music.KIND, *caps, MEDIA_LEDGER, adventure=args.adventure))
    if not args.run or not todo:
        return
    chosen = [track for track in tracks if track.id in {job.id for job in todo}]
    for path in music.run(chosen, settings, key_for(todo)):
        print(path)


def cmd_cutscenes(args: argparse.Namespace) -> None:
    """Dry-run or animate one adventure's missing clips whose still is drawn."""
    settings = load_settings(adventure=args.adventure)
    ready, waiting = cutscenes.split_by_still(cutscenes.load_clips(spec(CUTSCENES_SPEC, args.adventure)))
    for clip in waiting:
        print(f"{clip.id}: still not drawn yet ({clip.still.relative_to(clip.still.parents[2])}), skipped")
    todo = jobs.pending([cutscenes.job_for(clip, settings) for clip in ready], args.only, cutscenes.groups(ready))
    caps = (settings.cutscenes_cap_cents, settings.media_cap_cents)
    print(jobs.dry_run(todo, cutscenes.KIND, *caps, MEDIA_LEDGER, adventure=args.adventure))
    if not args.run or not todo:
        return
    chosen = [clip for clip in ready if clip.id in {job.id for job in todo}]
    for path in cutscenes.run(chosen, settings, key_for(todo)):
        print(path)


def cmd_image(args: argparse.Namespace) -> None:
    """Dry-run or draw one adventure's missing pictures whose references are on disk."""
    settings = load_settings(adventure=args.adventure)
    ready, waiting = image.split_by_references(image.load_pictures(spec(IMAGES_SPEC, args.adventure)))
    for picture in waiting:
        missing = [path.name for path in picture.references if not path.exists()]
        print(f"{picture.id}: reference(s) not on disk ({', '.join(missing)}), skipped")
    todo = jobs.pending([image.job_for(picture, settings) for picture in ready], args.only, image.groups(ready))
    caps = (settings.images_cap_cents, settings.media_cap_cents)
    print(jobs.dry_run(todo, image.KIND, *caps, MEDIA_LEDGER, adventure=args.adventure))
    if not args.run or not todo:
        return
    chosen = [picture for picture in ready if picture.id in {job.id for job in todo}]
    for path in image.run(chosen, settings, key_for(todo)):
        print(path)


def add_runner(commands: argparse._SubParsersAction[argparse.ArgumentParser], name: str, func: object) -> None:
    """A subcommand that dry-runs by default."""
    parser = commands.add_parser(name)
    parser.add_argument("--run", action="store_true", help="spend; without it, only report")
    parser.add_argument("--only", help="one group or one id")
    parser.add_argument("--adventure", type=checked_id, default=MAIN, help="whose caps and manifests (default main)")
    parser.set_defaults(func=func)


def main() -> None:
    """Parse and dispatch."""
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    commands = parser.add_subparsers(dest="command", required=True)
    add_runner(commands, "music", cmd_music)
    add_runner(commands, "cutscenes", cmd_cutscenes)
    add_runner(commands, "image", cmd_image)
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
