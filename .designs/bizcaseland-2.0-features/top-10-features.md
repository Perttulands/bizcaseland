# Top 10 Standout Features for Bizcaseland 2.0

> Generated: 2026-01-06
> Status: Ideation
> Bead: bi-wue

## Executive Summary

These 10 features are designed to make Bizcaseland 2.0 feel magical - not just "Excel with AI" but a genuinely new category of tool. Each feature leverages the core design principles: cell provenance, interrogation, and the quick-to-deep philosophy.

---

## Feature Rankings

### 1. Evidence Trail Visualization

**One-line:** Click any cell to see a visual chain of every source, calculation, and assumption that produced that number.

**Why it's a standout:**
> "Every number in my model is defensible with one click. I walked into the investor meeting knowing I could answer any 'where did this number come from?' question."

This is THE differentiator. Excel cells are black boxes. Bizcaseland cells are transparent - each one can reveal its entire provenance chain as an interactive visualization (not just a tooltip, but a clickable tree of sources).

**Implementation complexity:** Medium
- Requires: Research document linking, calculation graph tracking, tree visualization component
- Builds on: Existing cell provenance architecture

---

### 2. Market Research Auto-Fill

**One-line:** Type a business idea in natural language and watch cells populate with sourced market data in real-time.

**Why it's a standout:**
> "I typed 'SaaS for Finnish physical therapists' and in 30 seconds had market size, competitor count, and growth rates - all with citations. What would've taken me a week took seconds."

This is the "magic moment" - the first experience that shows this isn't just a spreadsheet. The AI researches in the background, fills cells progressively, and each cell links back to its source.

**Implementation complexity:** Medium
- Requires: Web search integration (already planned), progressive cell updates, source citation system
- Builds on: AI service layer, research document system

---

### 3. Assumption Debate Mode

**One-line:** Challenge any assumption and have the AI present bull/bear cases, letting you adjust based on which arguments convince you.

**Why it's a standout:**
> "The AI challenged my 30% conversion rate like a skeptical investor. It showed me why I was too optimistic AND too pessimistic, with data. I ended up at 22% and felt confident about it."

This transforms AI from "answer machine" to "thinking partner." Instead of just accepting AI suggestions, users engage in reasoned debate. Each debate round adds to the cell's evidence trail.

**Implementation complexity:** Medium
- Requires: Structured debate prompts, argument tracking, confidence adjustment UI
- Builds on: AI chat sidebar, cell interrogation flow

---

### 4. Confidence Intervals Mode

**One-line:** Toggle any row to show optimistic/base/pessimistic values that flow through all downstream calculations.

**Why it's a standout:**
> "Instead of one number, I see a range. And when I change an assumption, I see how the uncertainty compounds. I finally understand which assumptions actually matter."

Single-point estimates are fake precision. Ranges are honest. This feature lets users see uncertainty propagate through their model - a feature finance professionals will immediately recognize as valuable.

**Implementation complexity:** Low
- Requires: Triple-value storage per cell, range calculation engine, visual range display
- Builds on: Existing value structure (can extend ValueWithRationale)

---

### 5. Smart Benchmarks

**One-line:** For any metric, see how your assumption compares to industry benchmarks with one click.

**Why it's a standout:**
> "I put 5% monthly churn. One click showed me: B2B SaaS average is 3-5%, B2C is 5-7%. With citations to actual studies. I'm in the right ballpark."

Benchmarks are how users know if assumptions are realistic. Instead of googling "average SaaS churn rate," the system proactively shows relevant benchmarks with credibility scores.

**Implementation complexity:** Medium
- Requires: Metric classification, benchmark database/API, contextual display
- Builds on: Research system, can leverage web search for real-time benchmarks

---

### 6. Investor Lens View

**One-line:** Switch to a view that shows exactly what investors scrutinize, with red/yellow/green flags on questionable assumptions.

**Why it's a standout:**
> "Before my pitch, I switched to Investor Lens. Three red flags: my TAM was too big, my conversion rate too high, and my CAC payback too short. Fixed them before the meeting."

Users building business cases often want to pitch them. This mode shows the model through investor eyes - highlighting assumptions that typically get challenged (unrealistic TAM, hockey stick growth, low churn).

