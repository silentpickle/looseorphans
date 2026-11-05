# Prompts, and what they taught

Every prompt that made the game lives in a manifest you can read, run and edit. This page quotes a few and says what
each one taught. Rule zero for all of them: **no real person's, artist's, band's, song's or show's name in any prompt.**
Describe what you want to see or hear instead.

Prompts are one input among several: the runner adds the size, the seed and the style from the manifest, and a dry run
(`uv run python -m tools.art pictures`) shows what would be drawn before any money is spent.

## PixelLab pictures (`tools/art/pixellab.toml`)

What worked:

- **Fix the camera and the layout in words.** Map backdrops say "camera looking steeply down" and "the walkable floor
  fills the lower two thirds of the image", so a character can later be drawn on the floor.
- **Ask for emptiness.** "completely empty ... nothing on the ground and no people" gives clean stages to place
  characters and props on yourself.
- **End every prompt with the same style sentence** ("clean 16-bit JRPG pixel art, flat lighting"), keep a `seed` in
  the manifest, and the set stays one coherent game.
- **Portraits:** a bust, a facing direction ("facing slightly left"), a distinctive silhouette (hair, hood, ears) and a
  caption of the genre ("JRPG dialogue portrait").
- **Then squash the palette.** One shared palette for every picture (`tools.art palette`) matters more than any single
  prompt. 48 colours greyed the purples and greens; 128 kept them.

**`dorm` (backdrops, 320x180, seed 101)**

> pixel art of a cozy modern apartment living room shared by a boy band at night, camera looking steeply down, a small kitchen counter with an oven and a tray of brownies along the top wall, a sofa and a tv against the top wall, string lights, bunk beds visible through a door, warm lamp light, completely empty wooden floor with nothing on the ground and no people, the walkable floor fills the lower two thirds of the image, clean 16-bit JRPG pixel art, flat lighting

**`rooftop_battle` (battles, 320x180, seed 201)**

> pixel art battle background of a city apartment rooftop at night, side view, a flat concrete roof in the bottom third, a parapet wall, a glowing city skyline and a full moon with storm clouds gathering, a ring light on a tripod at one side, no people, clean 16-bit JRPG pixel art, flat lighting

**`m1` (portraits, 128x128, seed 143)**

> pixel art portrait bust of a cute young Korean man, fluffy black hair with a soft fringe, round cheeks, bright eyes, wearing an orange hoodie with small quokka ears on the hood, JRPG dialogue portrait, facing slightly left, clean 16-bit style

**`jester` (portraits, 128x128, seed 411)**

> pixel art portrait bust of a creepy villain in a purple and black jester costume with a bell hat, a white theatre mask with a painted grin, gloved hand raised, JRPG dialogue portrait, facing slightly left, clean 16-bit JRPG pixel art, flat lighting

**`shatter` (stills, 320x180, seed 301)**

> pixel art cinematic scene on a city rooftop at night, side view, a glowing golden barrier of light shaped like a dome cracking and shattering into shards over the skyline, a tall demon executive in a black suit with small horns standing with one hand raised, eight young men in hoodies being blown back and scattered, dramatic purple lightning, clean 16-bit JRPG pixel art, flat lighting

## Music (`tools/media/music.toml`)

Lyria takes a prompt and nothing else (no seed, no lyrics field, no negative prompt). What worked:

- **Genre, instruments, mood, tempo, key, era.** That is the whole vocabulary. Never an artist, band, song or show.
- The runner appends "instrumental only", a loopable-ending clause and the length. Loops are made afterwards by folding
  the tail over the head with a short crossfade.
- Name the *job* of the track ("title theme", "boss battle", "world-map theme") and give each its own character, so a
  game's themes do not blur together.

**`title` (theme, song, 90 s)**

> Grand nostalgic title theme for a 16-bit era console role-playing game: soaring strings, a warm brass melody, harp arpeggios and a soft timpani roll, hopeful and bittersweet, slow build, orchestral chiptune hybrid.

**`battle` (theme, song, 75 s)**

> Fast energetic combat theme for a 16-bit console role-playing game: a funky driving bass line, a punchy electric guitar riff, synth brass accents, rolling drums at 150 bpm, heroic and urgent.

**`boss` (theme, song, 75 s)**

> Tense orchestral boss battle theme: pounding timpani, ominous low choir-like synth pads, urgent string ostinato, brass fanfares, 140 bpm, minor key, 16-bit era game soundtrack feel.

## Cutscenes (`tools/media/cutscenes.toml`)

Cutscenes are image-to-video: the drawn still is the first frame, so the prompt only describes **motion**. What worked:

- Say what moves and how the camera moves ("slow motion, a slight camera shake", "the camera slowly pushes in"), not
  what the picture already shows.
- Six seconds per clip keeps a whole set affordable (see the cost in the dry run).
- The model adds audio; the pipeline drops it and re-quantizes every frame to the shared pixel look, so the clip
  matches the art.

**`shatter` (prologue, 6 s)**

> The glowing golden dome cracks further and bursts into shards that fly outward, purple lightning flashes, the figure in the black suit raises his hand as the eight young men in hoodies are pushed back across the rooftop, slow motion, a slight camera shake.

**`declaration` (trope, 6 s)**

> The police officer calls out with his arms wide as small red hearts pulse and float up around him, the woman in the apron hides her blushing face, the two older women in the doorway whisper to each other, red camellia petals drift, sunset light, the camera slowly pushes in.

## Sprites (`tools/art/cast.toml`)

The walking characters are not generated from prompts at all: each is a list of Liberated Pixel Cup layers (body, head,
hair, clothes, ears, tails) composed by script, so it is free, repeatable and consistent. Tell the characters apart at
64 pixels by hair shape and colour and one signature outfit colour.
