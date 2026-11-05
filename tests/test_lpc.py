from pathlib import Path

import pytest

from tools.art import lpc


def test_rows_cover_four_directions_and_hurt() -> None:
    names = [row.name for row in lpc.rows()]
    assert names[:4] == ["walk_up", "walk_left", "walk_down", "walk_right"]
    assert names[-1] == "hurt"
    assert len(names) == len(lpc.FOUR_WAY) * len(lpc.DIRECTIONS) + 1


def test_frame_box_is_64px_grid() -> None:
    assert lpc.frame_box(0, 0) == (0, 0, 64, 64)
    assert lpc.frame_box(10, 2) == (128, 640, 192, 704)


def test_walk_down_is_row_ten() -> None:
    walk_down = next(row for row in lpc.rows() if row.name == "walk_down")
    assert walk_down.sheet_row == 10
    assert walk_down.frames == 9


def test_atlas_lists_rows_and_figures() -> None:
    out = lpc.atlas([lpc.Figure("m1", ("body/bodies/male/light",))])
    assert out["figures"] == {"m1": "m1.png"}
    assert out["rows"]["walk_down"] == {"row": 2, "frames": 9}
    assert out["columns"] == 9


def test_cast_manifest_loads() -> None:
    source, figures = lpc.load_cast()
    assert source.ref
    assert figures[0].id == "m1"


def test_chapter_cast_files_are_read_and_ids_stay_unique(tmp_path: Path) -> None:
    main = tmp_path / "cast.toml"
    main.write_text('[source]\nrepo = "r"\nref = "x"\n[[figure]]\nid = "m1"\nlayers = ["a"]\n')
    (tmp_path / "cast").mkdir()
    (tmp_path / "cast" / "ch3.toml").write_text('[[figure]]\nid = "m1_hanbok"\nlayers = ["b"]\n')
    _source, figures = lpc.load_cast(main)
    assert [f.id for f in figures] == ["m1", "m1_hanbok"]
    (tmp_path / "cast" / "ch4.toml").write_text('[[figure]]\nid = "m1"\nlayers = ["c"]\n')
    with pytest.raises(lpc.LayerError):
        lpc.load_cast(main)
