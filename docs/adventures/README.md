# Adventures: the index

One engine, several games. Each **adventure** is a `Campaign` (`web/src/campaigns/types.ts`): its chapters, words,
meter, credits and save key. Every build bundles all of them. The player picks one on the select screen after boot
(`web/src/scenes/select.ts`), and `web/src/campaigns/active.ts` loads that one for the page (`?adventure=<id>`, else
the last choice, else `main`). Choosing a different adventure reloads the page; see `docs/adr/0001-adventures.md`.

## The adventures
| id | Title (default cast) | Status | Campaign | Content | Story bible | Art / media manifests | Budget |
|---|---|---|---|---|---|---|---|
| `main` | Loose Orphans: Legend of Minsung | done, art and media drawn | `web/src/campaigns/main.ts` | `web/src/data/chapters/` | `docs/story-bible.md` | `tools/art/pixellab.toml`, `tools/art/cast.toml` + `cast/ch*.toml`, `tools/media/*.toml` | `config.toml [budget.main]` |
| `stay` | The L-Team | playable end to end; pictures, portraits and music drawn, cutscenes not yet | `web/src/campaigns/stay.ts` | `web/src/data/adventures/stay/` | `docs/adventures/stay/story-bible.md` | `tools/art/adventures/stay/pixellab.toml`, `tools/art/cast/stay.toml`, `tools/media/adventures/stay/*.toml` | `config.toml [budget.stay]` |

`main` keeps the folders it had before there were adventures; every later adventure uses the `adventures/<id>/`
layout below.

## What every adventure shares
- The engine: scenes, systems, minigame engines (`docs/minigames.md`), battle rules, the eight members and their
  skills (`web/src/data/members.ts`, `skills.ts`), the shared enemies and items (`enemies.ts`, `items.ts`).
- The cast file: names are `{tokens}` from `cast.toml`. An adventure's own words go in `[terms]` with its id as a
  prefix (`stay_team`, `stay_m3`, ...). `cast.local.toml` overrides them; never create it for the maintainer.
- One art folder: generated pictures land in `web/public/assets/art/<group>/`. Prefix every piece id with the
  adventure id (`stay_garage`) so no two adventures draw the same file. LPC figures likewise (`stay_m1`).
- One volume setting. Saves are per adventure (`saveKey`).

## Add an adventure (checklist)
1. **Story first.** `docs/adventures/<id>/story-bible.md`: premise, tone rules, cast roles, chapters. Read
   `docs/story-bible.md` and `docs/voice.md`; the eight sound the same everywhere.
2. **Words.** New names, codenames and catchphrases as `<id>_*` keys in `cast.toml [terms]`, with fictional
   defaults. Tell the maintainer which keys to override in their own `cast.local.toml`.
3. **Chapters.** `web/src/data/adventures/<id>/ch1.ts` ... each exporting `CHAPTER` (shape: `web/src/data/types.ts`;
   copy `web/src/data/adventures/stay/ch1.ts`). Chapter ids, enemy ids and item ids carry the adventure id
   (`stay1`, `stay_goose`). An `index.ts` beside them lists the play order.
4. **Campaign.** `web/src/campaigns/<id>.ts` (copy `stay.ts`): its own `id`, `saveKey`, meter and credits.
5. **Register it.** One entry in `ADVENTURES` in `web/src/campaigns/index.ts` (blurb and card art), and one in
   `CAMPAIGNS` in `web/tests/campaigns.ts`. The content, reachability, text-fit and meter tests then cover it.
6. **Budget.** A `[budget.<id>]` table in `config.toml` (copy `[budget.stay]`). The human sets the numbers.
7. **Manifests.** `tools/art/adventures/<id>/pixellab.toml`, `tools/art/cast/<id>.toml` (free LPC figures),
   `tools/media/adventures/<id>/{music,cutscenes,images}.toml`. Prompts: no real names, bands, songs or shows.
8. **Dry runs, then ask.** `uv run python -m tools.art pictures --adventure <id>` and
   `uv run python -m tools.media music|cutscenes|image --adventure <id>`. Show the human the count and cost; add
   `--run` (with `uv run --env-file secrets.env`) only after a yes. Stills before cutscenes: a clip animates its still.
9. **Play it.** `scripts/hygiene.sh`, then the `web` preview: pick it on the select screen and play to the credits
   (`web/qa/driver.js` can drive it with `?qa=1`). Keep the browser muted (volume slider to 0).

## The L-Team's art and media
Drawn on 2026-11-05: 48 PixelLab pictures, 8 Nano Banana crew portraits, 5 Lyria tracks (ledgers in `docs/`).
Cutscenes come next: each clip animates its still, so dry-run `tools.media cutscenes --adventure stay` and ask.
