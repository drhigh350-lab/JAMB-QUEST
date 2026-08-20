# JAMB Quest question-bank contract

JAMB Quest presents learners with **one unified practice bank**. The application does not expose internal question files, source packages, explanation-batch exports, or audit JSON to learners.

| Layer | Purpose | Learner-facing treatment |
|---|---|---|
| Managed model-bank asset | Versioned core questions and approved supplied explanation updates | Loaded through the single `QUESTION_BANK_URL` reference in `client/src/game/questionBank.ts` |
| Authorised database questions | Additional approved questions and source-backed visual links | Combined into the same practice and CBT pool when eligible |
| `reports/` evidence workspace | Intake receipts, quality gates, diagnostics, and provenance records | Never shown in the learner interface and never loaded as bank content |

> The active managed model-bank asset is deliberately stored in managed static storage rather than committed as a large duplicate JSON file. This keeps deployed builds reliable while preserving one versioned, auditable bank reference in source code.

## GitHub synchronization

The repository’s `main` branch is the source-code handoff for the verified JAMB Quest project. After each future validated checkpoint, the corresponding committed source changes are pushed to `main`. The `reports/` directory remains grouped separately as internal safety evidence, not as a question-bank package.
