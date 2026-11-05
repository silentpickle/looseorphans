// One music track at a time, loaded the first time it's asked for and crossfaded in (assets/music/<id>.mp3).
// Loading and fades run on the always-running touch scene, never on the scene that asked: that scene may be paused
// by a battle or restarted by a warp before the track arrives, and its loader and tweens would stop with it.
import type Phaser from "phaser";
import { MUSIC_FADE_MS, MUSIC_VOLUME } from "../config";

const FORMATS = ["mp3"] as const; // every browser plays mp3, iPhones included; one format keeps the download small
const HOST_SCENE = "touch";
let current: { id: string; sound: Phaser.Sound.BaseSound } | null = null;
let wanted: string | null = null;

function key(id: string): string {
  return `music_${id}`;
}

/** The scene that owns music work: the touch overlay, which runs from boot to the end and is never paused. */
function host(scene: Phaser.Scene): Phaser.Scene {
  return scene.scene.get(HOST_SCENE);
}

function fadeOut(owner: Phaser.Scene, sound: Phaser.Sound.BaseSound): void {
  owner.tweens.add({
    targets: sound,
    volume: 0,
    duration: MUSIC_FADE_MS,
    onComplete: () => {
      sound.destroy();
    },
  });
}

function start(owner: Phaser.Scene, id: string, loop: boolean): void {
  if (wanted !== id) return; // something else was asked for while this one loaded
  const sound = owner.sound.add(key(id), { loop, volume: 0 });
  sound.play();
  owner.tweens.add({ targets: sound, volume: MUSIC_VOLUME, duration: MUSIC_FADE_MS });
  current = { id, sound };
}

/** Switch to a track (no-op if it's already playing). `loop: false` for stings. */
export function playMusic(scene: Phaser.Scene, id: string, loop = true): void {
  if (current?.id === id && current.sound.isPlaying) return;
  const owner = host(scene);
  wanted = id;
  if (current !== null) fadeOut(owner, current.sound);
  current = null;
  if (owner.cache.audio.exists(key(id))) {
    start(owner, id, loop);
    return;
  }
  owner.load.audio(
    key(id),
    FORMATS.map((format) => `assets/music/${id}.${format}`),
  );
  owner.load.once(`filecomplete-audio-${key(id)}`, () => {
    start(owner, id, loop);
  });
  owner.load.start();
}

export function stopMusic(scene: Phaser.Scene): void {
  wanted = null;
  if (current !== null) fadeOut(host(scene), current.sound);
  current = null;
}

export function currentMusic(): string | null {
  return current?.id ?? wanted;
}
