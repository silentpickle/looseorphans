import Phaser from "phaser";
import { CAMPAIGN } from "@campaign";
import { GAME_HEIGHT, GAME_WIDTH } from "./config";
import { bootWithHandover } from "./hot";
import { getState } from "./registry";
import { TouchScene } from "./input/touch";
import { BattleScene } from "./scenes/battle";
import { BootScene } from "./scenes/boot";
import { CreditsScene } from "./scenes/credits";
import { CutsceneScene } from "./scenes/cutscene";
import { DialogueScene } from "./scenes/dialogue";
import { EndScene } from "./scenes/end";
import { MinigameScene } from "./scenes/minigame";
import { SelectScene } from "./scenes/select";
import { OverworldScene } from "./scenes/overworld";
import { TitleScene } from "./scenes/title";
import { watchForCrashes } from "./ui/crash-note";
import { writeSave } from "./systems/save";
import type { SaveData } from "./systems/state";
import { mountVolume } from "./ui/volume";

watchForCrashes();
document.title = CAMPAIGN.settings.title;

// A module change reloads the page: a hot-swapped scene would leave two games running.
import.meta.hot?.accept(() => {
  window.location.reload();
});

// Hot module replacement re-runs this file: tear down the previous game so only one ever runs.
window.__game?.destroy(true);

// ?qa=1 drives the loop with timers instead of requestAnimationFrame, so a QA driver can play in a background tab.
const QA_FLAG = "qa";
const qaRun = new URLSearchParams(window.location.search).has(QA_FLAG);

function createGame(): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game",
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    pixelArt: true,
    backgroundColor: "#000000",
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    fps: { forceSetTimeOut: qaRun },
    scene: [
      BootScene,
      TouchScene,
      SelectScene,
      TitleScene,
      OverworldScene,
      DialogueScene,
      BattleScene,
      CutsceneScene,
      EndScene,
      MinigameScene,
      CreditsScene,
    ],
  });
}

/** The progress to hand to the next version: the live state if a game is underway, else nothing. */
function currentSave(): SaveData | null {
  const game = window.__game;
  if (game === undefined) return null;
  const state = getState(game.scene.getScene("boot")) as ReturnType<typeof getState> | undefined;
  if (state === undefined || state.map === "") return null;
  const overworld = game.scene.getScene("overworld") as OverworldScene;
  if (game.scene.isActive("overworld") || game.scene.isPaused("overworld")) {
    const here = overworld.playerCell(); // where she stands now, not where she entered the map
    state.x = here.cx;
    state.y = here.cy;
  }
  return state.toSave();
}

bootWithHandover(currentSave, (save) => {
  if (save !== null) writeSave(save);
  const game = createGame();
  window.__game = game;
  mountVolume(game);
});
