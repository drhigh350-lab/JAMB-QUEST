# Managed Model Bank — English and Physics Presentation Repair Receipt

## Scope

This receipt covers the separate 1,000-record managed model asset used by JAMB Quest. It does not change owner-authorised database questions.

| Area | Audit result | Safe repair applied |
|---|---:|---|
| Use of English | 250 records reviewed; 183 prompts lacked an explicit learner instruction; zero visible-source context holds after review | Added deterministic question-type instructions only; answer keys, options, explanations, topics, diagram fields, and source metadata were unchanged |
| Physics | 250 records reviewed; 89 records contained learner text improved by notation rendering | Extended display-only Unicode formatting for numerical and grouped exponents plus common Latin/Greek formula subscripts; zero unresolved learner-format records remain |

## English Instructions

The repaired model asset preserves all 1,000 question records. The preparation script proved that only `question` text changed for the 183 eligible Use of English records and rejected any protected-field change. Instructions are now specific for reading/comprehension, grammar, lexis and idioms, vowel/consonant/sound relationships, stress, and general oral English prompts. No passage, answer, explanation, topic, or context was inferred.

## Physics Formatting

Learner cards and review screens now present examples such as `m/s²`, `Iᵣₘₛ`, `ρ(object)`, `μₛ`, and grouped decay exponents in readable Unicode rather than exposing raw `^` or underscore source notation. Stored source wording remains intact; conversion occurs only when text is shown to a learner.

## Verification

The repaired model asset passed the existing formatting gate for all 1,000 records. Its post-repair English audit found **zero** remaining instruction-only repairs and **zero** context holds. The Physics presentation audit found **zero** unresolved learner-format records. Focused instruction, asset-protection, and learner-text regressions passed, as did TypeScript validation and mobile question-card visual review.
