# Design and build plan

### Repo layout
```
README.md  CLAUDE.md  config.toml  secrets.env(gitignored)  .gitignore
docs/  story-bible.md  lore-wishlist.md  design.md  art-ledger.md  adr/
tools/art/        Python (uv): PixelLab runner, LPC composer, palette quantizer
  pixellab.toml   every PixelLab piece: id, kind, prompt, seed, size, view, out path
  cast.toml       every LPC figure: id, layers, recolors, frames to cut
tools/media/      Python (uv): Lyria + Veo runners, ffmpeg post-processing
  music.toml  cutscenes.toml
web/              Vite + TypeScript + Phaser 3.90 (pinned)
  src/scenes/     Boot, Title, Overworld, Battle, Dialogue, Minigame, Menu, Credits
  src/systems/    atb, party, inventory, flags, storyMeter, save, encore
  src/minigames/  timingBar.ts, rhythm.ts, gridPuzzle.ts   (3 engines, 9 skins)
  src/data/       chapters/*.ts (ASCII maps, NPCs, dialogue, encounters), skills, enemies, items
  public/assets/  generated PNGs + atlases
scripts/complexity.py
```

### Key design choices
- **Data-driven content.** Chapters, dialogue, encounters, and maps are typed TypeScript data. Each map is an ASCII
  grid of walls, warps and spots laid over its painted backdrop, which an agent can write easily (no Tiled). A data-validation test catches broken
  dialogue ids, flags, warps, and speaker names.
- **Three minigame engines, nine skins:**
  - timing bar: Red Light, tea pour, bass-off, archery
  - rhythm: rap battle, dance battle
  - grid puzzle: baduk, glass bridge, dalgona
- **Plays on an iPhone and a computer.** Phaser FIT scaling, no hover-only UI, a touch D-pad + A/B overlay on
  coarse-pointer devices (the D-pad only while walking), keyboard on desktop. Every screen also takes a tap or
  click: menu rows, dialogue, battle targets, minigame cells and lanes, and tap-to-walk on maps (a person to talk,
  a doorway to go through). In a fight, a tap on an enemy at the command menu is an Attack on it. A flashing gold marker points at the one thing to do next, when there is only one
  (`systems/beacon.ts`). Every screen is checked at 375×812.
- **Rendering:** 640×360 internal resolution, integer scaling, 64px LPC characters. Battles are side view with
  FF-blue gradient windows drawn in code.
- **Maps are painted, not tiled.** Each map screen is one PixelLab backdrop (320×180, `high top-down`, shown at 2×),
  in the manner of drawn-room adventures. Collisions, warps, NPC spots and the player's start are an ASCII grid
  laid over it in the chapter data. No tilesets to generate or edit.
- **Settings in `config.toml`:** game tuning, debug chapter-skip, and the art budget cap, read at build time through a
  tiny Vite TOML import. Battle numbers live there or in named constants; no magic numbers.
- **Saves:** `localStorage`. The try/catch around it is acceptable because the browser storage boundary can throw. The
  game still plays when storage is unavailable.
- **Audio:** an original Lyria soundtrack (see below), jsfxr-style SFX, and CC0 loops as the fallback, all recorded
  in `docs/credits.md`. No real songs.
- **Character recognition:** at 64px, each member is a distinct LPC hair style and color plus a signature outfit
  color. A tiny pet companion follows each one on the map: Sol's quokka, Rae's Raebit, Dae's wolf,
  Bo's Bopig, Ari's Arinet, Lio's Liochick, Jun's Junpup, Nico's Nicofox. The same eight pictures
  double as the summon art.

### Art: reuse and synthesize first, PixelLab second
**Free sources** (0 pictures):
| Need | Source |
|---|---|
| 8 members + ~20 NPCs, 4-direction walk, idle, battle poses (slash, cast, thrust, hurt) | LPC layers through a ported `bench/sprites.py` |
| Costumes: Goryeo hanbok/robes, green Player 143 tracksuit, Hamilton coats | LPC layer swaps and recolors; the "143" number is drawn on in code |
| Portrait expressions (happy, flustered, angry, crying) | One base portrait per character plus manga overlays drawn in code: blush, sweat drop, anger vein, sparkles, tears |
| Enemy variety | FF-classic palette swaps: each base enemy becomes 3 tiers by recoloring |
| Boss motion | Static boss pictures, the way FF6 did it, animated with tweens: bob, flash, shake, dissolve |
| UI, spell effects, K-drama moments | Code: gradient windows, particles (petals, rain, sparkles), letterbox, slow-mo, vignette |
| Font, music, SFX | OFL pixel font, CC0 chiptune, jsfxr-style SFX |

