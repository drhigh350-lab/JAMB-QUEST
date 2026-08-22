# Questions-Only PDF — Batches 2–4 Release Receipt

## Verified Matching Scope

This release matches three owner-supplied Markdown answer-and-explanation files only to their exact staged `jamb_questions_only.pdf` ranges. Every source question had previously remained non-playable until its matching owner key and explanation arrived.

| Source range | Owner file | Matched and released | Holds |
|---|---|---:|---:|
| Use of English 101–200 | `UoE_Batch2_Q101-200.md` | 100 | 0 |
| Use of English 201–250 | `Batch3_UoE201-250_Bio1-50.md` | 50 | 0 |
| Biology 1–50 | `Batch3_UoE201-250_Bio1-50.md` | 50 | 0 |
| Biology 51–150 | `Biology_Batch4_Q51-150.md` | 100 | 0 |
| **Total** | **Three files** | **300** | **0** |

## Quality and Release Controls

All 300 answer headings and all 300 staged PDF source records were present for their declared ranges. The audit confirmed answer-letter-to-option-text alignment, four or five distinct options, readable learner text, compact non-template explanations, exact official JAMB syllabus labels, idempotent instructions for Use of English, and full normalized question-and-option duplicate screening against the stable 1,000-record model bank and the authorised database ledger.

The import used four unique owner source labels. The guarded release then changed **only** `explanationStatus` from `needs_review` to `approved`; it preserved the external ID, subject, syllabus topic, question text, options, answer index, and explanation for every record.

## Verified Learner Pool After Release

Database verification recorded **8,402 approved owner-authorised questions**: Use of English 1,640; Biology 2,628; Chemistry 2,207; and Physics 1,927. Together with the separate 1,000-record managed model bank, the verified playable pool is **9,402 questions**.

The focused PDF staging and matching tests, TypeScript check, and production build passed. Staged PDF questions without a matching owner answer-and-explanation batch remain non-playable.
