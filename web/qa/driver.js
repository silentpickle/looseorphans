// QA driver: paste into the browser console (or inject it from a tool) and drive the game with synthetic keys.
// Needs window.__game (set in main.ts). Nothing here ships; it is read by the agent's QA runs.
window.__press = (key, code, keyCode, holdMs = 60) =>
  new Promise((r) => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key, code, keyCode, bubbles: true }));
    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent("keyup", { key, code, keyCode, bubbles: true }));
      r();
    }, holdMs);
  });
window.__sleep = (ms) => new Promise((r) => setTimeout(r, ms));
window.__A = () => window.__press("Enter", "Enter", 13);
window.__B = () => window.__press("x", "KeyX", 88);
const DIRS = {
  up: ["ArrowUp", 38],
  down: ["ArrowDown", 40],
  left: ["ArrowLeft", 37],
  right: ["ArrowRight", 39],
};
window.__hold = (dir, ms) => window.__press(DIRS[dir][0], DIRS[dir][0], DIRS[dir][1], ms);
window.__active = (key) => window.__game.scene.isActive(key);
window.__overlay = () =>
  ["dialogue", "battle", "cutscene", "minigame"].find((k) => window.__active(k)) ?? null;
// Press A through any dialogue, battle or cutscene until the overworld is free (or the end/title screen shows).
window.__runUntilIdle = async (maxSteps = 200) => {
  for (let i = 0; i < maxSteps; i++) {
    const over = window.__overlay();
    if (over === null) {
      await window.__sleep(300);
      if (window.__overlay() === null) return `idle after ${i}`;
      continue;
    }
    await window.__A();
    await window.__sleep(over === "battle" ? 450 : 300);
  }
  return "gave up";
};
window.__cell = () => window.__game.scene.getScene("overworld").playerCell();
// Breadth-first path over the map grid (walls '#' and visible NPC cells block), then walk it cell by cell.
window.__path = (cx, cy) => {
  const ow = window.__game.scene.getScene("overworld");
  const grid = ow.map.grid;
  const npcs = new Set(ow.actors.filter((a) => a.sprite.visible).map((a) => `${a.cx},${a.cy}`));
  const from = window.__cell();
  const key = (x, y) => `${x},${y}`;
  const open = (x, y) => (grid[y]?.[x] ?? "#") !== "#" && !npcs.has(key(x, y));
  const prev = new Map([[key(from.cx, from.cy), null]]);
  const queue = [[from.cx, from.cy]];
  while (queue.length > 0) {
    const [x, y] = queue.shift();
    if (x === cx && y === cy) break;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const n = key(x + dx, y + dy);
      if (prev.has(n) || !open(x + dx, y + dy)) continue;
      prev.set(n, [x, y]);
      queue.push([x + dx, y + dy]);
    }
  }
  if (!prev.has(key(cx, cy))) return null;
  const path = [];
  for (let at = [cx, cy]; at !== null; at = prev.get(key(at[0], at[1]))) path.unshift(at);
  return path.slice(1);
};
window.__stepTo = async (cx, cy, maxHolds = 30) => {
  const map = window.__state().map;
  for (let i = 0; i < maxHolds; i++) {
    if (window.__overlay() !== null) return "interrupted";
    if (window.__state().map !== map) return "ok";
    const at = window.__cell();
    if (at.cx === cx && at.cy === cy) return "ok";
    const dir = cx > at.cx ? "right" : cx < at.cx ? "left" : cy > at.cy ? "down" : "up";
    await window.__hold(dir, 60);
    await window.__sleep(15);
  }
  return "stuck";
};
window.__walkTo = async (cx, cy) => {
  const map = window.__state().map;
  const path = window.__path(cx, cy);
  if (path === null) return `no path to (${cx},${cy}) from ${JSON.stringify(window.__cell())}`;
  for (const [x, y] of path) {
    if (window.__state().map !== map) return `warped to ${window.__state().map}`;
    const r = await window.__stepTo(x, y);
    if (r === "interrupted") return `interrupted by ${window.__overlay()}`;
    if (r === "stuck") return `stuck at ${JSON.stringify(window.__cell())} heading for (${x},${y})`;
  }
  return `arrived (${cx},${cy})`;
};
window.__talk = async () => {
  await window.__A();
  await window.__sleep(400);
  return window.__runUntilIdle();
};
window.__state = () => window.__game.registry.get("state");
window.__waitActive = async (key, max = 40) => {
  for (let i = 0; i < max; i++) {
    if (window.__active(key)) return true;
    await window.__sleep(250);
  }
  return false;
};
window.__until = async (key, max = 80) => {
  for (let i = 0; i < max; i++) {
    if (window.__active(key)) return `${key} after ${i}`;
    if (window.__overlay() !== null) await window.__A();
    await window.__sleep(350);
  }
  return `no ${key}`;
};
window.__newGame = async () => {
  await window.__waitActive("title");
  await window.__sleep(300);
  await window.__A();
  return window.__waitActive("overworld");
};
("driver ready");

// Walk with pathfinding, finishing any fight or talk that interrupts on the way (budgets keep calls under ~40 s).
window.__go = async (cx, cy) => {
  for (let t = 0; t < 4; t++) {
    const r = await window.__walkTo(cx, cy);
    if (r.startsWith("arrived")) return r;
    if (!r.startsWith("interrupted")) return r;
    await window.__runUntilIdle(40);
  }
  return "gave up walking";
};
// Walk next to an NPC's cell (pass the cell to stand on) and talk until the overworld is free again.
window.__visit = async (cx, cy) => {
  const w = await window.__go(cx, cy);
  if (!w.startsWith("arrived")) return w;
  return `${w}; ${await window.__talk()}`;
};
("driver ready");
