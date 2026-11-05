// A music button in the top-right corner that opens a volume slider. Plain HTML over the canvas, so it works with a
// mouse and with touch; the level is remembered between visits and scales every sound in the game.
import type Phaser from "phaser";
import { CAMPAIGN } from "@campaign";
import { START_VOLUME } from "../config";
import { readSetting, writeSetting } from "../systems/save";

export const VOLUME_KEY = CAMPAIGN.volumeKey;
const PERCENT = 100;
const STEP = 5;
const IDLE_MS = 3000; // the slider closes and the button fades this long after the last touch
const NOTE = "♪";
const MUTED_NOTE = "✕";
const STYLE = `
#vol { position: fixed; z-index: 10; display: flex; align-items: center; gap: 8px;
  top: calc(env(safe-area-inset-top, 0px) + 8px); right: calc(env(safe-area-inset-right, 0px) + 8px);
  font: 600 14px/1 "Courier New", monospace; color: #fff; }
#vol button { width: 36px; height: 36px; border-radius: 50%; border: 2px solid #fff; background: rgba(6, 10, 31, 0.75);
  color: #fff; font: inherit; font-size: 18px; cursor: pointer; }
#vol button:focus-visible, #vol input:focus-visible { outline: 2px solid #ffd166; outline-offset: 2px; }
#vol .panel { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border: 2px solid #fff; border-radius: 8px;
  background: rgba(6, 10, 31, 0.85); }
#vol input { width: 120px; accent-color: #ffd166; }
#vol .panel[hidden] { display: none; }
#vol { opacity: 1; transition: opacity 0.6s ease; }
#vol.idle { opacity: 0.25; }
#vol:hover, #vol:focus-within { opacity: 1; }
@media (prefers-reduced-motion: reduce) { #vol { transition: none; } }
#vol output { min-width: 3.2em; text-align: right; font-variant-numeric: tabular-nums; }
`;

function savedLevel(): number {
  const raw = readSetting(VOLUME_KEY);
  const level = raw === null ? START_VOLUME : Number(raw);
  return Number.isFinite(level) ? Math.min(1, Math.max(0, level)) : START_VOLUME;
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]>,
): HTMLElementTagNameMap[K] {
  return Object.assign(document.createElement(tag), props);
}

export function mountVolume(game: Phaser.Game): void {
  document.getElementById("vol")?.remove();
  document.head.append(element("style", { textContent: STYLE }));
  const level = savedLevel();
  game.sound.volume = level;
  const toggle = element("button", {
    type: "button",
    title: "Music volume",
    textContent: level === 0 ? MUTED_NOTE : NOTE,
  });
  toggle.setAttribute("aria-label", "Music volume");
  toggle.setAttribute("aria-expanded", "false");
  const slider = element("input", {
    type: "range",
    id: "vol-level",
    min: "0",
    max: String(PERCENT),
    step: String(STEP),
  });
  slider.value = String(Math.round(level * PERCENT));
  slider.setAttribute("aria-label", "Music volume");
  const readout = element("output", { textContent: `${slider.value}%` });
  const panel = element("div", { className: "panel", hidden: true });
  panel.append(slider, readout);
  const root = element("div", { id: "vol" });
  root.append(panel, toggle);
  document.body.append(root);

  let idleTimer = 0;
  const rest = (): void => {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    root.classList.add("idle");
  };
  const wake = (): void => {
    root.classList.remove("idle");
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(rest, IDLE_MS);
  };
  toggle.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute("aria-expanded", String(!panel.hidden));
    wake();
  });
  root.addEventListener("pointerdown", wake);
  root.addEventListener("pointermove", wake);
  slider.addEventListener("input", wake);
  wake();
  slider.addEventListener("input", () => {
    const next = Number(slider.value) / PERCENT;
    game.sound.volume = next;
    readout.textContent = `${slider.value}%`;
    toggle.textContent = next === 0 ? MUTED_NOTE : NOTE;
    writeSetting(VOLUME_KEY, String(next));
  });
  // Arrow keys move the slider while it has focus; hand them back to the game once she lets go.
  slider.addEventListener("change", () => {
    slider.blur();
  });
}
