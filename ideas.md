# JAMB Quest — Design Brainstorm

## Approach 1: Field Notes Arcade

**Very Brief Intro:** A tactile study desk translated into a game interface: warm paper, ink-blue panels, clipped labels, and energetic orange markers. It makes revision feel physical, focused, and a little playful without looking childish.

**Probability:** 0.07

## Approach 2: Civic Signal

**Very Brief Intro:** A high-contrast public-information system inspired by Nigerian transit signage and exam-center wayfinding. Strong blocks, directional arrows, and disciplined typography create urgency and confidence.

**Probability:** 0.03

## Approach 3: Midnight Scoreboard

**Very Brief Intro:** A dark competitive dashboard with luminous score states, countdown energy, and a tournament atmosphere. It is intense and motivating, but intentionally kept as the only dark-glow direction.

**Probability:** 0.02

## Chosen Direction: Field Notes Arcade

### Design Movement

The visual language draws from **Swiss editorial design, risograph print culture, and tactile studio ephemera**. It should feel like a well-made revision notebook that learned how to become a game: practical first, expressive in the details.

### Core Principles

1. **Every state is legible at a glance.** Question number, timer, subject, progress, and selected state must have a clear visual hierarchy before decoration enters.
2. **Tactility creates memory.** Paper grain, stamped labels, offset ink blocks, ruled lines, and clipped corners make the interface feel handled rather than generated.
3. **Energy comes from contrast, not noise.** Ink navy anchors the experience; maize orange signals action; leaf green confirms progress; chalk cream protects reading comfort.
4. **The game respects the learner.** Feedback is direct and useful. Wrong answers teach; correct answers celebrate briefly and move on.

### Color Philosophy

The palette uses **chalk cream** as the study surface, **ink navy** as the dependable exam-room anchor, **maize orange** for moments that deserve attention, and **leaf green** for earned progress. The colors reference paper, pen, highlighter, and result stamps rather than generic gaming gradients. The emotional intent is calm focus with a pulse of competition.

| Token | Color | Role |
|---|---|---|
| Chalk | `#F6F0E4` | Main reading canvas and paper surfaces |
| Ink | `#12283F` | Navigation, headings, deep contrast, score blocks |
| Maize | `#F4A72C` | Primary action, timer urgency, active choice |
| Leaf | `#3F8C62` | Correct states, progress, streaks |
| Clay | `#C9563D` | Incorrect states and review warnings |
| Mist | `#E8DED0` | Secondary surfaces, dividers, inactive options |

**Signature Brand Color:** Maize `#F4A72C` — an ownable highlighter-orange that makes every meaningful action feel marked and remembered.

### Layout Paradigm

The home screen is an asymmetric study desk: a narrow left rail carries the brand and progress mark, while the main area opens into a broad quiz selection surface. The quiz screen uses a fixed information rail for timer and question map, with the question card offset slightly to the right like a sheet clipped to a board. Results use a tall score receipt on one side and a review ledger on the other. Avoid a centered stack of identical cards; use alignment shifts, ruled baselines, and side labels to create rhythm.

### Signature Elements

1. **The Quest Tape:** a small diagonal maize strip that labels the active mode, such as `QUICK 10`, `CBT 40`, or `REVIEW WRONGS`.
2. **Ink stamps:** chunky circular or rectangular markers reading `CORRECT`, `KEEP GOING`, or `NEW BEST` with slightly imperfect print offsets.
3. **Question ledger:** a numbered vertical map of question states, styled like a punched study index rather than a generic pagination control.

### Interaction Philosophy

Interactions should feel like marking a page. Selecting an option places a confident ink block behind it; submitting creates a short stamp-like confirmation; moving forward slides the current sheet away and brings the next one in. The learner should never lose context: the timer, progress, and question index remain visible. Keyboard shortcuts are supported for option selection and next-question movement, but not announced with noisy modal overlays.

### Animation

Use short, physical transitions: option selection at 140–180ms with a slight translateY and ink-fill reveal; answer confirmation at 220ms with a stamped scale from 0.96 to 1; question changes at 260ms with a horizontal paper-slide and opacity shift. Progress markers should fill from left to right, never pulse continuously. The timer changes from ink navy to maize under 30 seconds and clay under 10 seconds, with a single restrained tick treatment. Respect `prefers-reduced-motion` by replacing all slide and stamp transitions with instant state changes.

### Typography System

Use **Space Grotesk** for display headings and score numerals, paired with **DM Sans** for body copy and controls. Display headings are compact, heavy, and occasionally uppercase; body copy stays sentence case with generous line height. Question stems use 20–26px at desktop and 18–21px on mobile. Options use 16–18px with strong numeric labels. Metadata uses 11–12px uppercase with letter spacing, like printed catalog labels. Do not use Inter.

### Brand Essence

**Positioning:** JAMB Quest is the tactile, high-energy revision game for Nigerian UTME learners who want practice to feel like progress rather than punishment.

**Personality:** focused, bright, encouraging.

### Brand Voice

Headlines are concise and active. CTAs sound like an invitation to attempt, not a sales pitch. Microcopy is warm, honest, and specific; it names the next action and explains the consequence.

Example headline: **“Make the next mark count.”**

Example CTA: **“Start a 10-question sprint”**

Example feedback: **“Not this time. The correct idea is below—lock it in before the next question.”**

### Wordmark & Logo

The mark is a **four-way answer tile**: four offset rectangular tabs form a compact compass-like square, with the upper-right tab lifted in maize to suggest the selected answer and forward motion. It must work without text at favicon size. The wordmark pairs a tight uppercase `JAMB` with a lower, handwritten-feeling `QUEST` lockup, but the logo itself remains symbol-only so it is distinctive in the header and favicon.

### Game Scope

The first playable version includes subject selection, question-count presets, quick sprint and CBT modes, a visible timer, answer selection, submit/next flow, question navigation, score calculation, answer explanations, a result summary, wrong-answer review, streak feedback, and local progress persistence. It uses the bundled 1,000-question JSON bank and does not depend on a backend login.

### Style Decision

All visual and interaction choices should answer this question: **Does this feel like a study sheet that became a game, or like a generic app template?** If it dilutes the tactile editorial direction, do not ship it.

## Style Decisions

- Clay `#C9563D` is reserved for incorrect answers, warnings, and review states. Hero emphasis and forward motion use ink plus maize instead.
- Every primary screen includes at least one signature Field Notes Arcade motif beyond color: Quest Tape, ink stamp, ruled ledger, punched index, clipped sheet, or offset print block.
- The wordmark is treated as a stamped notebook identity: tight uppercase `JAMB`, a slanted maize `QUEST`, and a small `FIELD NOTE` caption.
