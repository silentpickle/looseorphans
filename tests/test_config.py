"""The settings file is well formed and never holds a secret value."""

import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PICTURES_CAP = 200


def test_config_loads_and_names_secrets_only() -> None:
    config = tomllib.loads((ROOT / "config.toml").read_text())
    assert config["budget"]["pixellab_pictures_cap"] == PICTURES_CAP
    for name, note in config["secrets"].items():
        variable = note.split()[0]
        assert variable.isupper(), f"{name} must name an environment variable, not hold a value"
