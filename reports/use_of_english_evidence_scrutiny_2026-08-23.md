# Active Use of English Evidence-Only Scrutiny — 23 August 2026

## Audit Boundary

This pass is structural and source-preserving. It checks active authorised Use of English records for readable stem presence, raw-markup indicators, valid four- or five-option JSON shapes, answer-index bounds, explanation presence, and topic presence. It does **not** infer answer keys, supply context, rewrite explanations, reclassify topics, or alter learner eligibility.

## Read-Only Profile Findings

The active authorised pool was queried with `questionSources.isActive = 1`, `questionItems.explanationStatus = 'approved'`, and `questionItems.subject = 'Use of English'`. The observed sources had no invalid option-shape, answer-index, or missing-topic flag in the source-by-source profile. One short-stem flag was found in the 95-record JAMB 500 master-bank source and must remain a review sample until source context is inspected.

Two active owner-supplied *The Lekki Headmaster* source records together contain **650 approved learner records** with no stored explanation: Chapters 1–10 has 500 and Chapters 11–13 has 150. Sampled stems are readable chapter-recall prompts, but the absence of explanations is an evidence gap, not a reason to fabricate explanations or remove them automatically. The owner should decide whether these novel questions should remain eligible without explanation cards or should receive source-backed explanation text.

## Safeguard Status

The existing instruction policy remains the only safe presentation repair path during this audit: it adds an idempotent, topic-specific Use-of-English instruction only where the prompt does not already state one. The policy does not alter the tested prompt, options, answer index, explanation, source record, or topic mapping.

## Owner Verification Needed

| Item | Evidence | Required decision |
| --- | --- | --- |
| 650 explanationless *Lekki Headmaster* records | Active, approved sources; readable sampled stems; `explanation = NULL` | Confirm whether to retain them without explanation cards or provide source-backed explanations. |
| One short JAMB 500 master-bank stem | One structural flag in a 95-record source | Review the exact source record before any format-only change. |

No database or learner-bank content was modified in this pass.