A local palette step (Pillow, free) quantizes every PixelLab picture to one shared 128 color palette, so PixelLab
art and LPC sprites read as one game. Every picture gives the palette an equal sample of its pixels, so a small portrait's
colours count as much as a backdrop's. At 48 colours, built from all pixels, the big dark scenes took every slot and
the purples, greens and Sol's orange went grey (measured 2026-11-02, `docs/art-notes.md`).

**PixelLab spend** (cap **200** in `config.toml`, target about 170):
| Asset | Pictures |
|---|---|
| Map backdrops: 9 locations × ~2 screens, 320×180 high top-down | 18 |
| Battle backgrounds, 320×180 side view | 9 |
| **K-drama stills:** 7 trope moments + 2 endings, 320×180. This is where to spend for the big payoff | 9 |
| Portraits, 128×128: 8 members + ~12 key NPCs and bosses | 20 |
| Bosses, 128–192px transparent, static | 9 |
| Base enemies, 64px transparent (palette-swapped ×3 into ~36) | 12 |
| Pet companions/summons, 32–64px | 8 |
| Key props: lightstick, shards, the doll, dalgona, baduk stones, letter, umbrella… | 15 |
| Title screen + logo | 3 |
| **Subtotal** | **103** |
| Retries and takes to choose between (about 65%) | ~67 |
| **Planned** | **~170** of 200 |

The runner:
- shows a dry run with the count before any batch, and refuses one that would cross the cap;
- checks `GET /balance` before and after each batch;
- skips files already on disk;
- appends every call to `docs/art-ledger.md`.

### Music (Lyria) and cutscenes (Veo)
These go in `tools/media/` (Python, uv), with the same pattern as the art runner: a TOML manifest of prompts and
seeds, files on disk never regenerated, a dry run with the cost, a cap in `config.toml`, and every call logged to
`docs/media-ledger.md`.

