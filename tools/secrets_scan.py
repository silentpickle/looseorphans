"""Stop a real key from leaving this machine: look for the values in secrets.env inside every file git would commit.

uv run python -m tools.secrets_scan                  # tracked and staged files
uv run python -m tools.secrets_scan --also web/dist  # and a built site

Shape checks (tests/test_repo_secrets.py) catch what looks like a key; this catches the exact keys you own, whatever
their shape, wherever they were pasted. It reports the file and the secret's NAME, never its value. With no
secrets.env (CI, a fresh clone) there is nothing to compare and it passes.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SECRETS = ROOT / "secrets.env"
MIN_VALUE_LENGTH = 8  # shorter values (a placeholder, "true") would match by accident
COMMENT = "#"
ASSIGN = "="
QUOTES = "\"'"


def load_values(path: Path) -> dict[str, str]:
    """NAME -> value for every real-looking assignment in an env file; empty when the file is missing."""
    if not path.exists():
        return {}
    values: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        name, value = parse_line(line)
        if len(value) >= MIN_VALUE_LENGTH:
            values[name] = value
    return values


def parse_line(line: str) -> tuple[str, str]:
    """One `NAME=value` line as (name, value); ("", "") for a blank line, a comment or anything else."""
    text = line.strip()
    if not text or text.startswith(COMMENT) or ASSIGN not in text:
        return "", ""
    name, value = text.split(ASSIGN, 1)
    return name.strip(), value.strip().strip(QUOTES)


def git_files(root: Path) -> list[Path]:
    """Every file git tracks or has staged; empty outside a git checkout."""
    git = shutil.which("git")
    if git is None or not (root / ".git").exists():
        return []
    listing = subprocess.run(  # noqa: S603  # fixed argument list, no shell, git found with shutil.which
        [git, "ls-files", "-z", "--cached"], cwd=root, capture_output=True, check=True, text=True
    )
    return [root / name for name in listing.stdout.split("\0") if name]


def files_under(folder: Path) -> list[Path]:
    """Every file below a folder (a built site); empty when it does not exist."""
    if not folder.is_dir():
        return []
    return [path for path in folder.rglob("*") if path.is_file()]


def leaks(files: list[Path], values: dict[str, str]) -> list[tuple[Path, str]]:
    """(file, secret NAME) for every file that contains a secret's value."""
    found: list[tuple[Path, str]] = []
    encoded = {name: value.encode() for name, value in values.items()}
    for path in files:
        if path.name == SECRETS.name or not path.is_file():
            continue
        content = path.read_bytes()
        found.extend((path, name) for name, value in encoded.items() if value in content)
    return found


def main() -> None:
    """Scan, report by name only, and fail on any leak."""
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--also", action="append", default=[], help="another folder to scan, e.g. web/dist")
    args = parser.parse_args()
    values = load_values(SECRETS)
    files = git_files(ROOT) + [path for folder in args.also for path in files_under(ROOT / folder)]
    found = leaks(files, values)
    for path, name in found:
        print(f"LEAK: {path.relative_to(ROOT)} contains the value of {name} from secrets.env")
    if found:
        print("Remove the key from those files (git restore --staged <file> to unstage), then revoke and replace it.")
        sys.exit(1)
    print(f"secrets: ok ({len(values)} key(s) compared against {len(files)} file(s))")


if __name__ == "__main__":
    main()
