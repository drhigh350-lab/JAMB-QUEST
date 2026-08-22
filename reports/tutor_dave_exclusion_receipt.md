# Tutor Dave Pack Learner-Bank Exclusion Receipt

## Decision

On 23 August 2026, the owner requested that the Tutor Dave material be removed completely from the JAMB Quest learner question bank. The two recorded Tutor Dave sources were therefore made ineligible for learner gameplay by changing their `questionItems.explanationStatus` from `approved` to `needs_review`.

This is an exclusion, not a destructive deletion. Question text, options, answer indices, explanations, external IDs, source records, and provenance remain in the protected audit ledger. The normal learner and Arcade gates accept only `approved` records, so none of the excluded rows can be selected by Practice, CBT, correction, or game modes.

| Source ID | Recorded source | Subject | Records excluded from gameplay | Final learner status |
| ---: | --- | --- | ---: | --- |
| 420003 | Owner-provided Drive: `TUTOR DAVE BIOLOGY.pdf` | Biology | 186 | `needs_review` |
| 420004 | Owner-provided Drive: `TUTOR DAVE PHYSICS.pdf` | Physics | 166 | `needs_review` |
| **Total** | **Tutor Dave pack sources** | **Biology + Physics** | **352** | **not playable** |

## Verification query result

After the update, both source groups reported only `needs_review` records: 186 Biology items under source 420003 and 166 Physics items under source 420004. No `approved` Tutor Dave item remains in either source.