**Soundtrack** (`music.toml`; cap $5, about 20 tracks × 2 takes; the game's hamfisted flourishes):
- **Shared themes:** title theme, Dramaverse overworld, battle, boss battle, the final boss in three intensities, a
  victory sting, and the **OST swell** that plays under every trope moment.
- **One location theme per chapter:**
  - Ongsang: seaside acoustic.
  - Squish Game: eerie music-box march.
  - Goryeo: gayageum court strings.
  - The Glory: cold piano.
  - The bog: dreamy folk with a deep hum.
  - Hamilsung: a hip-hop march with harpsichord.
  - KPDH: a glossy K-pop synth anthem.
- **Ending ballad:** possibly Pro with *original* lyrics written by the session about quokkas, cats, and rooftops.
  Original words carry no copyright problem.
- **Processing:** loop points by crossfade trim, then encode to OGG/MP3 at about 96 kbps (ffmpeg). Battle and
  overworld tracks loop; stings don't.

**Cutscenes** (`cutscenes.toml`; cap $25):
- **Model note (2026-11-02):** Veo 3.1 left the Gemini API on 2026-10-22; the runner uses Gemini Omni Flash
  (`gemini-omni-1.1-flash`, image-to-video, about $0.10/s at 720p) instead. See `docs/media-pipeline.md`.
- **What gets animated:** the 9 K-drama stills, the prologue's Solmoon shattering, and the finale's concert. About
  11 clips of 6–8 s.
- **How:** Veo **image-to-video with the PixelLab still as the first frame**, on the Fast or Lite tier at 720p. One
  to two takes each, picked with `art_critic.py`.
- **Back to pixel art:** ffmpeg downscales to 320×180 with nearest-neighbor, quantizes every frame to the game
  palette, and caps the frame rate at 12 fps for a sprite-animation feel. Then it encodes to WebM and MP4 at
  640×360. Drop Veo's audio and lay the Lyria cue under it.
- **In game:** a Phaser `Video` object with a Skip button. If the video fails to load or play, show the static still
  with the code effects (petals, rain, slow zoom), so the game never depends on video.

**Secrets:** `config.toml [secrets]` gains `gemini_api_key = "GEMINI_API_KEY  # Lyria music + Veo cutscenes"`. The
user adds the value to `secrets.env`; the session never asks for it in chat.

**Lock the style first:** spend 3–4 pictures on Sol's portrait and the Ch 1 backdrop, palette-quantize them, put an
LPC Sol in front of the backdrop, and get the user's approval before batching anything.

### Milestones
Each milestone is a commit or a few. The game stays playable at every step.

1. **Scaffold.**
   - `git init`, `.gitignore` (with `secrets.env`), `config.toml` with
     `[secrets] pixellab_ai_secret = "PIXELLAB_AI_SECRET  # PixelLab art generation"`.
   - Rename `.env` to `secrets.env`. Move it only; never open it.
   - `uv init` with ruff `ALL`, mypy strict, and `complexity.py`. Vite, TS strict + `noUncheckedIndexedAccess`, ESLint
     strict-type-checked (`complexity` 15, `max-depth` 2, no-magic-numbers), Prettier, Vitest.
   - A pre-commit hook that runs all of the above plus shellcheck.
   - Copy the story bible into `docs/`.
2. **Art pipeline + style lock.**
   - Port `art.py` (PixelLab, with the budget guard and dry run) and `sprites.py` (LPC, with walk and battle rows
     added) into `tools/art/`.
   - Add the palette-quantize step.
   - Build the 8 LPC members, then do the style lock above and get the user's sign-off.
3. **Vertical slice:** the Prologue plus Ch 1 with placeholder rectangles where art is missing. Covers overworld
   movement, collisions, NPC talk, dialogue with choices, scripted and random battles, a basic ATB, save/load, and the
   trope cutscene effect. Playable start to finish in the browser.
4. **Full battle system:** jobs, skills, statuses, Encore, pet summons, weather, the Minsung meter, Drama Album.
5. **Minigame engines.** Build the three engines, then skin them per chapter.
6. **Chapters 2–7** content, one commit per chapter.
7. **Finale,** both endings, and credits.
8. **Art batch.** Run the PixelLab manifest in batches of about 20 with a dry run each time. Quantize the results,
   pack atlases, and swap out the placeholders.
9. **Music and cutscenes.**
   - Build `tools/media/`.
   - Generate the title theme and one Veo clip (the Ch 1 trope moment) first, and get the user's OK on the sound and
     the post-processed look.
   - Then batch the rest.
10. **Polish.** SFX, title screen, mobile touch controls (D-pad + A/B overlay), a playtest pass, then publish.

---

## Verification
- `npm run check` (tsc, eslint, prettier, vitest) and `uv run ruff check`, `ruff format --check`, `mypy --strict`,
  `scripts/complexity.py` must all pass. They run in the pre-commit hook.
- **Tests:**
  - battle math (damage, ATB order, Encore fill, the edges of each status), each with an `<`→`<=` edge case;
  - the Minsung meter thresholds that pick Ending A vs B;
  - data validation: every map warp, dialogue node, flag, and speaker resolves, and every chapter is reachable from
    the Prologue.
- **Art pipeline:** the tests run with a mocked HTTP layer and spend no pictures. They also check that the runner
  refuses a batch that would cross the 200 cap, including one at exactly the cap. Run it for real only after a
  printed dry run shows the count.
- **In-browser QA:** start the Vite dev server through `.claude/launch.json` and `preview_start`. Use
  `?chapter=N` (gated by the debug flag in `config.toml`) to play each chapter's minigame and boss. Check the mobile
  preset at 375×812 for touch controls and text fit.
- **Media:** a ledger test checks that the Lyria and Veo runners refuse a batch past their dollar caps. In-browser QA
  checks that every cutscene plays, can be skipped, and falls back to its still when the video file is missing.
- **Ship:** build with `base: './'`. Check the Artifact limits: the page ≤16 MB, each file ≤15 MB, ≤64 MB per publish
  (otherwise split into several publishes). Publish as a private claude.ai Artifact with `dist/` as supporting files. Do a full playthrough on the published link before handing it over.
