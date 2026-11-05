from pathlib import Path

from PIL import Image

from tools.art import sheets

PICTURES = 5
SIZE = (32, 32)


def test_sheet_grid_fits_every_picture(tmp_path: Path) -> None:
    art = tmp_path / "art"
    (art / "props").mkdir(parents=True)
    for index in range(PICTURES):
        Image.new("RGBA", SIZE, (255, 0, 0, 255)).save(art / "props" / f"p{index}.png")
    (art / "empty").mkdir()

    written = sheets.export(art, out_dir=tmp_path / "reports")

    assert [path.name for path in written] == ["props.png"]
    with Image.open(written[0]) as image:
        rows = -(-PICTURES // sheets.COLUMNS)
        assert image.size == (
            sheets.COLUMNS * (SIZE[0] + sheets.GUTTER),
            rows * (SIZE[1] + sheets.LABEL_HEIGHT + sheets.GUTTER),
        )


def test_only_narrows_to_one_group(tmp_path: Path) -> None:
    art = tmp_path / "art"
    for group in ("a", "b"):
        (art / group).mkdir(parents=True)
        Image.new("RGBA", SIZE).save(art / group / "x.png")
    assert [path.stem for path in sheets.export(art, "b", tmp_path / "r")] == ["b"]
