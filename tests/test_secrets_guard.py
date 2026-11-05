"""The agent hook and the value scan that keep secrets.env from leaking."""

from pathlib import Path

import pytest

from tools.secrets_guard import decision, touches_secret
from tools.secrets_scan import leaks, load_values, parse_line

FAKE_KEY = "fake-test-value-0123456789"  # not a real key: a stand-in long enough to be compared


@pytest.mark.parametrize(
    "command",
    [
        "cat secrets.env",
        "rg KEY secrets.env",
        "cp secrets.env /tmp/x",
        "echo $(< secrets.env)",
        "uv run --env-file secrets.env python -m x && cat secrets.env",
    ],
    ids=["G1_cat_secret", "G2_search_secret", "G3_copy_secret", "G4_redirect_secret", "G5_chained_read"],
)
def test_guard_denies(command: str) -> None:
    assert touches_secret(command)
    answer = decision({"tool_input": {"command": command}})
    assert answer is not None
    assert answer["hookSpecificOutput"]["permissionDecision"] == "deny"


@pytest.mark.parametrize(
    "command",
    [
        "uv run --env-file secrets.env python -m tools.art pictures --run",
        "test -e secrets.env && echo present",
        "cp docs/secrets.env.example secrets.env.example.bak",
        "ls web",
    ],
    ids=["G6_runner_allowed", "G7_exists_allowed", "G8_template_allowed", "G9_unrelated_allowed"],
)
def test_guard_allows(command: str) -> None:
    assert decision({"tool_input": {"command": command}}) is None


def test_parse_line_reads_assignments_only() -> None:
    assert parse_line("NAME=value") == ("NAME", "value")
    assert parse_line('NAME = "value"') == ("NAME", "value")
    assert parse_line("# NAME=value") == ("", "")
    assert parse_line("") == ("", "")


def test_load_values_skips_short_and_missing(tmp_path: Path) -> None:
    env = tmp_path / "secrets.env"
    env.write_text(f"LONG_KEY={FAKE_KEY}\nSHORT=1234567\nEMPTY=\n")
    assert load_values(env) == {"LONG_KEY": FAKE_KEY}
    assert load_values(tmp_path / "missing.env") == {}


def test_leaks_names_the_file_and_secret(tmp_path: Path) -> None:
    clean = tmp_path / "clean.ts"
    clean.write_text("const x = 1;")
    dirty = tmp_path / "dirty.ts"
    dirty.write_text(f'const key = "{FAKE_KEY}";')
    secret = tmp_path / "secrets.env"
    secret.write_text(f"KEY={FAKE_KEY}")
    assert leaks([clean, dirty, secret], {"KEY": FAKE_KEY}) == [(dirty, "KEY")]
