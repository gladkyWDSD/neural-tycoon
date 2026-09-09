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

- **Win:** Be the most-used AI (highest global usage share) for 365 consecutive days.
- **Lose:** Go bankrupt (run out of money).

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
**not** toward the 250k paying customers an IPO needs.

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

### Rival Dirty Tricks

Rivals get the same weapons the player does. Besides buying hype bots and poaching staff, from
**week 9** onward they can unleash a bot army on you:

- **8%/wk** base chance, **−1.5% per marketer** you employ (they moderate your community), floored
  at **1%** — a big marketing team suppresses it but never stops it.
- **75%** of the time it lands: you lose 4–10% of your followers and half that share of every
  published model's customers (trial users included).
- **25%** of the time the swarm is traced back to them: they lose 4–10% of their followers and 30%
  of that flows to you as sympathy followers.

The current risk is shown in the Ads panel, which is also where you launch your own swarms.

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
