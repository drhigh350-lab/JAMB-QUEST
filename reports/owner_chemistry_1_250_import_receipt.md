# Owner Chemistry 1–250 Release Receipt

**Release date:** 22 August 2026  
**Source files:** `pasted_content.txt` through `pasted_content_10.txt`  
**Declared range:** Chemistry 1–250

## Intake Outcome

The ten submitted files were handled strictly as inert text. The audit parsed all **250** declared question blocks and found **zero internal duplicate fingerprints**. Each candidate was screened against the managed 1,000-question model bank and the authorised ledger using a full normalized question-and-options fingerprint. Learner-visible formula content was converted to readable Unicode before the final formatting gate; staged records contain no raw Markdown or LaTex.

| Gate | Count |
|---|---:|
| Declared source records | 250 |
| Parsed complete records | 250 |
| Internal duplicate holds | 0 |
| Model-bank or authorised-ledger duplicate holds | 0 |
| Released to playable approved status | 248 |
| Held | 2 |

All **248 released records** have four usable distinct options, a supplied valid A–D answer target, a compact source-specific explanation, readable Unicode mathematical notation where applicable, and an exact official Chemistry syllabus label. The final schema validation approved all 248 staged records across the permitted labels, including **Chemical combination**, **Atomic structure and bonding**, **Solubility**, **Electrolysis**, **Chemical equilibria**, **Organic compounds**, **Environmental pollution**, and **Chemistry and industry**.

## Held Records

| External ID | Reason |
|---|---|
| `CHEM-OWNER-20260822-R2-166` | The source contains two options that normalize to the same expression, `a + b + c + d`, leaving an unusable distinct option set. |
| `CHEM-OWNER-20260822-R2-234` | The supplied key says option D, while its source note and the formula `Q = It` give 3,600 C, which is option C. The key was preserved and the unsafe record was not released. |

## Narrow Release Record

The importer created a single owner-provided Chemistry source group with 248 records. The release changed only `explanationStatus` from `needs_review` to `approved`; it preserved `externalId`, `subject`, `topic`, `questionText`, `optionsJson`, `answerIndex`, and `explanation` exactly as staged.

## Verified Current Learner Pool

The authoritative approved authorised ledger now contains **8,003** questions: **2,478 Biology**, **2,207 Chemistry**, **1,927 Physics**, and **1,391 Use of English**. Together with the separate managed **1,000-question** model bank, JAMB Quest now has **9,003 approved playable questions** toward the 10,000-question target.

## Validation Evidence

The final staged payload passed the authorised import schema. The focused Chemistry intake regression suite passed all 3 tests, TypeScript completed with no errors, and the production build completed successfully. Detailed machine-readable audit, schema-validation, and release receipts are retained beside this report.
