/// <reference types="vitest/config" />
// Settings come from ../config.toml at build time; the game reads them from the CONFIG constant (src/config.ts).
// One campaign (src/campaigns/main.ts) is bundled through the `@campaign` alias.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "smol-toml";
import { defineConfig } from "vite";
import type { Plugin } from "vite";

const CONFIG_PATH = resolve(import.meta.dirname, "..", "config.toml");
const CAST_PATH = resolve(import.meta.dirname, "..", "cast.toml");
const CAST_LOCAL_PATH = resolve(import.meta.dirname, "..", "cast.local.toml");

type Table = Record<string, unknown>;

function readToml(path: string): Table {
  return parse(readFileSync(path, "utf8")) as Table;
}

/** Two levels deep: a local file may replace one key of one member and leave the rest of the defaults alone. */
function overlay(base: Table, local: Table): Table {
  const merged: Table = { ...base };
  for (const [key, value] of Object.entries(local)) {
    const mine = merged[key];
    const isTable = typeof value === "object" && value !== null && typeof mine === "object" && mine !== null;
    merged[key] = isTable ? overlay(mine as Table, value as Table) : value;
  }
  return merged;
}

/** cast.toml, overlaid by the gitignored cast.local.toml unless CAST_DEFAULTS=1 asks for the defaults alone. */
function loadCast(): Table {
  const defaults = readToml(CAST_PATH);
  const useLocal = process.env.CAST_DEFAULTS !== "1" && existsSync(CAST_LOCAL_PATH);
  const merged = useLocal ? overlay(defaults, readToml(CAST_LOCAL_PATH)) : defaults;
  return { ...merged, source: useLocal ? "local" : "defaults" };
}

const cast = loadCast();
const settings = parse(readFileSync(CONFIG_PATH, "utf8")) as Table;
settings.game = { ...(settings.game as Table), ...(cast.game as Table) };

/** The settings and the cast are baked in at startup, so a change to config.toml or a cast file restarts the dev server. */
function restartOnConfigChange(): Plugin {
  return {
    name: "restart-on-config-change",
    configureServer(server) {
      const watched = [CONFIG_PATH, CAST_PATH, CAST_LOCAL_PATH];
      server.watcher.add(watched);
      server.watcher.on("change", (path) => {
        if (watched.includes(path)) void server.restart();
      });
    },
  };
}

const CAMPAIGN_FILE = resolve(import.meta.dirname, "src", "campaigns", "main.ts");

export default defineConfig({
  base: "./",
  resolve: { alias: { "@campaign": CAMPAIGN_FILE } },
  define: { __SETTINGS__: JSON.stringify(settings), __CAST__: JSON.stringify(cast) },
  plugins: [restartOnConfigChange()],
  test: { include: ["tests/**/*.test.ts"] },
});
