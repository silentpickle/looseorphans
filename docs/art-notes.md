# Art notes: the PixelLab batch

The batch drew all 105 pieces in `tools/art/pixellab.toml` for 108 pictures on `docs/art-ledger.md`. That covers the two style-lock pieces and three redraws, against a target of 170 and a cap of 200. Every call cost one generation, and the account balance moved by exactly the ledger count.

Prompts that worked: map backdrops in `high top-down` view that ask for "completely empty ... with nothing on the ground and no people" and put "the walkable floor fills the lower two thirds" near the end. Thirteen of the fifteen came out clean on the first take. Side-view battle backgrounds that name "a flat floor in the bottom third" also worked. The K-drama stills worked best of all when each character was described by hair and outfit colour (fluffy black hair in an orange hoodie, neat parted black hair in black) rather than by name. That kept Sol and Rae recognisable across all ten scenes with no names in any prompt. Small transparent objects (props, pet plushes, 64px enemies) needed only the object and "full body" and were all usable first time.

Prompts that did not work: anything that invites a crowd or signage. The first finale-concert backdrop filled the frame with seats and left no floor. Its redraw asks for a wide black stage in the lower two thirds and keeps the crowd to a thin strip at the top edge. The first Squish battle background, an "arena" with "pink stairs", filled itself with garbled game-show lettering. Its redraw asks for a plain painted-sky wall and says "no text". The first Saja leader portrait added a speech bubble of fake letters, and adding "plain background, no text" fixed it. The masks came out loosely: the Front Manager's "square symbol" became a plain respirator. A bare "honeycomb candy" gives a coin with an animal on it, and the logo's "no text" gave a clean compass emblem, but the tiny quokka and cat on its ring are barely legible. Name the shape plainly and keep "no text" in every scene that could hold a sign.

The shared palette: the first palette run used 48 colours built from every pixel, so the large dark backdrops took nearly every slot. The Jester's and the hunter's purples, the Squish Game's green tracksuits, Hosier's green jumper and Sol's orange hoodie all went grey or tan, and mean saturation fell from 0.362 to 0.298. The palette now takes an equal sample from each picture, builds with Pillow's octree, and holds 128 colours. That lifts mean saturation to 0.412 and cuts mean colour error from 19.8 to 12.6. It keeps every character's signature colour. The tracksuits stay a teal green rather than the original grass green, and the bog backdrop drifts toward olive.

Scale check for any composite or review sheet: the overworld draws both the 320x180 backdrop and the 64px LPC
figures at 2x (`BACKDROP_SCALE` and `FIGURE_SCALE` in `web/src/scenes/overworld.ts`), so a figure frame is a fifth
of the backdrop's height. A style-lock composite once drew the figures at 1x, made the cast look
tiny beside the couches, and cost two discarded redraws of `qd_living_room`; the first drawing was right. At true
scale a backdrop's couch should be about twice a figure's height, as in `dorm` and `qd_living_room`.

### 2026-11-05: the L-Team's guard portraits, hand-recoloured
PixelLab drew `portraits/stay_kim` and `portraits/stay_kang` with red collar patches and stars twice, even with
"no insignia" in the prompt, which made the fictional camp read as a real foreign army. Instead of a third paid
take, the saturated red and gold pixels below the chin were recoloured to each uniform's own cloth colour with a
small Pillow pass (red: r > 140 with g and b under 0.45 r; gold: r > 170, g > 0.6 r, b < 55). The cap badges stay.
