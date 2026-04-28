---
name: web-ui-debug
description: >-
  Classifies web UI bugs by type, routes to research-backed investigation
  strategies per category, and verifies fixes with a generator-evaluator
  pattern using Playwright. Composes systematic-debugging, qa, and live-preview.
user-invocable: true
auto-trigger: false
effort: high
last-updated: 2026-03-30
knowledge-base: "3. Resources/knowledge/studies/2026-03-30-web-ui-debugging"
---

# /web-ui-debug — Research-Backed Web UI Debugging

## Identity

/web-ui-debug encodes domain-specific knowledge about web UI debugging drawn
from 41 research sources (20 videos, 11 articles, 10 papers). It exists because:

- 91% of IDE sessions never use the debugger (Beller et al., 2018) — this skill
  pushes toward breakpoints, DevTools panels, and hypothesis-driven investigation
  over console.log
- Different UI bug types need fundamentally different investigation strategies —
  a CSS specificity conflict and a memory leak share nothing in common
- Debugging depletes cognitive resources (Starr & Storey, 2026) — the skill
  builds in timeboxing and context resets
- Self-evaluation bias undermines fix quality (Anthropic, 2026) — the skill
  separates generation from evaluation using the generator-evaluator pattern

This is NOT a generic debugging skill (use `/systematic-debugging` for that).
This skill routes by web UI bug category and provides concrete DevTools checklists.

## When to Use

- User reports a visual bug, layout issue, or UI regression
- Keywords: "ui bug", "css bug", "layout broken", "visual bug", "render issue",
  "not rendering", "wrong style", "flickering", "slow interaction", "memory leak",
  "janky scroll", "ui regression"
- Working on `.css`, `.tsx`, `.jsx`, `.vue`, `.svelte`, `.html` files with a bug
- After `/live-preview` shows a FAIL or BLANK result
- When `/do` routes here via Tier 2 keyword match

**When NOT to use:**
- Pure backend/API bugs → `/systematic-debugging`
- Build/type/compilation errors → `/systematic-debugging`
- Feature implementation → `/create-app` or `/scaffold`
- If the bug is not web UI, detect this in Phase 1 and delegate

## Cognitive Load Management

Three rules applied throughout all phases:

1. **Timebox**: Phase 1 max 2 minutes. Phase 2 max 15 minutes per hypothesis
   cycle. If not converging, trigger a context reset.
2. **Context reset**: After 2 failed hypothesis cycles, STOP. Write a structured
   summary of what was tried. Re-read symptoms from scratch. Developers fixate
   on wrong hypotheses — a forced fresh look breaks the cycle.
3. **Investigation journal**: Maintain a running log at
   `.planning/debug-journal-{timestamp}.md` with every hypothesis tested and its
   result. Prevents re-testing the same thing.

## Protocol

### Phase 1: CLASSIFY

Determine the bug category to route to the correct investigation strategy.

**Step 1.1: Collect symptoms**

- Read the error message, console output, or user description
- If a running app exists:
  - Take a screenshot with Playwright (`browser_take_screenshot`)
  - Check browser console (`browser_console_messages` level "error")
  - Check network requests (`browser_network_requests`)
- If no running app, work from the description and source code

**Step 1.2: Classify into one of 7 categories**

| Category | Signals | Primary Tool |
|---|---|---|
| **CSS/Layout** | Invisible, misaligned, overlapping, wrong size, responsive fail | Elements > Computed, Box Model |
| **JS Runtime** | TypeError, ReferenceError, uncaught exception, crash | Sources > Breakpoints, Call Stack |
| **Async/State** | Race condition, stale data, wrong render, state not updating | XHR breakpoints, React DevTools |
| **Performance** | Slow interaction, janky scroll, high INP, layout thrashing | Performance panel |
| **Memory Leak** | Growing memory, page slower over time, detached DOM | Memory panel, Heap Snapshots |
| **Visual Regression** | "It used to look right", after-deploy change | Screenshot comparison |
| **Cross-Browser** | Works in Chrome but not Safari/Firefox, mobile-specific | Playwright multi-browser |

**Step 1.3: Output**

```
BUG TYPE: {category}
CONFIDENCE: {high/medium/low}
SIGNALS: {evidence pointing to this category}
FALLBACK: {secondary category if confidence < medium}
```

If the bug is NOT a web UI bug, say so and delegate to `/systematic-debugging`.

### Phase 2: INVESTIGATE

Hypothesis-driven investigation with category-specific checklists. Composes
`/systematic-debugging` Phase 1-3 but replaces generic instructions with
research-backed, category-specific actions.

**Common protocol across all categories:**

