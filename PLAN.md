# Game Plan: JAMB Quest

## Risk Tasks

### 1. Question-bank loading and normalization

- **Why isolated:** The game depends on a large remote JSON asset, and a malformed response or answer-index convention mismatch would break every quiz round.
- **Approach:** Load the storage URL once, validate the metadata and question shape at runtime, normalize options to A–D, and expose a loading/error state instead of attempting to render partial data. Use the bank’s zero-based `answer_index` consistently.
- **Verify:** The home screen leaves loading state, a quiz round displays a real question from the bank, submitting the marked answer compares against the correct index, and a failed fetch produces a readable retry state.

### 2. Timed round state machine

- **Why isolated:** Timer expiry, submit state, question navigation, and answer feedback can race if they are scattered across UI handlers.
- **Approach:** Keep one explicit round state with `setup`, `active`, `answered`, and `complete` modes. Use a single interval tied to the active round, clear it on mode changes, and make answer submission idempotent.
- **Verify:** The timer starts only after a round begins, never goes below zero, auto-submits or marks the question expired at zero, cannot double-submit, and is disposed when leaving the round.

## Main Build

Build a client-only JAMB quiz game with a tactile study-sheet visual system. The home screen offers four subject tiles, quick presets, CBT mode, review-wrongs mode, and local best-score/progress summaries. The quiz screen shows a timer, question ledger, selected state, submit/next controls, and answer explanation. The result screen shows score, accuracy, streak, subject mix, and actions to retry, review wrongs, or return home.

- **Assets needed:** Generated logo, paper texture, score sticker, subject collage, visual-target reference, and uploaded question-bank JSON.
- **Verify:**
  - Subject selection and question-count presets start the expected round.
  - Options are keyboard reachable and have visible focus/selected/correct/incorrect states.
  - Timer, question progress, score, streak, and question ledger stay synchronized.
  - Explanations appear after submission and the next-question transition does not lose the answer state.
  - Results persist locally and review-wrongs shows only questions missed in the current session.
  - UI is readable and unclipped at desktop and narrow mobile widths.
  - Generated logo and subject collage are visible in the composition; no placeholder image is used.
  - No browser console errors or failed asset requests during the captured run.
  - Visual QA remains faithful to `ideas.md` and the visual-target reference: cream paper, ink navy, maize actions, editorial labels, tactile depth.
