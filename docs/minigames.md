# Minigames: three engines, nine skins

A chapter asks for a minigame with a `minigame` action: `{ kind: "minigame", spec, onWin, onLose }` where `onWin` and
`onLose` are dialogue ids. The scene sets the flag `minigame:<spec.id>:won|lost`. Specs live in
`web/src/minigames/types.ts`; pure rules live beside them and are unit-tested; `web/src/scenes/minigame.ts` only draws.

## Timing bar (done: `minigames/timing.ts`, drawn by `timing-runner.ts`)
A marker sweeps the bar edge to edge at `sweepsPerSecond`; the sweet spot is centred with width `window`
(fraction of the bar). Press A inside it to score a hit; `rounds` hits win, `lives` misses lose. `invert: true`
makes the centre the danger zone (press only outside it).

| Skin | Chapter | rounds / lives / speed / window | invert | Notes |
|---|---|---|---|---|
| Red Light, Green Light | 2 | 5 / 2 / 0.6 / 0.35 | yes | The doll's head turns while the marker is in the red; the prompt says "Move only when she looks away" |
| Tea pouring | 3 | 3 / 2 / 1.0 / 0.18 | no | "Pour when the cup is exactly full"; a miss spills on the Queen Mother |
| Bass-off | 5 | 4 / 3 / 1.4 / 0.22 | no | Lio vs Hosier; each hit drops the pitch of a sting |
| Archery (palace) | 3, optional | 3 / 2 / 1.8 / 0.14 | no | A prince's contest; a win raises the meter by 1 |

## Rhythm (done: `minigames/rhythm.ts`, drawn by `rhythm-runner.ts`)
`pattern` is one lane per beat at `bpm`; `.` is a rest. Notes scroll down four lanes (left, right, up, down) toward
a hit line; a press of that direction within ±120 ms of the beat is a hit, within ±220 ms a near, otherwise a
miss. Score = (hits + near/2) / notes; `passScore` wins. The first beat lands after a 1.5 s lead-in. On a phone the
D-pad stick flicked out of neutral counts as a press in that direction.

| Skin | Chapter | bpm | pattern length | pass |
|---|---|---|---|---|
| My Shot rap battle | 6 | 96 | 32 beats, denser each verse | 0.7 |
| Dance battle vs the Saja Boyz | 7 | 120 | 48 beats | 0.75 |

## Grid puzzle (done: `minigames/grid.ts`, drawn by `grid-runner.ts`)
A small grid of glyphs with a cursor (arrows) and A to act; `moves` bounds the attempts. Three rules:
- **trace** (dalgona, ch 2): `#` is the shape to trace, `.` is cookie. A on a `#` cell marks it; A on a `.` cell is a
  crack (counts against `moves`). Win when every `#` is marked.
- **surround** (baduk, ch 4): `o` are the bully's stones, `.` empty, `x` yours. A on an empty cell places a stone;
  win when every `o` group has no empty neighbour; `moves` stones allowed.
- **path** (glass bridge, ch 2): one letter per row, `L` or `R`, the safe pane (hidden from the player); A on the
  left or right pane of the current row; a wrong pane costs a life (`moves`); reach the last
  row to win. Jun's hint shows the first two rows when the player has the `roast_logic` flag.

Rules: `fresh(spec)`, `apply(spec, state, cell)`, `isWon`, `isLost` (out of moves and not won), `score`. Trace and
path lose when `used` reaches `moves`; surround's last stone can still win.

## Difficulty
Everything is tuned so she wins on the second try at most. On a loss the `onLose` dialogue lets her retry (the
chapter data re-runs the same action), so the game never dead-ends.
