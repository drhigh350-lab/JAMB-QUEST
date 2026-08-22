# Questions-Only PDF — Use of English 1–100 Release Receipt

## Source and Matching Scope

The owner-supplied `jamb_questions_only.pdf` was previously staged as inert, non-playable source text. The staged file contains **1,000 complete records**: 250 each for Use of English, Biology, Chemistry, and Physics. It contained **zero embedded per-question answer markers**.

This receipt covers only `UoE_Batch1_Q1-100.md`, matched deterministically to the staged **Use of English questions 1–100** by source subject and question number. The audit did not create, repair, or infer any answer, explanation, topic, diagram, or missing context.

| Outcome | Count | Status |
|---|---:|---|
| Markdown answer entries parsed | 100 | Complete source batch |
| Staged PDF questions in matching range | 100 | Complete source range |
| Released records | 99 | Approved for learner queries |
| Held records | 1 | Remains out of gameplay |

## Release Controls

Each released record passed full normalized question-and-option duplicate screening against the stable 1,000-record model bank and the authorised database ledger, four-option distinctness, answer-letter-to-option-text alignment, readable text checks, compact explanation checks, an exact official Use of English syllabus label, and the idempotent explicit-instruction policy.

The protected release step updated **only** `explanationStatus` from `needs_review` to `approved`. It did not alter the external ID, subject, topic, question text, options, answer index, or explanation.

| Held ID | Reason | Disposition |
|---|---|---|
| `PDF-OWNER-20260822-ENG-031` | The heading supplies **B — old**, while its own explanation explicitly states **Correct answer: A — modern**. | Held unchanged; no key was chosen or corrected by inference. |

## Verified Learner Pool After Release

The database verification recorded **8,102 approved owner-authorised questions**: Use of English 1,490; Biology 2,478; Chemistry 2,207; and Physics 1,927. Together with the separate 1,000-record managed model bank, this makes **9,102 approved playable questions**.

Focused staging and batch-release regressions passed, as did the TypeScript check and production build. The remaining 900 questions from the PDF remain non-playable until their matching owner answer-and-explanation batches are supplied and pass the same gates.
