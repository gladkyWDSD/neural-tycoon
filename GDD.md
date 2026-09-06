# AI Tycoon — Game Design Document

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
