# Loose Orphans: Legend of Minsung

A Final Fantasy VI-style browser RPG about a fictional boy band, **Loose Orphans**, flung across a
chain of K-drama-flavoured worlds. It is also a worked example of making a whole game with AI helpers and a strict
engineering gate: pixel art from PixelLab, character sprites composed from free LPC layers, a generated soundtrack,
generated cutscenes, and every spend capped and logged.

**TL;DR**

- **New to coding?** Start with [`docs/start-here.md`](docs/start-here.md): set up, make it yours and build an
  adventure by talking to Claude, with honest costs and free options.
- **Two games in one:** *Legend of Minsung* (the 70-minute drama RPG) and *The L-Team* (a 45-minute caper: seven
  idols in onesies spring the eighth from army camp). Pick one on the **Choose an adventure** screen.
- **Play:** `cd web && npm install && npm run dev`, open http://127.0.0.1:5173. Add `?adventure=stay` to jump straight
  into the L-Team. Saves stay in your browser; no account, no keys.
- **Make it yours:** copy `cast.toml` to `cast.local.toml` and change the names ([how](#make-it-yours-the-cast-file)).
- **Add your own adventure:** hand a premise to an AI coding agent with this repo open ([how](#make-your-own-adventure)).
- **Make new art or music:** needs API keys in `secrets.env` ([how](#api-keys-a-short-how-to)); every tool dry-runs
  and shows the cost first.

> **Please read this first.** This is an independent, non-commercial parody. Every character is fictional, and any
> resemblance to a real person, group or company is coincidental. It is not affiliated with, endorsed by, or
> sponsored by anyone it winks at (the show and musical parodies in the story are affectionate nods, nothing more).
> It contains **no copyrighted or copyright-adjacent music, lyrics or recordings**: the whole soundtrack was generated
> from prompts that name only genres, instruments and moods. Do not add any, and do not put a real person's,
> artist's, band's, song's or show's name into a generation prompt. See [Disclaimer](#disclaimer).

- [Loose Orphans: Legend of Minsung](#loose-orphans-legend-of-minsung)
  - [Play it](#play-it)
  - [Run it yourself](#run-it-yourself)
    - [Publish your own copy](#publish-your-own-copy)
  - [Make it yours: the cast file](#make-it-yours-the-cast-file)
  - [How it was made](#how-it-was-made)
  - [Make your own adventure](#make-your-own-adventure)
  - [API keys: a short how-to](#api-keys-a-short-how-to)
  - [Prompts](#prompts)
  - [Agent and MCP setup](#agent-and-mcp-setup)
  - [Repo layout](#repo-layout)
  - [Checks](#checks)
  - [Disclaimer](#disclaimer)

## Play it

Open the Pages site for this repo (`https://<your-user>.github.io/<this-repo>/` once you have enabled Pages; see
[Publish your own copy](#publish-your-own-copy)), or [run it yourself](#run-it-yourself). No keys and no account are
needed to play.

**The story.** The night before the comeback, during a rooftop livestream, Sol finally starts to tell Rae something
important. A demon executive, Director Gwi, enforces the Dating Ban Contract, shatters the barrier woven from Sol's
songs, and flings all eight members into pocket worlds that each wink at a famous drama. To get home they must win back
seven Lightstick Shards. The full outline is in [`docs/story-bible.md`](docs/story-bible.md).

**A second adventure: The L-Team.** A shorter caper on the same engine (about 45 minutes). Early 2027, one member is
doing his military service at a fictional camp in the pines, and the other seven, in plush animal onesies and a yellow
van, decide to break him out. Outline: [`docs/adventures/stay/story-bible.md`](docs/adventures/stay/story-bible.md).

**Choosing an adventure.** After loading, the game shows *Choose an adventure*; the title screen's **Adventures** row
goes back to it. A link can skip the menu: `?adventure=main` or `?adventure=stay`. The game remembers your last
choice. Every adventure is listed in [`docs/adventures/README.md`](docs/adventures/README.md).

**Controls**

| Action | Keyboard | Touch / mouse |
|---|---|---|
| Move | Arrow keys or WASD | On-screen stick |
| Talk, confirm, advance text | Z, Enter or Space | A button, or tap the screen |
| Back, cancel | X or Esc | B button |
| Pick a target in battle | Arrows, then confirm | Click or tap the enemy |

**Saving.** The game saves in your browser (`localStorage`): one save per adventure (`legend-minsung.save`,
`legend-minsung.stay.save`), one volume (`legend-minsung.volume`) and the last adventure chosen
(`loose-orphans.adventure`). Clearing site data clears the save. There is no account and nothing leaves your machine.

**Difficulty.** The game starts on `easy` (fewer random fights, softer enemies, wider minigame windows) because the
story is the point. Switch to `normal` by editing `level` in [`config.toml`](config.toml) `[difficulty]`; every number
is in that file.

## Run it yourself

You need [Node.js](https://nodejs.org) 22 or newer. For the art and media tools you also need
[uv](https://docs.astral.sh/uv/) (it installs Python for you) and, for the cutscene post-processing,
[ffmpeg](https://ffmpeg.org).

```bash
cd web
npm install
npm run dev      # http://127.0.0.1:5173
```

```bash
cd web
npm run build    # a static site in web/dist
npm run preview  # serve it locally
```

The game is a static site: [Phaser 3](https://phaser.io) with TypeScript, built by Vite. All its settings come from
[`config.toml`](config.toml) and its names from [`cast.toml`](cast.toml); both are baked in at build time and the dev
server restarts when either changes.

### Publish your own copy

1. Fork or copy the repo to your GitHub account.
2. Settings, Pages, Source: **GitHub Actions**.
3. Push to `main`. [`.github/workflows/pages.yml`](.github/workflows/pages.yml) builds `web/` and deploys it;
   [`ci.yml`](.github/workflows/ci.yml) runs every check.

## Make it yours: the cast file

Every name, nickname, pet, catchphrase and in-joke in the story is a `{token}` in the text (`{m1}`, `{m2.pet}`,
`{meter}`, `{fandom}`) that the game fills in from [`cast.toml`](cast.toml). The committed file holds fictional
defaults. To put **your own friends, band or team** in the game:

```bash
cp cast.toml cast.local.toml    # gitignored: it stays on your machine
# edit cast.local.toml: keep only the keys you want to change
cd web && npm run dev
```

`cast.local.toml` is merged over `cast.toml` key by key, so a short file works. `CAST_DEFAULTS=1 npm test` ignores it
and tests the defaults. The L-Team's codenames and catchphrases are keys of their own (`stay_team`, `stay_m3`,
`stay_catch` and so on, in `[terms]`). Make the game about people who know you made it and are happy about it, and keep the romance
as chaste as the original. Member ids (`m1` to `m8`) never change, so art, saves and tests stay valid.

## How it was made

| Part | Tool | Where | Cost control |
|---|---|---|---|
| Hero art: portraits, backdrops, bosses, enemies, stills | [PixelLab](https://pixellab.ai) (Pixen model) | `tools/art/` (`pixellab.toml`) | Picture cap in `config.toml [budget.<adventure>]` |
| Walking sprites | [Universal LPC Spritesheet Character Generator](https://github.com/sanderfrenken/Universal-LPC-Spritesheet-Character-Generator) layers, composed by script | `tools/art/lpc.py`, `tools/art/cast.toml` | Free |
| One shared palette | Quantizer over every picture | `tools/art/palette.py` | Free |
| Soundtrack | Lyria on the Gemini API | `tools/media/` (`music.toml`) | Dollar caps |
| Cutscenes | Gemini Omni, image-to-video from the stills, then an ffmpeg pixel pass | `tools/media/` (`cutscenes.toml`) | Dollar caps |
| Extra pictures from reference photos | Nano Banana on the Gemini API | `tools/media/` (`images.toml`; the L-Team's crew portraits) | Counts toward the media cap |
| Game | Phaser 3, TypeScript, Vite; maps are an ASCII grid over a painted backdrop, no tilesets | `web/` | Free |

The working rules that made it affordable and repeatable:

- **Dry run first.** Every runner prints what it would make and what it would cost, and does nothing until you add
  `--run`. A batch that would cross a cap in `config.toml [budget.<adventure>]` is refused before any call is made.
  Each adventure has its own caps: pass `--adventure <id>` (default `main`); any adventure but `main` keeps its
  manifests under `tools/art/adventures/<id>/` and `tools/media/adventures/<id>/`.
- **A file on disk is never regenerated.** Delete it to redo it. Raw API output is cached under `.cache/` so
  re-processing is free.
- **Every call is written to a ledger** (`docs/art-ledger.md`, `docs/media-ledger.md`), created on the first spend.
  Each row ends with the adventure it was for; an adventure's caps count only its own rows, and a row without that
  column is `main`'s.
- **Prompts name no real person, artist, band, song or show.** Music prompts name genres, instruments and moods only.
- **Palette discipline.** One 128-colour palette for every picture keeps AI art looking like one game.

Details: [`docs/design.md`](docs/design.md), [`docs/media-pipeline.md`](docs/media-pipeline.md),
[`docs/art-notes.md`](docs/art-notes.md), [`docs/minigames.md`](docs/minigames.md), [`docs/voice.md`](docs/voice.md).

Common commands (all from the repo root):

```bash
uv sync                                                     # install the Python tools
uv run python -m tools.art pictures                         # dry run: pictures that would be drawn, and the cost
uv run --env-file secrets.env python -m tools.art pictures --run --only portraits
uv run python -m tools.art cast                             # compose the LPC sprites (free)
uv run python -m tools.art palette                          # snap every picture to the shared palette
uv run python -m tools.media music                          # dry run for the soundtrack
uv run --env-file secrets.env python -m tools.media music --run --only title
uv run python -m tools.media cutscenes                      # dry run for the cutscenes
```

## Make your own adventure

Honestly, this is the easy part. The L-Team was made this way, and it's the most fun part of the project.

1. **Get the repo onto your machine:** clone or download it.
2. **Set up your API keys** so the agent can make art, music and cutscenes ([next section](#api-keys-a-short-how-to)).
   You can skip this at first. Without keys the agent still writes a playable adventure, with stand-in boxes for art.
3. **Open the repo in your favourite AI coding agent and give it a premise.** I use Claude Opus 5.5 in Claude Code, on
   medium or high effort. One or two sentences is plenty, for example:

   > Make a new adventure for this game: the band gets stuck in a haunted K-pop theme park on Halloween and has to win
   > back their mascots from a ghost producer. Keep it about 30 minutes, add it to the adventure menu.

4. **Answer its questions.** It reads `CLAUDE.md` and the
   [adventure checklist](docs/adventures/README.md), then asks a few things (tone, who's in the party, how it ends),
   shows you a plan, and then just goes. It writes the story bible and chapters and adds them to the menu. Then it
   plays the adventure through to check it.
5. **Set the budget when it asks.** Before spending anything it runs the dry runs and shows how many pictures and how
   many dollars of music, cutscenes and portraits it wants. Nothing is generated until you say yes, and each adventure
   gets its own caps in `config.toml [budget.<id>]`. For scale, the whole L-Team cost 53 PixelLab pictures and about
   $4.50 of Gemini (music, portraits, six cutscenes).

Then pick your adventure on the *Choose an adventure* screen. Keep the house rules in mind: fictional names in the
committed files (your real ones go in `cast.local.toml`), chaste romance, and no real names, songs or shows in any
generation prompt. The agent follows these from `CLAUDE.md`, but it's your game, so look over what it makes.

## API keys: a short how-to

**Why.** Keys are only for the *tools* that
draw new pictures (PixelLab) or make new music, cutscenes and extra pictures (the Gemini API). If you only want to play,
change the cast, or edit the story, skip this section.  If you want to bust-out claude/openai and make your own, read-on.

You don't need pixellab if you have a different way to generate art, but I will suggest that having an LLM generate art itself is heartache, pain, and quota drain.

**Which keys, and where to get them.** The two names are listed in [`config.toml`](config.toml) `[secrets]`:

| Variable | Used for | Where to get it |
|---|---|---|
| `PIXELLAB_AI_SECRET` | PixelLab art | Create an account at [pixellab.ai](https://pixellab.ai) and open its API / API keys section to generate a token. The menu name has changed over time and I could not confirm it from PixelLab's own docs on 2026-11-05, so look for "API". It is sent as `Authorization: Bearer ...` to `https://api.pixellab.ai/v2`. |
| `GEMINI_API_KEY` | Lyria music, Gemini Omni cutscenes, Nano Banana pictures | Sign in to [Google AI Studio](https://aistudio.google.com/apikey), choose "Create API key", pick or create a project, and copy the key (it usually starts with `AIza`). Generation is paid: set up billing and check the [pricing page](https://aistudio.google.com/docs/pricing). |

**The Gemini app is not the Gemini API.** A Gemini subscription (Google AI Plus or Pro, the chatbot at
gemini.google.com, including the free student offer) gives no API credit. The tools here need an API key from Google
AI Studio with billing turned on. PixelLab offers a small free trial, enough for a handful of key pictures; check
its site for the current numbers.

**Where to put them.** One file at the repo root, which git ignores:

```bash
cp docs/secrets.env.example secrets.env
# open secrets.env in your editor and paste each value after the equals sign: NAME=value
```

Only secrets go in `secrets.env`, and no settings. Settings (prices, caps, sizes) live in `config.toml`, which holds
no secret and is committed.

**How they are used.** The tools read them from the environment only for the run that needs them:

```bash
uv run --env-file secrets.env python -m tools.art pictures --run --only portraits
```

**Keeping them safe.** Several locks, so one slip doesn't leak a key:

| Layer | What it stops | Set up |
|---|---|---|
| `.gitignore` | `secrets.env`, any copy of it (`secrets.env.txt` from a text editor, `.bak`), any `.env`, `cast.local.toml` | automatic |
| Key-value scan (`tools/secrets_scan.py`) | your **actual** keys, pasted anywhere in a file you're about to commit or in the built site, whatever they look like | runs in every commit check |
| Shape test (`tests/test_repo_secrets.py`) | anything shaped like a Google key or a `NAME_KEY=...` line, and any secrets file that got tracked | runs in every commit check |
| Commit check (`.githooks/pre-commit`) | a commit that fails any of the above | switched on by `npm install` in `web/` |
| Agent guard (`.claude/settings.json`) | an AI agent opening, printing, searching or copying `secrets.env`; it may only hand it to a runner | automatic in Claude Code |

**Steps only you can take:**

1. **Cap the spend at the provider.** In Google Cloud, set a budget alert on the key's project, and use
   *API restrictions* to allow the key the Generative Language API only. PixelLab is prepaid credit, so only buy
   what you're happy to lose. If you're under 18, have a parent or guardian own the billing.
2. **On GitHub, turn on secret scanning and push protection** (repo Settings, then Code security). These are free for
   public repos, and GitHub refuses a push that contains a known key format.
3. **Never paste a key** into a prompt, an issue, Discord, a chat with an AI helper, or a screenshot.
4. **If one leaks anyway, revoke it at the provider right away** and make a new one. Deleting the file, or even
   rewriting git history, doesn't take back a key someone already copied.

The caps in `config.toml [budget.<id>]` bound what each batch can spend, and the dry run shows the cost first.

## Prompts

The prompts that made the game are all in the repo, and the lessons behind them are in
[`docs/prompts.md`](docs/prompts.md):

- **PixelLab pictures:** `tools/art/pixellab.toml`: one table per picture with a prompt, a size and a seed.
- **Music:** `tools/media/music.toml`: genres, instruments, mood and tempo; no names of any artist, band, song or show.
- **Cutscenes:** `tools/media/cutscenes.toml`: the motion to add to a still, in a sentence or two.
- **Sprites:** `tools/art/cast.toml`: not prompts but a list of LPC layers per character.
- **The L-Team:** the same files under `tools/art/adventures/stay/` and `tools/media/adventures/stay/` (plus
  `images.toml` for the Nano Banana portraits), and `tools/art/cast/stay.toml` for the onesies.

The shortest useful lessons: ask for "completely empty ... nothing on the ground and no people" so you can place the
characters yourself; fix the camera ("steeply down", "side view"); end every prompt with the same style sentence; keep
seeds in the manifest so a look can be reproduced; and never name a real person or work.

## Agent and MCP setup

The repo is built to be worked on by an AI coding agent, and says so in [`CLAUDE.md`](CLAUDE.md), which tells an agent
where things live, which rules to follow (budgets, dry runs, no real names in prompts, never open `secrets.env`) and
which checks must pass.

- **What is, and is not, MCP here.** The generation tools are plain HTTPS calls from Python (`tools/art/pixellab.py`
  for PixelLab, `tools/media/gemini.py` for Gemini). They are **not** MCP servers, so no MCP server is needed to
  run any of them.
- **The MCP-side setup used while building** is the browser-preview server of the Claude Code desktop app, pointed at
  this repo through [`.claude/launch.json`](.claude/launch.json) (`web` runs the dev server on port 5173, `dist` serves
  the built site on 4174). It let the agent load the game, click through it, read the console and take screenshots to
  check its own changes. Any other agent or tool that can start a dev server and open a page works the same way.
- **Suggested agent workflow:** read `CLAUDE.md` and `config.toml`; run a tool's dry run and report the count and the
  cost before `--run`; make a pinning test before restructuring anything; run `scripts/hygiene.sh` before every
  commit.

## Repo layout

```
web/                 the game: Vite + TypeScript + Phaser 3
  src/scenes/        title, overworld, dialogue, battle, minigame, cutscene, credits
  src/systems/       battle, encore (limit break), meter, status, save, state
  src/campaigns/     one file per adventure, the registry (index.ts) and the active pick (active.ts)
  src/data/          the story as typed data: chapters, members, skills, enemies
  src/data/adventures/<id>/   a later adventure's chapters (the first game's are in src/data/chapters/)
  src/cast.ts        fills {tokens} from cast.toml
  public/assets/     pictures, sprites, music, video
tools/art/           PixelLab runner, LPC composer, palette quantizer
tools/media/         Lyria music, Gemini Omni cutscenes, Nano Banana pictures, ffmpeg post
config.toml          every setting and budget cap (no secrets)
cast.toml            names, pets and in-jokes (fictional defaults)
docs/                design notes, story bible, prompts, licences; docs/adventures/ indexes the adventures
scripts/hygiene.sh   every check, run by the pre-commit hook and CI
```

## Checks

`scripts/hygiene.sh` runs everything, and the pre-commit hook and CI both run it. Turn the hook on once:

```bash
git config core.hooksPath .githooks
```

It runs, in order: ruff (every rule on) and ruff format; mypy `--strict`; a complexity ratchet (a new function over 20
fails; over 15 or nesting deeper than 2 warns); pytest; shellcheck; and in `web/`: `tsc` strict,
ESLint `strict-type-checked` (complexity 15, max depth 2, no magic numbers), Prettier and Vitest, the last run once with
your cast and once with the defaults.

House rules for new code: small single-purpose functions, nesting no deeper than two levels (guard clauses and early
returns), every number a named constant, no try/catch except at a boundary you do not control, and test names that say
what they test.

## Disclaimer

- This is an unofficial, non-commercial, parody work of fiction. No one involved earns anything from it. It is
  provided as is, with no warranty.
- It is not affiliated with, authorised by, or endorsed by any real person, band, agency, label, studio, broadcaster or
  streaming service. Names of real shows and works that appear are affectionate parody references only, and every
  character in the story is fictional.
- It contains no copyrighted or copyright-adjacent music, lyrics or recordings. The soundtrack was generated from
  genre-only prompts. **Do not add any** to a fork, and do not feed a real person's, artist's, band's, song's or show's
  name into a generation prompt.
- The generated art, music and video were made with commercial AI services; check their current terms before reusing
  the files. Licences are in [`docs/licenses.md`](docs/licenses.md). The sprites use CC-BY-SA 3.0 artwork and must keep
  their attribution.
- **Not accepting pull requests.** Fork it and make it your own; see [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md).
