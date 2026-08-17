# Held Diagram-Candidate Reclassification — 17 August 2026

> This reconciliation distinguishes record status from visual need. It does **not** approve or import any new question.

## Result

| Group | Candidate count | Current handling |
| --- | ---: | --- |
| Already playable without a diagram | 11 unique candidates | Remain live because their wording is complete and answerable without a visual. The underlying database query returned 13 active rows for these candidates because `chem-docx-010` and `chem-docx-015` each have an approved item under two distinct historical source records. |
| Ordinary no-diagram candidates | 35 | Not present in the active question records. They require the usual source, answer, explanation, duplicate, and official-syllabus checks before any future release; no diagram is required. |
| Original-figure-dependent holds | 2 | `biology-dr-high-0012` and `biology-dr-high-0013` refer to labelled arrows but have no attached source figure. They were removed from gameplay by changing their status to `needs_review`; no guessed replacement visual was created. |

## Database reconciliation

The original lookup returned **15 active approved database rows** across 13 unique external IDs. Two rows—`biology-dr-high-0012` and `biology-dr-high-0013`—were then identified as incomplete because `diagramUrl` was null while their question text depended on omitted labels. They are now protected holds. The remaining 13 active database rows correspond to 11 unique, text-complete candidates.

## Follow-up boundary

The two protected Biology records can only return to gameplay when the owner supplies their original labelled figures or gives an explicit, answer-aligned replacement specification. The 35 ordinary candidates should be processed as normal question-intake work rather than diagram work.