1. Form up to 3 hypotheses with evidence
2. Define a verification step for each (NO code changes yet — observe only)
3. Run verification, eliminate hypotheses
4. If none confirmed after 2 cycles → trigger context reset

---

#### CSS/Layout Checklist

*From research: css-and-visual-debugging, chrome-devtools*

- [ ] Inspect affected element in Elements panel
- [ ] Check Computed tab → Box Model — is width/height/padding/margin expected?
- [ ] Look for crossed-out styles (specificity conflicts, `!important` overrides)
- [ ] Force pseudo-states (`:hover`, `:active`, `:focus`) if bug involves interactions
- [ ] Enable "Emulate a focused page" if element disappears when DevTools opens
- [ ] Set DOM breakpoint on "attribute modifications" if JS dynamically changes classes
- [ ] Check responsive breakpoints with device emulation
- [ ] Run CSS Overview for unused declarations and contrast issues
- [ ] Check for flexbox/grid interpretation differences if cross-browser

#### JS Runtime Checklist

*From research: javascript-runtime-debugging, javascript-debugging*

- [ ] Enable "Pause on Exceptions" in Sources panel
- [ ] Read the full Call Stack — trace back to origin of bad data
- [ ] Set conditional breakpoint at crash site (NOT console.log)
- [ ] Use Scope pane to inspect local/global variable values at breakpoint
- [ ] Set Watch expressions for suspected variables
- [ ] Blackbox third-party libraries (Sources > Ignore List)
- [ ] If TypeScript: run typecheck first — static analysis catches type mismatches

#### Async/State Checklist

*From research: javascript-runtime-debugging, react-debugging*

- [ ] Set XHR/Fetch breakpoints for the relevant API endpoint
- [ ] Set Event Listener breakpoints if unsure which handler fires
- [ ] React: use Components tab to inspect current props/state
- [ ] React: use Profiler with "record why each component rendered"
- [ ] Use Logpoints (NOT console.log) to trace rapidly-changing state
- [ ] Check for stale closures: verify useEffect dependency arrays
- [ ] Set conditional breakpoint to pause when state reaches corrupted value

#### Performance Checklist

*From research: performance-debugging*

- [ ] Record a Performance trace during the slow interaction
- [ ] Check for Long Tasks (>50ms blocks on main thread)
- [ ] Check for Layout Thrashing: repeated read-write cycles (offsetHeight → display)
- [ ] Check INP (Interaction to Next Paint) metric
- [ ] Check for expensive paint: box-shadow, blurred backgrounds, dynamic fonts
- [ ] Check CLS (Cumulative Layout Shift) for visual instability
- [ ] Use Network Waterfall to check for blocking requests or high TTFB

#### Memory Leak Checklist

*From research: memory-leaks, BLeak paper (Vilk & Berger, 2018)*

- [ ] Take Heap Snapshot #1 (baseline)
- [ ] Perform the suspected leaking action 5 times
- [ ] Take Heap Snapshot #2
- [ ] Compare snapshots — look for growing objects, especially detached DOM
- [ ] Use Allocation Timeline to track allocations without frees
- [ ] Check for unclosed event listeners, intervals, subscriptions
- [ ] Check for references holding removed DOM nodes

#### Visual Regression Checklist

- [ ] Take Playwright screenshot of current state
- [ ] Compare against previous known-good state (`.planning/screenshots/`)
- [ ] Check CSS Overview for recently introduced color/font/spacing changes
- [ ] Check git diff on CSS/style files for recent changes
- [ ] Test at multiple viewport sizes (375px, 768px, 1280px)

#### Cross-Browser Checklist

*From research: cross-browser-testing, browser-tools-comparison*

- [ ] Reproduce in Playwright across Chromium, Firefox, and WebKit
- [ ] Safari: Elements → "Inspector", Sources → "Debugger"
- [ ] Check for WebKit rendering differences (flex, grid, box model)
- [ ] iOS bugs require Safari for remote inspection
- [ ] Check for Safari-specific hidden DevTools (must enable manually)

---

**Phase 2 output:**

```
HYPOTHESIS CONFIRMED: {which one}
ROOT CAUSE: {the specific incorrect assumption or logic error}
CAUSAL CHAIN: "{A} does {X} because {Y}, but actual condition is {Z}"
RELATED: {is this pattern used elsewhere?}
```

### Phase 3: FIX & VERIFY

Implement the fix and verify it both functionally and visually.

**Step 3.1: Implement fix**

- Write a failing test case if test framework exists (TDD for bug fixes)
- Apply the minimal fix — change only what addresses the root cause
- Run typecheck/lint to verify no new errors

