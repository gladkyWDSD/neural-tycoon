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

**Time progression.** `App.tsx` runs one `setInterval` (`JOB_TICK_MS`, 250ms) that drives two
clocks off the same elapsed time:

- `TICK` fires once per accumulated 30s (1 game week = 30s real time, `TICK_MS`) and calls
  `advanceOneWeek` in `state.ts`, which in a single pass charges salaries/electricity/rent,
  resolves rental-dispute and regulatory risk, grows/ships competitor models, grows the player's
  published models and revenue, and rolls random news/events.
- `ADVANCE_JOBS` fires every step with a fractional `delta` in weeks and calls `advanceJobs`,
  which counts down everything the player watches finish: research, staff training, model
  training, datacenter construction, and the campaign/lobby durations. `weeksRemaining` is
  therefore fractional — round it (`Math.ceil`) when displaying weeks.

The split exists so a job that costs "1 week" takes a full week from the moment it was started
instead of completing at whatever moment the next week boundary lands on, and so the office
progress bars can be driven straight off the real timers. `advanceOneWeek` must never touch a job
timer, or it would run at double speed.

The dev console's `/setweek N` fast-forwards by replaying `advanceJobs(advanceOneWeek(state), 1)`
in a loop. Any new per-week effect must be added inside `advanceOneWeek`, and any new countdown
the player waits on inside `advanceJobs` (not scattered elsewhere), so real-time play and
fast-forward stay in sync.

**Multiplayer is peer-to-peer and outside the reducer.** `src/game/multiplayer.ts` owns a
`LobbySession` (WebRTC via the public PeerJS broker, script loaded on demand from cdnjs) that
holds the lobby roster, ready flags and each player's valuation. It never touches `GameState`:
each player simulates their own economy, and the only reducer involvement is `START_GAME`, which
resets to a fresh company on the agreed difficulty. `App.tsx` owns the one session instance and
reports the local valuation every 3s while a race is running.

**Difficulty presets.** `DIFFICULTIES` in `constants.ts` sets the week length (`tickMs`, read by
the `App.tsx` clock) plus the player and rival growth multipliers (read by `advanceOneWeek` via
`settingsOf(state)`). Never reintroduce a global growth constant; the run's preset is the source
of truth.

**Content is data, not code.** Game content (research tree, model types, pricing tiers, data
tiers, books, GPU costs, social post types, competitor seed data, random events) is defined as
static tables/maps in dedicated `src/game/*.ts` modules (`research.ts`, `gpu.ts`, `social.ts`,
`competitors.ts`, `events.ts`, `hiring.ts`, `constants.ts`) and looked up by id from `state.ts`.
Adding new content (e.g. a research item or model type) means extending these tables, not the
reducer, unless the new content needs genuinely new mechanics.

**Save/load and schema migration.** State auto-saves to `localStorage` on change, debounced by a
second because job timers update several times a second (`save.ts`) and is validated by `migrateState()` in `state.ts` on load, which merges saved data
over `initialState()` and backfills fields added after older saves were written. Whenever a field
is added to `GameState`/`AIModel`/`ResearchProgress`, add a corresponding fallback in
`migrateState` so existing saves don't break.

**Screens vs. panels.** Top-level navigation is a tiny state machine (`Screen`: `title` →
`naming` → `main`, with `title` → `lobby` → `main` for multiplayer), driven by `state.screen` and
rendered by `App.tsx`. Once in `main`,
`GameScreen` manages a separate local `panel` selection (hire/build/research/twitter/datacenters/
competitors/company) via its own `useState` — panel switching is UI-only navigation, not part of
`GameState`/the reducer.

**Command parser.** `src/game/commands.ts` parses `/command args` strings from the dev console
into `Action`s (or a plain text response) — it's a thin adapter over the same reducer actions the
UI dispatches, not a separate execution path.
