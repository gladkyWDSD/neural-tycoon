# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Neural Tycoon — a Game Dev Tycoon-style management/strategy browser game where you run an AI
company starting in 2022: hire staff, train/release AI models, manage GPUs/datacenters, market
against rival AI companies, and try to become the most-used AI in the world. Full design spec is
in `GDD.md` — read it when working on game mechanics/balance, since gameplay rules (nationality
bonuses, exam score thresholds, era unlocks, etc.) live there, not in code comments.

## Commands

```bash
npm run dev      # start Vite dev server (http://localhost:5173)
npm run build    # tsc -b (project references) + vite build
npm run lint      # oxlint
npm run preview   # preview a production build
```

There is no test suite/framework configured in this repo.

In the running game, press `` ` `` (backtick) to open the dev console for cheats (`/setweek`,
`/setmoney`, `/finish`, `/researchall`, etc. — see `src/game/commands.ts` for the full list).
This is the fastest way to manually verify changes to late-game systems without waiting through
real-time ticks.

## Architecture

**Single reducer drives the whole game.** `src/game/state.ts` defines `GameState`, the `Action`
union, and the `reducer(state, action)` function — this is the entire game logic layer. `App.tsx`
holds the only `useReducer` call and passes `state` + dispatch-wrapping callbacks down through
`GameScreen` to panel components as props; components never mutate state or contain game rules
themselves, they just call the `on*` callbacks passed down.

**Time progression.** `App.tsx` runs a `setInterval` that dispatches `TICK` every 30s (1 game
week = 30s real time, configurable via `TICK_MS`). `TICK` calls `advanceOneWeek` in `state.ts`,
which in a single pass: charges salaries/electricity/rent, progresses datacenter construction and
research, resolves rental-dispute risk, grows/ships competitor models, grows the player's
published models and revenue, and rolls random news/events. The dev console's `/setweek N`
replays `advanceOneWeek` in a loop to fast-forward — any new per-week effect must be added inside
`advanceOneWeek` (not scattered elsewhere) so both real-time ticks and fast-forward stay in sync.

**Content is data, not code.** Game content (research tree, model types, pricing tiers, data
tiers, books, GPU costs, social post types, competitor seed data, random events) is defined as
static tables/maps in dedicated `src/game/*.ts` modules (`research.ts`, `gpu.ts`, `social.ts`,
`competitors.ts`, `events.ts`, `hiring.ts`, `constants.ts`) and looked up by id from `state.ts`.
Adding new content (e.g. a research item or model type) means extending these tables, not the
reducer, unless the new content needs genuinely new mechanics.

**Save/load and schema migration.** State auto-saves to `localStorage` on every change
(`save.ts`) and is validated by `migrateState()` in `state.ts` on load, which merges saved data
over `initialState()` and backfills fields added after older saves were written. Whenever a field
is added to `GameState`/`AIModel`/`ResearchProgress`, add a corresponding fallback in
`migrateState` so existing saves don't break.

**Screens vs. panels.** Top-level navigation is a tiny state machine (`Screen`: `title` →
`naming` → `main`), driven by `state.screen` and rendered by `App.tsx`. Once in `main`,
`GameScreen` manages a separate local `panel` selection (hire/build/research/twitter/datacenters/
competitors/company) via its own `useState` — panel switching is UI-only navigation, not part of
`GameState`/the reducer.

**Command parser.** `src/game/commands.ts` parses `/command args` strings from the dev console
into `Action`s (or a plain text response) — it's a thin adapter over the same reducer actions the
UI dispatches, not a separate execution path.
