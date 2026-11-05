// The artifact viewer delivers a new version of the game into a page that is already open. Without help, the new
// bundle starts a second game over the first one and play is lost. With this, the old game hands over its progress
// (snapshot) and the new one picks it up and goes straight back to the map, past the title screen.
import type { SaveData } from "./systems/state";

interface Hot {
  snapshot?: (capture: () => unknown) => void;
  ready?: (start: (data: unknown) => void) => void;
  data?: unknown;
}

interface HotData {
  save?: SaveData | null;
}

function hot(): Hot | undefined {
  return (window as { claude?: { hot?: Hot } }).claude?.hot;
}

let resumeRequested = false;

/** True once, when this boot came from a live update that carried a save: the title should Continue by itself. */
export function takeResumeRequest(): boolean {
  const asked = resumeRequested;
  resumeRequested = false;
  return asked;
}

function handedOverSave(data: unknown): SaveData | null {
  if (typeof data !== "object" || data === null) return null;
  return (data as HotData).save ?? null;
}

/** Register what to hand over, then run `start` with the save the previous version handed over (or null). */
export function bootWithHandover(
  capture: () => SaveData | null,
  start: (save: SaveData | null) => void,
): void {
  const viewer = hot();
  viewer?.snapshot?.(() => ({ save: capture() }) satisfies HotData);
  const begin = (data: unknown): void => {
    const save = handedOverSave(data);
    resumeRequested = save !== null;
    start(save);
  };
  if (viewer?.ready !== undefined) {
    viewer.ready(begin);
    return;
  }
  begin(viewer?.data ?? {});
}
