# Loose Orphans: Legend of Minsung

A roughly 70-minute FF6-style browser RPG: a fictional boy band flung across parody worlds. Independent,
non-commercial, fictional. Read `docs/story-bible.md` before writing any content and `docs/design.md` before touching
systems. Romance stays chaste; no lyrics, logos or real audio anywhere.

## Where things live
- `web/` Vite + TypeScript + Phaser 3. Scenes in `src/scenes/`, rules in `src/systems/`, content as typed data in
  `src/data/`. Maps are an ASCII grid over a painted backdrop; no tilesets.
- `tools/art/` Python (uv): PixelLab runner (`pixellab.toml`), LPC composer (`cast.toml` there), palette quantizer.
- `tools/media/` Python (uv): Lyria music (`music.toml`), Gemini Omni cutscenes (`cutscenes.toml`), Nano Banana pictures
  (`images.toml`), ffmpeg post.
- `config.toml` every setting and budget cap, no secrets. Read it before changing behaviour a setting could control.
- `cast.toml` every name, pet and in-joke. Story text holds `{tokens}` (`{m1}`, `{m2.pet}`, `{meter}`) that
  `web/src/cast.ts` fills in; add a key there rather than writing a name into the story. `cast.local.toml` is the
  maintainer's gitignored override: never create it for them, never commit it.
- `docs/adventures/README.md` the index of adventures (one engine, several games) and the checklist for adding one.
- `docs/` every other Markdown file. The repo root holds only `README.md`, `CLAUDE.md` and `LICENSE`.

## Secrets
- `secrets.env` holds the keys. **Never open, print, search or copy it.** The names of the secrets, and what each is
  for, are in `config.toml [secrets]`. To add one: add its name there, and ask the human to put the value in
  `secrets.env` (a template is `docs/secrets.env.example`). Never ask for a key in chat, and never put one in code,
  config, a prompt or a commit message.
- Run tools with `uv run --env-file secrets.env python -m tools.art ...` so a key only reaches the process that needs it.

## Rules of the road
- **Budgets.** The runners refuse any batch that would cross a cap in `config.toml [budget]`. Always run the dry run
  first and show the human the count and the cost; add `--run` only after they say yes. Every call is appended to
  `docs/art-ledger.md` or `docs/media-ledger.md`.
- **Never regenerate.** A generated file already on disk is kept; the human deletes it to redo it.
- **Prompts.** Never put a real person's, artist's or band's name, a song title or a show title in a PixelLab, Lyria,
  Gemini Omni or Nano Banana prompt. Music prompts name genres, instruments and moods only. Do not add copyrighted or
  copyright-adjacent music, lyrics or recordings in any form.
- **Pin, then refactor.** Before restructuring code, a test pins its current behaviour (every branch, the whole output,
  red when a branch is broken by hand or a `<` becomes `<=`). The pin lands in its own commit; the refactor commit
  follows with the pin unchanged and green. A bug found on the way gets its own commit, named as a fix.
- **Code style.** Small single-purpose functions (complexity under 15, hard limit 20); nesting no deeper than 2 (guard
  clauses and early returns); every number a named constant (only 0, 1 and -1 may stay bare); no try/catch except at a
  boundary you do not control (the OS, the network, a third-party library), catching one specific error and handling it;
  test names that say what they test (a coded test is `<CODE>_<word1>_<word2>`).
- **Search.** Use `rg` rather than `grep`.
- **Pull requests.** The maintainer does not take them (`docs/CONTRIBUTING.md`); do not open one against this repo's
  upstream unless asked.

## Checks
`scripts/hygiene.sh` runs everything: ruff (all rules) and ruff format, mypy `--strict`, the complexity ratchet,
pytest, shellcheck, and in `web/` tsc, ESLint strict-type-checked (complexity 15, max depth 2, no magic numbers),
Prettier and Vitest (once with the maintainer's cast, once with `CAST_DEFAULTS=1`). It is the pre-commit hook
(`git config core.hooksPath .githooks`) and runs in CI. It must pass before every commit.

## Seeing the game
`.claude/launch.json` defines `web` (the dev server on 5173) and `dist` (the built site on 4174). Use the browser
preview to load the game, click through a change, read the console and take a screenshot.
