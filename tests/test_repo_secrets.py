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


TEMPLATE = "secrets.env.example"


def is_secret_file(name: str) -> bool:
    """A secrets file, a copy of one (secrets.env.bak, secrets.env.txt) or a .env file; the template is not."""
    return name != TEMPLATE and (name in NEVER_TRACKED or name.startswith("secrets.env") or name.endswith(".env"))


def test_secret_files_are_not_tracked() -> None:
    assert not [path.name for path in tracked_files() if is_secret_file(path.name)]


@pytest.mark.parametrize(
    ("name", "secret"),
    [("secrets.env", True), ("secrets.env.txt", True), ("prod.env", True), (TEMPLATE, False), ("cast.toml", False)],
    ids=["S1_secrets_file", "S2_editor_copy", "S3_other_env", "S4_template_allowed", "S5_ordinary_file"],
)
def test_is_secret_file(name: str, secret: bool) -> None:
    assert is_secret_file(name) is secret


@pytest.mark.parametrize("shape", KEY_SHAPES, ids=["google_key", "named_secret"])
def test_no_tracked_file_holds_a_key(shape: re.Pattern[str]) -> None:
    for path in tracked_files():
        if path.suffix not in TEXT_SUFFIXES or path.name == "package-lock.json":
            continue
        assert not shape.search(path.read_text(encoding="utf-8")), f"{path.relative_to(ROOT)} looks like it holds a key"
