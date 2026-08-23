# Unified Learner Question-Bank Receipt

**Checked:** 23 August 2026

JAMB Quest now presents one learner-facing playable pool. The distinction between the managed model asset and authorised database records is preserved only as internal provenance for quality audit and owner review; it is not a learner selection boundary.

| Component | Verified count | Evidence |
|---|---:|---|
| Managed model asset v5 | 1,000 | Local managed-storage asset `jamb_high_yield_practice_bank_1000_model_v5_explanations_reviewed.json` was counted directly. |
| Approved authorised database records | 8,050 | Live database count after the non-destructive Tutor Dave exclusion. |
| Combined learner-facing pool before ID de-duplication | 9,050 | 1,000 managed records + 8,050 approved authorised records. |

The live `useQuizGame` runtime loads the managed model asset as `questions`, receives approved authorised records as `additionalQuestions`, creates `[...]questions, ...additionalQuestions]`, normalises learner topics, and removes only repeated IDs. It does not filter a learner’s practice, CBT, Arcade, or Syllabus Journey session by source label.

> The model questions are part of the normal JAMB Quest bank. Source labels remain for auditability, not to create a separate learner bank.

The owner-only review desk may show source evidence on an individual record so quality work remains traceable. Learners receive the unified eligible pool, subject to their chosen subject/topic and the ordinary exact-ID de-duplication rule.
