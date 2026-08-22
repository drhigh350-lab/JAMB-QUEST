# Owner Biology and Physics 250-Batch Release Receipt

**Release date:** 22 August 2026  
**Source files:** `pasted_content.txt` through `pasted_content_16.txt`  
**Declared ranges:** Biology 101–250 and Physics 1–250

## Intake Outcome

All 16 submitted files were read as inert text only. The audit parsed the declared 400 question blocks, found **zero internal duplicate fingerprints**, and screened every record against the managed 1,000-question model bank and the authorised question ledger using the complete normalized question-and-options fingerprint. The parser also converted mathematical source notation to readable Unicode before testing the final learner text; no raw LaTeX or Markdown was retained in the staged records.

| Gate | Biology | Physics | Total |
|---|---:|---:|---:|
| Declared source records | 150 | 250 | 400 |
| Parsed complete records | 150 | 250 | 400 |
| Internal duplicate holds | 0 | 0 | 0 |
| Model/ledger duplicate holds | 0 | 0 | 0 |
| Structural, context, key, formatting, explanation, or syllabus holds | 0 | 0 | 0 |
| Released to playable approved status | 150 | 250 | 400 |

Each released question has four usable options, a supplied A–D answer target, a compact source-specific explanation, readable Unicode maths where required, and a topic mapped to an exact official syllabus area. Biology records map only to approved Biology labels such as **Respiration**, **Heredity**, **Population ecology**, and **Humans and environment**. Physics records map only to approved Physics labels such as **Measurements and units**, **Motion**, **Current electricity**, **Electromagnetic induction**, and **Modern physics**.

## Narrow Release Record

The import created two owner-provided source groups: **150 Biology records** and **250 Physics records**. The release step changed only `explanationStatus` from `needs_review` to `approved` after final schema validation. It preserved `externalId`, `subject`, `topic`, `questionText`, `optionsJson`, `answerIndex`, and `explanation` exactly as staged.

## Verified Current Learner Pool

The authoritative approved authorised ledger now contains **7,755** questions: **2,478 Biology**, **1,959 Chemistry**, **1,927 Physics**, and **1,391 Use of English**. Combined with the separate managed **1,000-question** model bank, JAMB Quest now has **8,755 approved playable questions** toward the 10,000-question target.

## Validation Evidence

The final staged payload passed the authorised import schema for all 400 records. Focused Biology/Physics intake regression tests passed (4 tests across 2 files), TypeScript passed with no errors, and the production build completed successfully. The detailed machine-readable audit, schema-validation, and narrow release receipts are retained alongside this report.
