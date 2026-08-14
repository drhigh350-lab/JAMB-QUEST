# Malformed Answer-Option Audit

## Incident

On 14 August 2026, a learner reported a Physics question where the fourth answer option included scraped answer metadata and the complete explanation. The reported record was the concurrent-forces equilibrium question, whose correct option is **C: 10 N**. The fault came from source extraction: the actual answer/explanation text was appended to the final option rather than stored in the explanation field.

## Containment decision

> **No question with an explanation embedded in an answer option may remain playable.**

The affected rows were not deleted. They were changed from `approved` to `needs_review`, preserving the source ledger for careful repair while immediately removing the malformed content from the learner feed.

| Audit measure | Result |
|---|---:|
| Active approved records detected with answer/explanation spillover | 352 |
| Biology records withheld | 186 |
| Physics records withheld | 166 |
| Malformed records remaining active after containment | 0 |
| Remaining active approved imported records | 1,068 |

The affected material came from the owner-provided **TUTOR DAVE BIOLOGY.pdf** and **TUTOR DAVE PHYSICS.pdf** sources. These records are intentionally held for individual source-safe remediation; no automatic reconstruction of options or canonical answers was performed.

## Permanent prevention

The learner-feed mapper now rejects any imported option containing recognised extraction spillover markers, including `✓`, `©`, `Correct Answer:`, `Explanation:`, and `Why others are wrong:`. A regression test reproduces the reported concurrent-forces record and proves it cannot be exposed in gameplay.

This validation works in addition to the database status gate: a malformed row must both be incorrectly marked `approved` **and** evade the runtime option validator before it could appear to a learner. The current audit confirms that no affected approved row remains.

## Follow-up boundary

The 352 held rows require careful repair against their source material. They should return only when all four options, the canonical answer index, and the explanation are structurally separate and answer-safe. This follows JAMB Quest’s question-quality rule: unclear or malformed records are withheld rather than guessed into the live bank.