**Implementation complexity:** Low
- Requires: Investor heuristics engine, flag display UI, assumption categorization
- Builds on: Existing data structure, benchmark system

---

### 7. What-If Playground

**One-line:** Drag sliders for key variables and watch the entire cash flow visualization update in real-time.

**Why it's a standout:**
> "I grabbed the price slider and dragged it from $29 to $49. Watched my runway extend from 18 months to 24 in real-time. Then I dragged churn up 1% and watched it shrink back. I FELT the model."

This makes sensitivity analysis visceral instead of abstract. Instead of "sensitivity table," users physically manipulate their model and watch it breathe.

**Implementation complexity:** Low
- Requires: Slider UI, reactive recalculation, smooth chart animation
- Builds on: Existing calculation engine, charts

---

### 8. One-Click Pitch Deck

**One-line:** Export your business case to a professional pitch deck with key slides auto-generated.

**Why it's a standout:**
> "I clicked 'Export to Deck' and got 8 slides: problem, solution, market size, business model, traction, financials, team, ask. Charts were already formatted. My spreadsheet became investor-ready in 30 seconds."

Clear output value. The model isn't just for analysis - it produces deliverables. Deck slides are generated from the model data with appropriate visualizations.

**Implementation complexity:** Medium
- Requires: Deck template system, chart export, narrative generation
- Builds on: Existing data, potentially uses AI for narrative polish

---

### 9. Competitive Intelligence Matrix

**One-line:** Auto-generate a competitor analysis grid with pricing, features, and positioning from web research.

**Why it's a standout:**
> "I entered my idea and it found 7 competitors I didn't know existed. Built a comparison matrix with their pricing tiers, key features, and estimated market share. All sourced."

Competition analysis is tedious but essential. This automates the research and structures it into an actionable matrix that feeds into the business case.

**Implementation complexity:** Medium
- Requires: Competitor discovery prompts, structured extraction, matrix UI
- Builds on: Web search integration, research document system

---

### 10. Voice Interrogation Mode

**One-line:** Talk to your model like asking a CFO: "What if we raise prices 10%?" and see immediate updates.

**Why it's a standout:**
> "I said 'walk me through worst case scenario' and it narrated: 'If churn doubles and growth halves, you hit zero cash in 14 months. Here's what that looks like.' I had a conversation with my business model."

This is the future-feeling feature. Voice makes interrogation natural. The AI can narrate scenarios, explain calculations, and accept voice commands to modify assumptions.

**Implementation complexity:** High
- Requires: Voice recognition, natural language understanding, speech synthesis
- Builds on: AI service layer, cell interrogation

---

## Implementation Priority Matrix

| Rank | Feature | Complexity | Builds On | Recommended Phase |
|------|---------|------------|-----------|-------------------|
| 1 | Evidence Trail Visualization | Medium | Core architecture | Phase 1 |
| 2 | Market Research Auto-Fill | Medium | AI service + web search | Phase 2 |
| 3 | Assumption Debate Mode | Medium | AI sidebar | Phase 2 |
| 4 | Confidence Intervals | Low | Value structure | Phase 1 |
| 5 | Smart Benchmarks | Medium | Research system | Phase 2 |
| 6 | Investor Lens View | Low | Existing data | Phase 1 |
| 7 | What-If Playground | Low | Calc engine + charts | Phase 1 |
| 8 | One-Click Pitch Deck | Medium | Existing data + export | Phase 3 |
| 9 | Competitive Intelligence | Medium | Web search | Phase 3 |
| 10 | Voice Interrogation | High | Full AI stack | Phase 4 |

---

## Notes

**Design constraints applied:**
- Dark mode only (per mayor's comment)
- All features should feel native to the cash-flow-over-time core view
- Each feature should strengthen the "deep provenance" principle

**Features NOT included (considered but rejected):**
- **Living Document Mode** (auto-updates from market data): Cool but introduces complexity around data staleness and version control. Better as v3 feature.
- **Time Machine View** (backtest against history): Requires historical data infrastructure that doesn't exist yet.
- **Collaborative Assumption Voting**: Adds multiplayer complexity before single-player is solid.

---

*Generated by polecat nux for bi-wue*
