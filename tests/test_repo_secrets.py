"""No secret and no personal file is ever tracked by git, and no tracked file holds something shaped like a key."""

import re
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
GIT = shutil.which("git")
NEVER_TRACKED = {"secrets.env", ".env", "cast.local.toml"}
KEY_SHAPES = (
    re.compile(r"AIza[0-9A-Za-z_\-]{35}"),
    re.compile(r"^[A-Z][A-Z0-9_]*(KEY|SECRET|TOKEN)\s*=\s*['\"]?[A-Za-z0-9_\-]{20,}['\"]?\s*$", re.MULTILINE),
)
TEXT_SUFFIXES = {".py", ".ts", ".toml", ".md", ".json", ".yml", ".sh", ".env", ".example", ".html", ".js"}


def tracked_files() -> list[Path]:
    """Every file git tracks; empty when this is not a git checkout."""
    if GIT is None or not (ROOT / ".git").exists():
        return []
    listing = subprocess.run(  # noqa: S603  # fixed argument list, no shell, git found with shutil.which
        [GIT, "ls-files", "-z"], cwd=ROOT, capture_output=True, check=True, text=True
    )
    return [ROOT / name for name in listing.stdout.split("\0") if name]


def test_secret_files_are_not_tracked() -> None:
    names = {path.name for path in tracked_files()}
    assert not names & NEVER_TRACKED


@pytest.mark.parametrize("shape", KEY_SHAPES, ids=["google_key", "named_secret"])
def test_no_tracked_file_holds_a_key(shape: re.Pattern[str]) -> None:
    for path in tracked_files():
        if path.suffix not in TEXT_SUFFIXES or path.name == "package-lock.json":
            continue
        assert not shape.search(path.read_text(encoding="utf-8")), f"{path.relative_to(ROOT)} looks like it holds a key"
