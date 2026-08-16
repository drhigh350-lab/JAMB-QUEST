# Monday Release Scrutiny

The final scrutiny covered the opening sequence, today’s goal, weakness analysis, grouped syllabus drill entry, question palette placement, and CBT/study navigation. The audit found two functional defects and one responsive-layout defect, all corrected before this report.

| Area | Finding | Resolution | Verification |
|---|---|---|---|
| Weakness analysis | The dashboard selected the oldest 12 persisted rounds, so new learner misses could stop affecting the displayed weak-topic list. | The analysis window now selects the newest 12 rounds in descending completion order. | Focused regression plus full suite passed. |
| Untimed-study ledger | The ledger callback delegated to a CBT-only function, so selecting a palette item in study mode did nothing. | A shared safe navigator now restores selected and completed study-answer state while preserving CBT editability. | Regression coverage and build passed. |
| Mobile palette placement | A narrow-screen CSS rule gave the ledger `order: -1`, visually putting it before the active question. | The reorder rule now preserves natural DOM order, with the question card before the ledger. | Desktop and phone visual audit passed. |
| Opening typewriter | Auto-exit used a predicted duration and the held fixture also stopped the live typing effect. | Exit now waits for actual quote completion, then gives a readable hold; the fixture hold blocks only handoff, not typing. | Opening regression and production build passed. |
| Grouped syllabus drill | Parent sections already expose exact official topics and launch them as `sprint` rounds with `timing: "study"`. | No structure change was required; the repaired shared navigator now makes their question ledger usable. | Existing syllabus grouping coverage and new navigation audit passed. |
| Today’s goal | Today’s mission is launchable and daily activity is persisted per learner/date through round completion. | Confirmed live; the progress card reflects persisted answered counts and daily minimum. | Existing learner and daily-mission coverage passed. |

The suite now reports **43 test files and 112 tests passing**, and the production build succeeds. The only remaining checklist items are source/evidence-bound content and reminder verification work; they are unrelated to the corrected learner flows.
