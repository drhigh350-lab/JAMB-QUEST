# Unified Question Bank — Live Reconciliation

## Direct answer

**Yes. The 1,000 managed model questions remain included in normal learner practice, CBT, Syllabus Journey, recovery, and Arcade selection.** They are not separated from the learner pool by source.

The earlier `unified_question_bank_receipt_2026-08-23.md` correctly recorded a **historical snapshot** of **1,000 managed + 8,050 authorised = 9,050** records before exact-ID de-duplication. It must not be read as the current live number after the later safe source replacement.

## Current live calculation

| Step | Count | Verified basis |
|---|---:|---|
| Active approved authorised questions | 8,228 | Read-only database count of `questionItems` joined to active `questionSources`, grouped by subject, after the validated Biology 151–250 and Chemistry 1–200 release. |
| Managed model questions | 1,000 | Protected active model-bank asset and model-bank regression. |
| Current combined pool before ID de-duplication | 9,228 | 8,228 + 1,000. |
| Exact repeated IDs removed by the normal merge | 74 | 9,228 pre-de-duplication records less the 9,154 cards exposed by the live runtime. |
| **Current learner-visible unified pool** | **9,154** | `useQuizGame` merges both banks and removes repeated IDs only. |

The active approved authorised subject counts are Biology **2,540**, Chemistry **2,396**, Physics **1,761**, and Use of English **1,531**. The increase is exactly the **287** records released from owner-supplied answer/explanation files after source matching and full duplicate validation; **13** records remain held outside learner play.

## Why 9,050 became 8,941 before de-duplication

The exact **109-record** difference is not the model bank being removed. The earlier owner-confirmed 109-question Lekki Headmaster source is now intentionally inactive. It was safely superseded by the owner’s fuller chapter-by-chapter Lekki release, so it must not be switched back on merely to inflate a total or risk presenting the retired source alongside its replacement.

## Learner merge contract

Normal learner selection uses the following sequence in `client/src/game/useQuizGame.ts`:

1. Load the managed model bank as `questions`.
2. Load active approved authorised questions as `additionalQuestions`.
3. Combine them as `[...questions, ...additionalQuestions]`.
4. Normalise each topic.
5. Remove only exact repeated question IDs, retaining the first instance.

There is no source-based exclusion at this stage. The same unified array reaches normal Practice, CBT, exact correction/revision recovery, Syllabus Journey, and the three Arcade modes.

## Verification

Focused safeguards passed on 23 August 2026: `server/questionBank.test.ts` (10 tests), `server/readyQuestionCount.test.ts` (3 tests), `server/questionsOnlyPdfBatches5To7.test.ts` (3 tests), and `server/modelBankEnglishInstructionRepair.test.ts` (1 test). The 287 new owner records were released only after deterministic answer-to-option matching, exact official-topic resolution, format checks, and duplicate screening against both the active authorised ledger and protected model asset. No protected field was changed after import; only eligibility moved from `needs_review` to `approved`.
