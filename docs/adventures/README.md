# Adventures: the index

One engine, several games. Each **adventure** is a `Campaign` (`web/src/campaigns/types.ts`): its chapters, words,
meter, credits and save key. Every build bundles all of them. The player picks one on the select screen after boot
(`web/src/scenes/select.ts`), and `web/src/campaigns/active.ts` loads that one for the page (`?adventure=<id>`, else
the last choice, else `main`). Choosing a different adventure reloads the page; see `docs/adr/0001-adventures.md`.

## The adventures
| id | Title (default cast) | Status | Campaign | Content | Story bible | Art / media manifests | Budget |
|---|---|---|---|---|---|---|---|
| `main` | Loose Orphans: Legend of Minsung | done, art and media drawn | `web/src/campaigns/main.ts` | `web/src/data/chapters/` | `docs/story-bible.md` | `tools/art/pixellab.toml`, `tools/art/cast.toml` + `cast/ch*.toml`, `tools/media/*.toml` | `config.toml [budget.main]` |
| `stay` | The L-Team | done: art, music and 6 of 7 cutscenes drawn | `web/src/campaigns/stay.ts` | `web/src/data/adventures/stay/` | `docs/adventures/stay/story-bible.md` | `tools/art/adventures/stay/pixellab.toml`, `tools/art/cast/stay.toml`, `tools/media/adventures/stay/*.toml` | `config.toml [budget.stay]` |

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
Each step ends on its **done when**. Work them in order; the human approves at steps 1 and 8.

1. **Clarify.** Ask the human a few questions (tone, who's in the party, how it ends, length, anything touching a
   real person or institution), then show a short plan: chapters, minigames, bosses, what gets generated. Done when
   the human approves the plan.
2. **Story.** `docs/adventures/<id>/story-bible.md` (copy `stay/`'s): premise, tone rules, cast roles, chapters. Done
   when every chapter has its maps, minigame, boss and story beat.
3. **Words.** New names, codenames and catchphrases as `<id>_*` keys in `cast.toml [terms]`, fictional defaults only.
   Done when no real name sits in a committed file, and the human has the `cast.local.toml` lines for theirs.
4. **Chapters.** `web/src/data/adventures/<id>/ch1.ts` ... each exporting `CHAPTER` (shape: `web/src/data/types.ts`;
   copy `web/src/data/adventures/stay/ch1.ts`), plus `index.ts` with the play order and `shared.ts` for music cues,
   costumes and portraits. Chapter, enemy and item ids carry the adventure id (`stay1`, `stay_goose`). A map reusing
   another adventure's backdrop reuses its grid too. Done when the content tests pass (step 6).
5. **Campaign.** `web/src/campaigns/<id>.ts` (copy `stay.ts`): its own `id`, `saveKey`, meter and credits.
6. **Register.** One entry in `ADVENTURES` (`web/src/campaigns/index.ts`) and one in `CAMPAIGNS`
   (`web/tests/campaigns.ts`). Done when `scripts/hygiene.sh` passes: the content, reachability, text-fit and meter
   tests now cover every chapter.
7. **Play it with stand-ins.** Missing art draws as placeholder colours and boxes, so the adventure is playable
   before anything is generated. Done when it plays from the menu to the credits (see CLAUDE.md, "Seeing the game").
8. **Manifests, dry runs, ask.** `tools/art/adventures/<id>/pixellab.toml`, `tools/art/cast/<id>.toml` (LPC figures,
   free: `uv run python -m tools.art cast`), `tools/media/adventures/<id>/{music,cutscenes,images}.toml`; ids
   prefixed `<id>_`, and no id in two groups. Add `[budget.<id>]` to `config.toml`. Dry-run every runner with
   `--adventure <id>`, show the counts and costs, and ask. Offer the cheaper shapes too: cutscenes are optional (a
   trope with no `video` plays its still), and so is music (cues can borrow the first game's tracks). Check the keys
   with `test -e secrets.env` (never open it). Done when the human says yes.
9. **Generate.** Pictures, music and portraits first; cutscenes last, since each clip animates its still. Run clips
   one at a time (`--only <clip>`): a Gemini "prohibited content" refusal stops the batch but costs nothing. A
   refused clip keeps its still; drop its `video` from the chapter.
10. **Review.** `uv run python -m tools.art palette --only <id>_`, then `manifest`, then `sheets`, and look at every
    contact sheet in `reports/art/`. Flag any picture with lettering, real-looking insignia, flags or logos, or the
    wrong costume; the human deletes it, and you redraw it after a dry run. A small local pixel fix is fine instead of
    a paid retry; record it in `docs/art-notes.md`. Done when every sheet has been looked at and every flag resolved.
11. **Fit and wire.** Fit every map's grid to its painted backdrop (people on floor, walls on furniture), point the
    music cues at the new tracks, and add portrait overrides to `speakers`. Done when a muted playthrough to the
    credits looks right, the console is clean, and the table above shows the adventure's status.

## The L-Team's art and media
Drawn on 2026-11-05: 48 PixelLab pictures (53 with redraws), 8 Nano Banana crew portraits, 5 Lyria tracks (ledgers in `docs/`).
Then 6 of 7 cutscenes ($3.78). Gemini Omni refused `stay_crew` twice ("prohibited content", nothing charged), so
the crew reveal plays as its still with the slow zoom and `ch1.ts` names no video for it. To try again, soften the
still or its prompt in `tools/media/adventures/stay/cutscenes.toml`, dry-run, ask, then put `video: "stay_crew"` back.
The guard portraits `stay_kim` and `stay_kang` were hand-recoloured to drop collar insignia (`docs/art-notes.md`).
Map grids were fitted to the painted backdrops on 2026-11-05. The van in the garage and the helicopter on the pad
are painted in, so their NPCs are `hotspot: true` (talked to, not drawn).
The title backdrop was redrawn once to drop painted lettering (53 PixelLab pictures in all).
