# ADR 0001: Several adventures in one build, chosen by reloading the page

**Status:** accepted, 2026-11-05.

## Context
The engine began as one game. About fifteen modules read `CAMPAIGN` (through the `@campaign` alias) when they are
imported, to build tables: enemies, items, figures, speakers, the save key, the meter. A second adventure needed a
menu to choose between them.

## Decision
Bundle every adventure (`web/src/campaigns/index.ts`). `@campaign` now points at `web/src/campaigns/active.ts`,
which picks one adventure when the page loads, from `?adventure=<id>`, then the last choice in localStorage, then
`main`. The select scene starts the title directly when the chosen adventure is already loaded. Otherwise it
reloads the page with `?adventure=<id>`.

## Consequences
- The modules that read `CAMPAIGN` did not change, and the first game's pinned output (`main-pin`, `golden`)
  stayed the same.
- A switch costs a reload (a few seconds of boot). Nothing from one adventure leaks into the other's tables.
- Boot loads the LPC figures of the active adventure only (`figureList`).
- To switch without reloading, every module-level table would have to become a function of the campaign. That's
  the larger refactor this ADR avoids.
