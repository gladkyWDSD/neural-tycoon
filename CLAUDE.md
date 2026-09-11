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

Anything aimed at one player rather than the room (attacks, poaching bids, trades, pacts) is
listed in `ADDRESSED` in `multiplayer.ts` and relayed by the host; add a new message to that array
or it will be dropped in one of the three places messages are handled. The reducer never sends:
it parks the decision in `state.outbox` and `App.tsx` puts it on the wire and clears the slot.
Incoming messages come back as actions (`INCOMING_TRADE`, `TRADE_RESULT`, `PACT_BROKEN`, and the
bid equivalents). Goods are escrowed when an offer is sent and refunded if it is refused, so a
deal in flight cannot be spent twice. Session-only fields (`outbox`, `pendingBid`, `sentBid`,
`pendingTrade`, `sentTrade`, `pacts`) are cleared by `migrateState` on load.

**Difficulty presets.** `DIFFICULTIES` in `constants.ts` sets the week length (`tickMs`, read by
the `App.tsx` clock) plus the player and rival growth multipliers (read by `advanceOneWeek` via
`settingsOf(state)`). Never reintroduce a global growth constant; the run's preset is the source
of truth.

**Rivals simulate themselves.** `runRivalWeek` in `competitors.ts` is a whole company's week:
income, payroll, hiring, hardware, research levels and the model it is building. `advanceOneWeek`
grows their published models and then hands each rival to it. A rival's model quality comes from
`rivalQuality(c)` rather than a constant, and the weekly polish on their live models is capped at
what that lab could build today. Adding a rival behaviour belongs in `runRivalWeek`, not in the
reducer, and anything added to `Competitor` needs a fallback in `migrateState` because saves carry
the rival list.

**The production chain.** Three scarce things drive the strategy and they all read from the same
state. Compute: `cardsTraining` is the sum of `gpus` on models in training, `cardsFree` is what is
left, and `servingCapacity` only counts free cards. Data: `data.ts` owns the sources, the stock
(`state.dataStock`) and `dataInflow`/`dataQualityOf`; `START_MODEL` refuses a run without enough
free cards and enough terabytes, and consumes both. People: every `Staff` has an `assignment`, and
research speed, training quality, curation and serving capacity each read only the people assigned
to that job (`assigned`/`assignedCount`). A change to any of the three moves the whole balance, so
re-run the balance simulation, and teach it the new lever first if a competent player would use one.

**Weekly pressure systems.** `advanceOneWeek` now runs four things in a fixed order that all read
from the same week's numbers: enterprise contracts (paid, or lost on quality or reliability),
serving capacity (users over `activeCards * USERS_PER_CARD` churn), safety debt (decays, then rolls
for an incident), and the hype cycle (drifts, and multiplies everything in `companyValuation`
except cash). Contract seats count as served users, so contracts and capacity are deliberately
coupled — signing a big deal can push you over the line. Balance for all of them is in
`constants.ts`; the scripted run in the balance simulation is the instrument for checking a change
has not made the game unwinnable.

**The President rings about events, not thresholds.** Every call goes through `ringPresident(state,
reason, about)` in `state.ts`, which owns the rules about who gets called and how often. Reducer
cases call it on the way out (`return ringPresident(newState, 'ipo', '...')`), and `advanceOneWeek`
calls it for incidents and new regulations. A new trigger means a new entry in `PRESIDENT_REASONS`
and one call site, not a condition bolted onto the weekly tick.

**Caricature art.** `presidentArt.ts` draws the President as chunky pixels in three moods on one
56x64 canvas, scaled up with `image-rendering: pixelated` in `PresidentCall.tsx`. It is drawn from
scratch in the game's own style, not traced from a photograph, and the lines in `PRESIDENT_LINES`
are invented bluster. Keep it that way if you extend it.

**The run report.** `state.stats` (`RunStats` in `types.ts`) holds what the end-of-run report
cannot work out from the end state: high-water marks, the best and worst weeks, and counts of
hires, departures, poaches and pacts. Peaks and weekly swings are recorded once per week at the
end of `advanceOneWeek`; the counters are incremented in the actions that cause them. A new figure
needs a field in `RunStats`, a default in `freshStats()`, and a row in `RunReport.tsx` — the
`migrateState` merge over `freshStats()` backfills old saves.

**Content is data, not code.** Game content (research tree, model types, pricing tiers, data
tiers, books, GPU costs, social post types, competitor seed data, random events) is defined as
static tables/maps in dedicated `src/game/*.ts` modules (`research.ts`, `gpu.ts`, `social.ts`,
`competitors.ts`, `events.ts`, `hiring.ts`, `amenities.ts`, `constants.ts`) and looked up by id from `state.ts`.
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
competitors/company/ads/government/trading) via its own `useState` — panel switching is UI-only navigation,
not part of `GameState`/the reducer. There is no button bar: every panel is opened from a readout of the thing
it contains. The left rail (`SideNav.tsx`) shows live figures — staff count, weeks of research
left, GPUs, followers — and each tile opens its panel; the top bar's valuation, cash and company
name open Company, and the user/revenue readout opens Competitors. `PanelId` is exported from
`SideNav.tsx`, so a new panel needs an entry there and a readout to hang it on.

**Command parser.** `src/game/commands.ts` parses `/command args` strings from the dev console
into `Action`s (or a plain text response) — it's a thin adapter over the same reducer actions the
UI dispatches, not a separate execution path.
