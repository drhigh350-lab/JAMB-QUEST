# JAMB Quest Final Scrutiny — 23 August 2026

## Audit position

This was a **release-grade systems audit**, not a claim that every historical question has been externally re-marked. It checked the current learner-bank boundary, core learning routes, CBT protection, device-only learning tools, responsive rendering, motion safeguards, runtime logs, and executable validation. No reproducible high-priority application defect was found in this pass, so protected questions, answer keys, options, explanations, diagrams, and source records were not changed.

> The owner’s physical screening remains the appropriate final authority for any question-specific wording, answer-key, source-context, or original-figure concern. Such findings should be reported by question ID so they can be audited without changing unrelated cards.

## Verified state

| Area | Evidence reviewed | Outcome |
|---|---|---|
| Question-bank boundary | Read-only database reconciliation and the runtime merge contract | **7,941** approved active authorised records: Biology 2,442; Chemistry 2,207; Physics 1,761; Use of English 1,531. Together with the protected 1,000-record managed bank, this is 8,941 records before exact-ID de-duplication. The live learner display is **8,867**, meaning 74 repeated IDs are removed by the normal merge rather than shown twice. |
| Content safeguards | Full test suite, question-bank, formatting, explanation, syllabus, five-option, and import protections | The active quality boundary remains intact. No source content was silently rewritten during the audit. |
| Practice and recovery | Standard practice, English context, five-option CBT, calculator, topic and Lekki launch, recovery-empty state, submitted explanation card | The tested cards remain legible at phone width; the ledger remains below the question; five-option answers and answer feedback render correctly. |
| CBT safety | CBT flow, saved resume, full mock, exam review, and historical correction safeguards | Separate CBT state and read-only historical correction flows remain protected. The real learner-facing saved-CBT card is styled in the Practice panel; a plain resume screen observed during review is an isolated test fixture, not a production route. |
| Syllabus and revision | Syllabus Journey, visible awaiting-topic states, exact five-card quiz, Revision Return Queue | Official topics remain visible even without matching approved cards. Quiz evidence, local revision returns, and exact-question recovery stay separate from mastery claims and CBT history. |
| Arcade isolation | Arcade hub, President’s Desk, Great Archive | All three worlds retain their device-only profile/progression boundary and approved-question selection without creating CBT history. |
| Persistence and PWA | Existing regression coverage, Profile review, runtime log check | Local resume/offline controls, browser-push states, and PWA controls are present. No active browser-console errors or failed recent network requests were found. |
| First-entry and motion | Opening fixture, global reduced-motion rule, phone/desktop checks | The opening cursor remains a short ink marker. Intentional maize accents remain. A global `prefers-reduced-motion: reduce` safeguard is present. |
| Build health | Vitest, TypeScript, and production build | **105 test files / 258 tests passed**. TypeScript passed. The production build completed successfully. |

## Visual review

The current product has a coherent **Field Notes Arcade** identity: chalk-paper ground, navy study surfaces, maize tape/stamp accents, ledger navigation, and illustrated study-game worlds. The compact default state now makes Practice and Progress calmer on both phone and desktop. Question cards remain the clearest part of the learner experience: subject/topic framing, option spacing, feedback, and question ledger all read reliably in the reviewed phone fixtures.

The desktop review found deliberate workspace composition rather than a stretched phone stack. Progress is particularly calm when empty, and Profile makes the independent reminder, offline-pack, and achievement controls easy to locate. No overlapping controls, unreadable contrast, broken layout, or dead-end route was found in the reviewed states.

## Refinement opportunities — not blocking defects

| Priority | Opportunity | Reason and safe next step |
|---|---|---|
| High | Reduce the main JavaScript bundle | The production build reports a **1.18 MB** main JavaScript asset before gzip (272 kB gzipped). Route-level lazy loading for non-core screens such as Arcade, Syllabus Journey, owner review, and share-card generation is the most defensible performance refinement. It should be measured before and after rather than undertaken blindly. |
| Medium | Tighten maize into a more physical marking role | Maize is strong as tape, tabs, stamps, underlines, and action edges. Some large filled panels could shift visual weight back to navy and paper while preserving clear calls to action. This is a visual-system refinement, not an accessibility repair. |
| Medium | Strengthen the quiz’s study-sheet identity | The core quiz is clean and functional. A future visual pass could make the clipped-sheet, question-ledger, answered/flagged stamp, and ruled-note cues even more distinctive without moving or obscuring answer controls. |
| Medium | Continue standardising the branded shell | Primary screens share the JAMB Quest system identity well. Future empty, warning, recovery, and optional utility states should keep the same compact mark, ledger cue, and navy/maize action hierarchy. This must be judged against real production states—not test-fixture scaffolding. |
| Low | Compress explanatory text into sharper field-note units | Longer optional instructional panels could use more labels, receipts, and short active statements. This should not shorten approved question explanations or remove necessary learner guidance. |

## Owner physical-screening checklist

For each physical review finding, record the **question ID**, subject, screen, and a short description. The most useful categories are: answer key; missing instruction or passage; incorrect or unclear option; topic mismatch; explanation issue; broken/missing diagram; accessibility/contrast; layout/overflow; loading/offline behavior; and animation/motion. Include a screenshot when the issue is visual.

Do **not** infer an answer key from a picture alone. If an original diagram is necessary to answer a question, preserve the source figure or mark the card for source-backed review rather than inventing the figure. A specific ID allows an exact repair and regression test without destabilising the rest of the bank.

## Scope limits retained deliberately

The audit did not modify protected historical question wording, answer keys, option text, diagrams, source identifiers, or authorisation status. It also did not claim real push delivery from a test fixture, factual correctness of every item, or mastery from a syllabus confirmation. The older 9,050 receipt remains a historical snapshot; the live count above is the current runtime reconciliation and should be used for future UI/count discussions.