**Step 3.2: Visual verification** (compose `/live-preview`)

- Ensure dev server is running
- Take Playwright screenshot of affected route/component
- Compare against bug screenshot from Phase 1
- Verify: PASS (renders correctly) or FAIL (bug persists or new regression)

**Step 3.3: Functional verification** (compose `/qa`)

- Write a Playwright test for the specific bug scenario:
  - Navigate to affected page
  - Perform action that triggered the bug
  - Assert correct behavior
  - Take screenshot as evidence
- Run any existing project tests for regression check

**Step 3.4: Emergency stop**

If fix fails twice → go back to Phase 2 with new hypotheses.
Three total failures → root cause analysis was wrong. Escalate to user.

### Phase 4: EVALUATE

Separate generation (the fix) from evaluation (the judgment). This is the
generator-evaluator pattern from the Anthropic harness design article.

**Grading criteria (4 dimensions):**

| Dimension | Question | Score |
|---|---|---|
| **Correctness** | Is the bug actually fixed? | PASS/FAIL |
| **Visual Quality** | Are there layout regressions? | PASS/FAIL |
| **Completeness** | Are edge cases handled? | PASS/PARTIAL/FAIL |
| **Root Cause** | Was the root cause addressed, not just the symptom? | PASS/FAIL |

**Red flags for symptom-only fixes:**
- Adding `!important` to CSS (masks specificity conflict)
- Wrapping in try/catch without handling the error
- Adding `setTimeout` to work around a race condition
- Hiding an element instead of fixing why it renders wrong

**Evaluation options:**
1. If `web-evaluator` agent is available → delegate evaluation to it
2. If running solo → self-evaluate using the rubric above
3. All 4 dimensions must be PASS for acceptance

**Output:**

```
=== EVALUATION ===
Correctness: {PASS/FAIL} — {evidence}
Visual Quality: {PASS/FAIL} — {evidence}
Completeness: {PASS/PARTIAL/FAIL} — {evidence}
Root Cause: {PASS/FAIL} — {evidence}
VERDICT: {PASS / CONDITIONAL PASS / FAIL}
ACTION REQUIRED: {none / specific items}
```

## Quality Gates

1. Phase 1 MUST produce a classification before any investigation begins
2. Phase 2 MUST test at least one hypothesis with observable evidence before code changes
3. Phase 3 MUST produce both a screenshot and a functional test as verification artifacts
4. Phase 4 MUST grade on all 4 dimensions — no "it works" without evidence
5. Investigation journal MUST be written to `.planning/debug-journal-{timestamp}.md`

## Circuit Breakers

- **Time**: >30 minutes total → write handoff summary, ask user for guidance
- **Complexity**: Fix requires 5+ file changes → escalate to `/marshal` or `/archon`
- **Cognitive load**: 2 failed hypothesis cycles → forced context reset with journal dump
- **Emergency stop**: 2 failed fixes → return to Phase 2; 3 total → escalate to user

## Composition

| Phase | Composes | What it reuses |
|---|---|---|
| Phase 2 | `/systematic-debugging` Phases 1-3 | Observe-hypothesize-verify structure |
| Phase 3.2 | `/live-preview` | Screenshot capture and PASS/FAIL classification |
| Phase 3.3 | `/qa` Step 3 | Playwright test pattern (navigate, interact, assert) |
| Phase 4 | `web-evaluator` agent | Read-only 4-dimension grading (optional) |

## Knowledge Graph References

Research notes in Obsidian for in-session reference:

- `3. Resources/knowledge/studies/2026-03-30-web-ui-debugging/answers/effective-tools-and-techniques.md`
- `3. Resources/knowledge/studies/2026-03-30-web-ui-debugging/answers/css-and-visual-debugging.md`
- `3. Resources/knowledge/studies/2026-03-30-web-ui-debugging/answers/javascript-runtime-debugging.md`
- `3. Resources/knowledge/studies/2026-03-30-web-ui-debugging/answers/emerging-debugging-techniques.md`
- `3. Resources/knowledge/studies/2026-03-30-web-ui-debugging/answers/browser-tools-comparison.md`
- `3. Resources/knowledge/studies/2026-03-30-web-ui-debugging/topics/developer-debugging-behavior.md`

## Exit Protocol

```
---HANDOFF---
- Bug: {problem statement from Phase 1}
- Category: {classified bug type}
- Root cause: {one-line cause from Phase 2}
- Fix: {what was changed in Phase 3}
- Evaluation: {4-dimension grades from Phase 4}
- Artifacts: screenshots at {path}, test at {path}, journal at {path}
- Related: {any similar patterns found}
---
```
