# Neural Tycoon — Game Design Document

A management/strategy game inspired by Game Dev Tycoon, where instead of making
games you run a company that builds **AI models**. Start in 2022 (the start of
the great AI era) with $1,000,000 and grow until your AI is the **most used in
the world for a full year**.

---

## 1. Core Loop

```
Hire staff → Pick a model to build → Allocate staff & compute → Train (time passes)
           → Release → Earn revenue/reputation → Reinvest → repeat
```

---

## 2. Winning & Losing

### Multiplayer
Lobbies are peer to peer. The site is a static page with no server of its own, so players connect
straight to each other over WebRTC and the free public PeerJS broker is used only to introduce
them. Nothing is stored anywhere: the host holds the roster in memory while the tab is open.

- The host gets a **10-character code** drawn from letters, digits and symbols
  (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789#!%@$*+?`, with no 0/O or 1/I/l so it reads cleanly), and
  shares it. Codes are encoded to a safe peer id, since peer ids cannot carry symbols.
- Everyone picks a company name, the host picks the length, everyone presses **ready**, and the
  host starts the race.
- Each player then runs their **own** economy. Only the roster, ready flags and each company's
  valuation cross the wire, sent every three seconds, and the standings show live over the office.
- **First to $100B wins.** The host is the authority on who got there first, and everyone sees the
  result.

#### The host runs the room
The host is the only source of truth for the race. It publishes the week, and everyone else
follows it rather than counting for themselves, so a player who joins after the start, or whose
machine was asleep, lands on the room's week instead of their own. Guests only ever catch up; they
never run ahead.

The clock belongs to the host. During a race their pause button stops the week for **everyone**,
and it is the only pause button that works: a guest's is locked and reads who is holding the clock,
so nobody can quietly freeze their own game to think while the others run.


Only the host sees a **Kick** button, on every other player's row: in the lobby roster before the
race, and in the Competitors panel once it has started. There is also `/kick <nickname>` in the dev
console, with `/players` to list who is in the race. **The dev console itself is the host's alone
during a race**: guests do not get the button and cannot open it with the backtick either, since
the component is not mounted for them. In a solo game everyone has it, and a player who is kicked
out of a race gets it back, because the game returns to solo rules the moment the connection ends. Both refuse politely: a guest is told only the
host can kick, and an unknown name comes back with the list of who is actually there.

- Kicking drops them from the address book first, so no later message reaches them, then tells them
  why and closes the connection.
- Kicked in the lobby, they land back on the join screen with the reason shown.
- Kicked mid race, they keep their company and carry on alone. They just stop appearing in anyone's
  standings and can no longer be attacked or bid against.

#### Dirty tricks between players
The Competitors panel lists everyone in the race, and on a rival's row you can aim the same tricks
you use on AI rivals at a real person. The attacker pays and rolls the risk locally, and only a
paid-for, un-backfired attack travels to the target, where the damage is applied.

| Trick | Cost | Cooldown | Lands as | Risk |
|---|---|---|---|---|
| 🤖 Swarm | $30k | 4wk | They lose 5-12% of followers and half that share of customers | 20% it is traced back and costs you 10% of your followers |
| 💻 Hack | $120k | 8wk | Every published model of theirs loses 8 quality | 25% caught: a $200k fine and 15% of your followers |

The host relays messages, so an attack from one guest to another passes through them. Nothing is
stored: if a player's tab is closed, the attack simply never lands.

#### Bidding for another player's staff
The Competitors panel shows every rival player's roster, with each person's role, level, effective
score and current pay. You pick someone and name a price.

- The **minimum offer** is **6 weeks of their pay**, and you can go as high as you like.
- Making an offer costs a **headhunter fee of 20% of the bid**, immediately and whatever happens,
  so offers cannot be spammed to drain a rival.
- The owner gets a decision: **match the bid** and keep them, or **let them go**.
- Matching costs them the full bid, and that person's salary jumps to what they are now worth,
  because they have just learned their market price.
- Letting them go moves the person, with their level intact, to the bidder, who pays the bid as a
  signing bonus.
- If the winner's office is **full**, the newcomer pushes out their **weakest person of the same
  role**. So taking a level 5 engineer costs you your worst engineer.
- One offer at a time in each direction. A second offer arriving while you are still deciding is
  refused straight away rather than left hanging.

- **Win:** Grow the company to a **$100B valuation**. A victory screen fires the moment you cross
  it, the run is marked won and the game pauses; you can dismiss it and keep building.
- **Lose:** Go bankrupt (run out of money).

### Valuation
Valuation is the headline number, shown in the top bar with a bar tracking the next milestone
(the $1B IPO, then the $100B win). It is:

```
cash
+ weekly revenue x 52 x 20   (annualised revenue at a growth-stage multiple)
+ paying customers x $1,000
+ trial users     x $200
+ followers       x $50
+ completed research x $10M
```

- **IPO** opens at a **$1B valuation** instead of a raw customer count, and floating raises **10%
  of the valuation** in cash plus 50k followers. On subscription pricing that lands at roughly
  550k paying customers.
- **$100B** ends the run.

---

## 3. Money & Compute

Currency is dollars (`$`).

### GPU Cards & Datacenters
- Buy **GPU cards** individually.
- Build **datacenters** out of owned cards (fixed, safe, owned assets).
- **Rent** GPU centers as an alternative — cheaper & faster to spin up, but **risky**:
  a dispute/argument with the provider means you **lose the datacenter** (and its
  current training work).

### Ongoing Costs
- Salaries (per staff, scales with skill)
- Compute (electricity + maintenance for owned, hourly rate for rented)
- Marketing spend
- Legal fees (lawsuits, later)

### Revenue
- Subscriptions per active user
- API usage (per token/call) for enterprise customers
- Higher usage = more revenue

### Promos & Trial Users

A published model can run one promo at a time. While it is active, **new signups arrive as trial
users** held separately from paying customers; existing paying customers keep paying full price
the whole time.

| Promo | Duration | Cost | Growth | Trial users pay | Convert when it ends |
|---|---|---|---|---|---|
| 🏷️ Discount | 3wk | $5k | ×1.6 | 60% of normal | **75%** |
| 🎁 Free access | 2wk | $15k | ×2.6 | nothing | **50%** |

When the promo ends, that share of the trial crowd becomes paying customers and the rest churns
away. Trial users count toward market saturation and the user totals shown in the top bar, but
**not** toward the paying-customer half of the valuation, so a long free promo delays the IPO.

---

## 4. Talent

Hire staff from a job market. Each candidate has a nationality and an **exam
score** from 0 to 200.

### Nationality Specialties
| Nationality | Strength |
|---|---|
| China | Math / research (best at model architecture) |
| Europe | Programming / engineering |
| America | Marketing + Lawyers (sue / defend lawsuits, later) |

### Hiring Filters
- Candidates score 0–200 on exams.
- Minimum hireable score: **150**.
- Filters let you narrow the pool, e.g. `min 180 – max 200` to find elite talent.
- Higher scores = more capable (but higher salary demands).
- Every hire arrives at level 1; see Levels below.

### Models age
A model is not finished when it ships. What matters is not whether yours is the best in the world,
but **how far the world has moved since the day you shipped it**.

- Every published model remembers the best quality in the world on its launch day. Rivals polish
  their models every week and ship successors, so that bar keeps rising.
- Once the world has moved past your launch bar, the model starts losing users, at **0.4% per week
  for every point of drift**, capped at **5% a week**. A brand new model never decays, however
  modest it is, which is what lets a small company get started at all.
- A model that is currently better than anything else in the world grows **1.2% faster per point**
  of its lead.
- Publishing a new model of the same type pulls **35%** of the users off each of your older models
  of that type. Iterating is how you keep a segment.
- The Build panel shows each model's standing: where it placed on launch, and whether it is still
  current, edged past, or dated and due a successor. The news feed warns when the bleed gets
  noticeable.

Left alone, a model that launched second in the world peaks and then settles about **two thirds
below its peak** over a couple of hundred weeks.

### Public benchmark
Every model is scored against every rival model already released the moment it goes live, and the
news feed reports the placing. Topping the chart is only news when the model is also your own best
work so far, which stops re-shipping the same thing to farm followers, and it brings in 15k
followers plus a slice of your existing audience.

### Model quality curve
Raw quality is `(ceiling x realization x GPU factor) + research + data + SSD + books`, where
`ceiling = 25 + avg researcher score x 0.18` and `realization = 0.35 + avg engineer score x 0.001`,
both reading the **effective** score (exam score x level).

That raw number then runs through `100 x (1 - e^(-raw/90))` rather than being clamped at 100. The
clamp used to mean a starting team with a dozen cards already shipped a perfect model in its first
year, which flattened the whole game. With the curve, quality climbs roughly 65 → 78 → 93 → 100
across the first 200 weeks, and each point near the top costs far more than the last.

### Levels (training)
Everyone is hired at **level 1** and can be trained up to **level 10**.

- A person's effective quality is **exam score x level**. Level 10 is worth exactly
  ten of that same person at level 1, and every system that reads talent (model
  quality ceiling, engineering realization, company efficiency, lawyer protection
  against distillation claims) uses that effective number.
- The exam score itself never changes. It is the level-1 helping that each level adds
  another of.
- A course costs **$150k x current level** and takes **2 + current level** weeks, so the
  climb from 1 to 10 costs **$6.75M** and **63 weeks** of that person's time.
- Levelling someone raises their **market salary** with them. A level-10 hire is worth
  several times what you signed them for, and rivals will come for them unless you give
  them a raise, so training and pay have to move together.

### Staff Roles
- **Mathematicians / Researchers** — design the architecture (sets the quality *ceiling*).
- **Programmers / Engineers** — implement & train (determines how close to the ceiling you get).
- **Marketers** (America) — drive adoption / usage.
- **Lawyers** (America) — sue competitors / defend against lawsuits (future feature).

---

## 5. Models

Name your own AI models. Default names are *familiar but legally distinct* parodies:

| Real | In-game default |
|---|---|
| ChatGPT | ChatPT |
| Claude | Clawd |
| Gemini | Geminix |
| Grok | Grak |
| DeepSeek | DeepPeek |
| Llama | Llam |
| Mistral | Mistrall |
| Qwen | Kwen |
| Midjourney | Midway |
| DALL-E | Doll-E |
| Stable Diffusion | Stable Fusion |
| Copilot | CoPilo |

### Model Specializations
- Coding assistant
- Image generation
- General chatbot
- Custom vertical tool (unlock later)

---

## 6. Naming Rules

### Company Name
- Free text, but **profanity filtered** (curse words and f-words rejected).
- Default suggestions: `Anpolus`, `ClosedAI`, `DeepBrain`, `WhyAI`.

### AI Model Name
- Free text with the same profanity filter.
- Default parodies provided (above).

---

## 7. Model Quality (Training)

A model's final quality is determined by:

- **Data** — volume vs. quality tradeoff (scraped vs. licensed).
- **Compute** — GPU hours allocated.
- **Architecture** — determined by researcher (math) skill; sets the ceiling.
- **Engineering** — determined by programmer skill; sets how close you get to the ceiling.

### Distillation (training on a rival's model)

Unlocked by the **Knowledge Distillation** research (`distillation`, requires `llm`, $100k / 3wk).
Once unlocked, any rival model that has already shipped (`releaseWeek <= current week`) can be
picked as a **teacher** when you start training.

- **Cost** — $30k + $1.2k per point of teacher quality, charged up front (you are paying for the
  teacher's API). A quality-90 teacher costs $138k.
- **Quality** — closes **55% of the gap** between the quality you would have reached honestly and
  the teacher's quality. It never lowers a model that is already better than the teacher.
- **Speed** — training takes **60%** of the normal duration (min 1 week); you are learning from
  outputs, not from scratch.
- **Risk** — rolled once, when the distilled model is **published**: 35% base, +15% while the
  **AI Transparency Act** is active, −7% per lawyer (scaled by their exam score), and the whole
  chance is multiplied by 0.4 while lobbyists are active. Floor 5% — you are never fully safe.
- **Caught** — fine of $4k per point of teacher quality, −12% followers, and the accusing rival
  gains +5% followers. The model itself keeps its distilled quality.

Distillation is the catch-up mechanic: it is how a small lab ships a frontier-class model years
early, and the reason lawyers and lobbyists are worth their salary.

---

## 8. Progression & Eras (starting 2022)

Time advances week-by-week. Tech eras unlock new capabilities:

- **2022** — LLMs take off (ChatGPT moment).
- **2023** — Image models mature, open-source explosion.
- **2024** — Multimodal, agents, reasoning models.
- **2025+** — Self-improving systems: **your AI models can program new models**
  (replaces/augments human engineers — the "programmers program models with the
  best models" idea).

---

## 9. Systems to Build

1. **Economy** — revenue, compute costs, salaries, datacenters, GPU cards, renting.
2. **Research Tech Tree** — unlocks architectures & techniques over eras.
3. **Competitors** — rival AI companies race you for usage share (later).
4. **Events / Choices** — safety vs. speed, data scandals, talent poaching (later).

### Game length presets
Every run is played on one of three presets, chosen on the naming screen in single player
and by the host in a multiplayer lobby.

| Preset | Week length | Player growth | Rival growth | Measured run to $100B |
|---|---|---|---|---|
| Easy | 11s | 0.5 | 1.2 | 1.0 to 1.1h |
| Medium | 18s | 0.3 | 1.8 | 1.7 to 2.4h |
| Long | 30s | 0.18 | 2.5 | 3.6 to 4.7h |

The economy knobs set how *hard* the race is; the week length sets how *long* it runs. A win lands
around game week 320 to 500 whatever the settings, because market saturation dominates, so the week
length is what puts that at the advertised hour count.

### The numbers behind it

| Constant | Value | What it does |
|---|---|---|
| `MARKET_GROWTH_PER_WEEK` | 0.03 | How fast the world takes up AI. Every category's market grows by this share of its base size each week, and it is the ceiling everyone competes under. |
| `DIFFICULTIES[].playerGrowth` | 0.18 on Long | Scales every user your own models win. |
| `DIFFICULTIES[].competitorGrowth` | 2.5 on Long | Scales every user a rival's models win. |

Growth multipliers give less than they look like they should, because market saturation partly
compensates for a slower grower. Between 0.35 and 0.25 the finish barely moves at all; only below
about 0.2 does it bite.

A full playthrough, simulated end to end with a competent player, now runs:

| Milestone | Game week | Real time |
|---|---|---|
| First million users | ~150 | 1.2h |
| $1B IPO | 88 to 107 | 0.7 to 0.9h |
| $10B | ~210 | 1.8h |
| $100B win | 447 to 579 | **3.7 to 4.8h** |

Rivals stay ahead on user count until very late — about 41M to your 23M at week 400 — so the
ladder is a contest for most of the run rather than a formality.

### Rival Strength
Rivals are deliberately hard to overtake:

- Their models grow **2.5x** faster than their raw growth numbers suggest.
- They ship a new model on **28%** of weeks and improve every existing model by **0.3 quality** a
  week.
- A company only supports **5 models** at once. Past that, a new release replaces their oldest and
  inherits its users, the way a real successor does, so their strength keeps rising without
  compounding into an unbeatable pile of parallel products.

In practice this leaves rivals roughly **2x larger** than they used to be at the same point in a
run, and pushes the $1B IPO out by about a third.

### Rival companies

Rivals are companies, not growth curves. Each of the six labs runs its own week inside
`runRivalWeek`, on the same scale the player does:

- **Income** from everyone using its models, at $0.50 a user a week.
- **Costs**: every head on the payroll, and the power for every card.
- **Hiring**, one person at a time, when the books can carry them. A lab staffs up to what its
  revenue supports or what its bank will carry for 45 weeks, whichever is higher, so a funded lab
  with no product still grows. The roles it picks are whatever it is short of: engineers when the
  researchers outnumber them, marketers and lawyers once it is big enough to need them.
- **Hardware**: nine cards per engineer, bought in batches when the money is there.
- **Research**, earned by researchers and spent on levels that cost more each time.
- **Building**: with an engineer and a few cards it starts its next model. Training takes nine to
  twenty-eight weeks depending on its engineers and cards, and what comes out is decided by
  `rivalQuality`: research levels, researchers, engineers and cards, softened the same way the
  player's quality is.
- **Succession**: a new model takes 60% of the users of whatever it replaces, and the old one
  becomes a legacy product that barely grows. A lab runs at most four products at once.

Two consequences worth knowing. A lab that stops earning stops hiring, stops researching and stops
shipping, and falls behind for good. And a model's quality only creeps up to what its lab could
build today, so the state of the art now moves because somebody invested in it rather than because
a number ticks every week.

Each lab has a personality: ClosedAI is ambitious and aggressive, Gargle Brain is the biggest
spender and rarely attacks, Anpolus is research-heavy and quiet, xLab is small and picks fights.
Poaching one of their people really does take them off that lab's payroll.

### Rival Dirty Tricks

Rivals get the same weapons the player does. Besides buying hype bots and poaching staff, from
**week 9** onward they can unleash a bot army on you:

- **14%/wk** base chance, **−1.5% per marketer** you employ (they moderate your community), floored
  at **4%**, so a big marketing team suppresses it but never stops it. In practice a small team is
  swarmed about once every 7 to 9 weeks and a heavily staffed one about once every 25.
- **75%** of the time it lands: you lose 4–10% of your followers and half that share of every
  published model's customers (trial users included).
- **25%** of the time the swarm is traced back to them: they lose 4–10% of their followers and 30%
  of that flows to you as sympathy followers.

The current risk is shown in the Ads panel, which is also where you launch your own swarms.

### Serving capacity and outages

Published models are used, not just trained. Every active GPU card serves **25,000** people, and
enterprise seats count too. Go more than 5% past what your cards can handle and the service starts
falling over: up to **6%** of your users a week hit errors and leave, and your following goes with
them. The Datacenters panel shows the load as a bar, and the Compute tile in the rail turns gold
when you are over. Scaling hardware is therefore a permanent job, not a one-off purchase for
training.

### The hype cycle

A single number for how the world feels about AI, between **0.55** and **1.75**. It multiplies
everything the company is judged to be worth except its cash, and half of it feeds through to how
fast strangers sign up. It drifts a little every week, is occasionally shoved by a shock, and turns
around at the ends of its range, so a run has a mania in it somewhere and a winter somewhere else.
The Company panel names the mood; the news feed calls out the turns.

### Safety debt and incidents

Every model you publish adds safety debt: **4** points for shipping at all, **5** more for scraped
data, **10** for a distilled teacher and **8** for a training run under three weeks. It decays by
**1** a week on its own and **0.35** more per researcher.

Debt is the weekly chance that something goes publicly wrong, up to **7%** at the maximum. An
incident is a jailbreak, a hallucination in the press or a regulator opening a case: you lose users,
followers and cash, and some of the debt is cleared by the reckoning. Lawyers do not stop incidents
happening, they cut the damage by **22%** each, up to 70%. A safety audit in the Government panel
clears **35** points for a price that scales with the debt, on a twelve-week cooldown.

### Enterprise contracts

From week 18, companies offer to buy seats. They pay **$2.20** per seat per week against **$0.50**
for a subscriber, for twenty to forty-four weeks, and they hold you to two things: your best live
model staying above a quality floor, and the service staying under **1.25x** capacity. Slip on
either and they leave that week and take a penalty worth six weeks of fees with them. Seats count
against your serving capacity like any other user. Offers go stale after six weeks if you ignore
them.

### Acquisitions

Once you are public you can buy an AI rival outright from the Competitors panel. The price is what
their users and following are worth plus a **40%** premium. **70%** of their users move to your best
model, you keep **40%** of their following, and they stop competing for good.

### Model versions

Publishing a model of a type you already have live migrates **35%** of the older models' users to
the new one on day one. The Build panel says so before you start training, so shipping v2 of a
product is an explicit move rather than something you discover.

### The President calls

If most of your staff are American, the White House takes an interest. From week 14, at most once
every 16 weeks, the President rings up in one of three moods, decided entirely by how you have been
running the place.

| Mood | When | What it does |
| --- | --- | --- |
| Pleased | Best model in the world, worth $1B, or running an enterprise contract | +6% followers |
| Not pleased | Safety debt over 35, living under a rule, caught distilling, or an incident this week | Nothing yet |
| Furious | Safety debt over 70, two rules in force, or an incident on top of real debt | −5% followers, and a 35% chance a new rule lands with the call |

He is a caricature drawn in the game's own pixels, three moods on one canvas, and the lines are
bluster rather than anything anyone said. The dev console can ring him on demand with
`/call happy | annoyed | furious`.

There is no flag on the company itself, so being American is read off the people: you are an
American company when the Americans outnumber every other nationality on the payroll.

### Office life

People do not sit still for eight hours. Every fifty to ninety seconds someone gets up, walks to the
water cooler or to whatever the company has bought, stands there a moment and walks back. It is
worked out from the clock and their id, so it costs nothing and looks the same on every machine.

### Office amenities

Bought once each from the Company panel, and every one of them appears in the office along the
back of the room, so what you have spent is visible in the place you look at all game.

| Amenity | Cost | What it does |
| --- | --- | --- |
| Coffee bar | $180k | +3 quality on every model you train |
| Meeting room | $450k | Research finishes 20% sooner |
| Gym | $900k | Rivals poach your staff 40% less often |
| Cooling loop | $1.4M | 25% off the weekly electricity bill |
| Training room | $2.5M | Staff courses finish 25% sooner |

The two speed bonuses are applied after the duration has been rounded to whole weeks, not before,
or a 20% cut would round straight back up on any short job. Job timers are fractional; only the
display rounds.

### The run report

A single screen of numbers: weeks run, valuation now and at its best, cash, users now and at their
peak, best and worst week, models shipped, best model, research finished, people hired and lost,
who you poached and who was poached off you, compute, laws, pacts signed and torn up, and what you
bought for the office. Most of it cannot be worked out from the end state, so `state.stats` keeps
it as the run goes.

It is shown when the company passes $100B, when a race is decided, and any time from the Run
Report button in the Company panel.

### Trading (multiplayer only)

The Trading tab is where players deal with each other instead of fighting. It appears in the left
rail once a race is running, and every deal is an offer one player makes and another answers.

- **Sell GPUs.** Name a number of cards and a price. The cards are held aside the moment the offer
  goes out, so the same ones cannot be sold twice, and they come back if the offer is refused. New
  cards cost $5,000 each, which is the only price anchor either side has.
- **License research.** Offer any item you have finished. If they accept, it lands on them
  completed: no researcher time, no waiting. You keep your own copy and the money. Research they
  already know is refused rather than paid for.
- **Sell a datacenter.** Built halls only, ten card slots each. Rented ones are not yours to sell.
- **Sell a model.** It goes across with everyone using it. You lose the users and the revenue, they
  gain both, and it lands under an id of their own.
- **Non-aggression pact.** No money, only a promise. For **20 weeks** neither side can swarm or
  hack the other, and the buttons in Competitors say so. Poaching still works, both ways.
  Either side can tear a pact up early, which frees them to attack again and costs them **15%**
  of their followers in public standing. The other player is told at once.

Only one offer can be on the table at a time, in either direction. A pact runs down on the same
clock as research and training, and a save reloaded mid-race keeps neither pacts nor offers,
because both belong to a connection rather than to a company.

---

## 10. Tech & Art

- **Platform:** Web browser game (later: mobile + web).
- **Graphics:** Simple 2D pixel art, top-down view.

---

## 11. MVP Scope (v1)

- Company naming (with profanity filter) + default names.
- Start with $1,000,000.
- Job market with nationality-based skill bias + exam score filters (150+).
- Hire mathematicians (China math bonus), programmers (Europe), marketers (America).
- Build & release one model type; basic economy (revenue, salaries, compute).
- Basic time progression starting 2022.

## 12. Future

- Lawsuits (sue / get sued) with America lawyers.
- Datacenter renting risk events.
- Self-improving AI (AI programs AI).
- Competitors & usage-share race.
