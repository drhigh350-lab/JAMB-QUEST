# Public Keyed Source Review — 16 August 2026

## Findings

The current runtime count is 4,952 learner-facing questions: 3,952 authorised records returned by the runtime mapper plus the 1,000-question model asset. The database contains 4,304 active approved authorised rows, but 352 are excluded because their options contain embedded answer/explanation metadata that violates the runtime gate.

Public source review found three materially different source types:

| Source | What was exposed | Intake suitability |
| --- | --- | --- |
| Awajis JAMB CBT subject pages | A 20-question interactive CBT shell. The rendered page exposes question text and options, but not the correct answer or explanation in the initial DOM. | Not safe for bulk answer-keyed intake without a separate answer source or verified per-question results. |
| Myschool subject index pages | Question/year, options, and links to individual explanation pages. Biology, Chemistry, and Physics indexes expose hundreds of paginated records. | Potentially usable only where the individual detail page is separately retrieved and the user’s source license covers reuse. |
| Myschool Biology detail page `https://myschool.ng/classroom/biology/287?exam_type=jamb` | Complete question, five options, explicit correct option `b`, and an explanation. The record is tagged JAMB 1978. | Structurally answer-bearing, but do not bulk-import until the user’s license/permission is confirmed for this specific source or the user supplies an export. |

## Public URLs reviewed

- https://jambcbt.awajis.com/biology/
- https://jambcbt.awajis.com/chemistry/
- https://jambcbt.awajis.com/physics/
- https://jambcbt.awajis.com/english/
- https://myschool.ng/classroom/biology?exam_type=jamb
- https://myschool.ng/classroom/chemistry?exam_type=jamb
- https://myschool.ng/classroom/physics?exam_type=jamb
- https://myschool.ng/classroom/biology/287?exam_type=jamb

## Decision

No web question has been imported from these pages. The runtime count is 4,952, so exactly 48 additional learner-playable records are needed to cross 5,000. The Awajis CBT shell is not answer-bearing in its initial markup. Myschool detail pages expose explicit correct-option letters, but the raw response does not include the explanatory paragraph shown by the browser-rendered page; therefore the 15-record bounded sample produced zero release-ready cards under JAMB Quest’s explanation gate. The safe next path is either a user-provided licensed export/answer key with explanations or a source export that includes the explanation text. No answer is guessed and no incomplete question is released on source-page evidence alone.
