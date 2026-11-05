import type Phaser from "phaser";
import { GAME_WIDTH } from "../config";
import type { Dir } from "../data/types";
import { textStyle } from "../ui/theme";
import * as rhythm from "./rhythm";
import type { RunnerFactory } from "./runner";
import type { RhythmSpec } from "./types";
import type { Controls, Point } from "../input/controls";

const HALF = 2;
const CENTER = 0.5;
const LANES: readonly rhythm.NoteLane[] = ["L", "D", "U", "R"];
const ARROWS: Record<rhythm.NoteLane, string> = { L: "←", D: "↓", U: "↑", R: "→" };
const DIR_LANE: Record<Dir, rhythm.NoteLane> = { left: "L", down: "D", up: "U", right: "R" };
const LANE_W = 56;
const LANES_X = GAME_WIDTH / HALF - (LANE_W * LANES.length) / HALF;
const HIT_Y = 280;
const TOP_Y = 110;
const PX_PER_MS = 0.18;
const LANE_COLOR = 0x1b2a6b;
const LINE_COLOR = 0xffffff;
const LINE_W = 2;
const NOTE_SIZE = "22px";
const JUDGE_Y = 300;
const PERCENT = 100;
const JUDGE_COLORS: Record<rhythm.Judgement, string> = { hit: "#7dffb0", near: "#ffd166", miss: "#ff6666" };

function laneX(lane: rhythm.NoteLane): number {
  return LANES_X + LANES.indexOf(lane) * LANE_W + LANE_W / HALF;
}

/** The lane under a tap, or null outside the lanes. */
function laneAt(point: Point): rhythm.NoteLane | null {
  const index = Math.floor((point.x - LANES_X) / LANE_W);
  return LANES[index] ?? null;
}

/** A lane pressed this frame: a key or stick flick, or a tap on the lane. */
function pressedLane(controls: Controls): rhythm.NoteLane | null {
  const dir = controls.pressedDir();
  if (dir !== null) return DIR_LANE[dir];
  const tap = controls.tapped();
  return tap === null ? null : laneAt(tap);
}

function drawLanes(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(LANE_COLOR, 1).fillRect(LANES_X, TOP_Y, LANE_W * LANES.length, HIT_Y - TOP_Y);
  g.lineStyle(LINE_W, LINE_COLOR, 1).lineBetween(LANES_X, HIT_Y, LANES_X + LANE_W * LANES.length, HIT_Y);
}

export const rhythmRunner: RunnerFactory<RhythmSpec> = (scene, spec, depth) => {
  const notes = rhythm.scheduleNotes(spec);
  let t = 0;
  drawLanes(scene.add.graphics().setDepth(depth));
  const sprites = notes.map((note) =>
    scene.add
      .text(laneX(note.lane), TOP_Y, ARROWS[note.lane], { ...textStyle(), fontSize: NOTE_SIZE })
      .setOrigin(CENTER)
      .setDepth(depth + 1),
  );
  const verdict = scene.add
    .text(GAME_WIDTH / HALF, JUDGE_Y, "", textStyle())
    .setOrigin(CENTER)
    .setDepth(depth + 1);
  const place = (): void => {
    notes.forEach((note, i) => {
      const y = HIT_Y - (note.atMs - t) * PX_PER_MS;
      sprites[i]?.setPosition(laneX(note.lane), y).setVisible(note.result === undefined && y >= TOP_Y);
    });
  };
  return {
    step: (_time, delta, controls) => {
      t += delta;
      const lane = pressedLane(controls);
      const result = lane === null ? null : rhythm.press(notes, lane, t);
      if (result !== null) verdict.setText(result.toUpperCase()).setColor(JUDGE_COLORS[result]);
      rhythm.expire(notes, t);
      place();
      if (!rhythm.finished(notes)) return null;
      return { won: rhythm.won(spec, notes), score: rhythm.score(notes) };
    },
    status: () => `score ${Math.round(rhythm.score(notes.filter((n) => n.result !== undefined)) * PERCENT)}%`,
  };
};
