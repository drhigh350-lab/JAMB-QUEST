# Chemistry DOCX Intake Summary — 15 August 2026

The supplied Chemistry DOCX contains **321 structured question records**. The quality-first intake processed the candidate records in ten bounded explanation batches rather than importing the document blindly.

| Intake outcome | Count |
| --- | ---: |
| Structured records parsed | 321 |
| Candidate records with valid four-option structure, answer key, and syllabus mapping | 197 |
| Candidate records processed with uniform four-line explanations | 197 |
| Records held before release | 124 |
| Exact duplicate within the supplied document | 1 |
| Exact duplicate against the stored Chemistry bank | 2 |
| Structural holds | 0 |
| Unmapped or ambiguous topic holds | 122 |

The 197 candidate records retain their supplied question wording, options, and answer keys. Their explanations were normalised into a medium learner-facing style of four readable lines and their topics were assigned from the official Chemistry syllabus taxonomy. Each batch passed the authorised import schema and duplicate-safe source ledger.

The 124 held records were not silently discarded. They remain in `reports/chemistry_docx_audit.json` with deterministic hold reasons. The 122 unmapped records require a more precise official syllabus classification; the duplicate candidates require source-level review before any release decision. This preserves the **Quality Before Quantity** rule and prevents the 10,000 target from being inflated with uncertain records.

Verification after the final batch passed **89 Vitest tests**, TypeScript checking, and the production build. The learner-facing count will not increase until the imported Chemistry records complete the final approved/playability review.
