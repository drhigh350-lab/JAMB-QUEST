# JAMB Quest Remaining Checklist Audit

**Purpose.** This audit separates genuinely unfinished verification from deliberately deferred product scope, items that depend on a cleaner owner source, and broad legacy entries that overlap with later completed work. It is the control document for closing the remaining checklist **one item at a time**.

## Item 1 — Completed: signed-in saved-question round trip

The learner confirmed that a saved Study question appeared in **Progress → Saved questions** and reopened correctly. The database verification recorded three distinct persisted bookmarks, including a new bookmark at **2026-08-15 10:26:09**. This closes the overlapping bookmark and revision-loop entries in `todo.md`.

| Checklist entries | Status | Evidence |
|---|---|---|
| Revision planner, bookmarks, and topic drills | **Closed** | Topic drills and revision planning were already implemented; the live bookmark return path has now been confirmed. |
| Persist authenticated saved questions in Progress | **Closed** | A live signed-in learner saved and reopened an exact question from Progress. |
| Browser/DB-backed exact saved-question flow | **Closed** | User flow confirmation plus database evidence of persisted bookmarks. |

## Item 2 — Completed: signed-in profile and learner-account flow

The learner changed and saved a profile target, completed a Study round, refreshed the app, and confirmed the saved target and updated round count persisted. The learner then signed out and confirmed the header returned to the signed-out **“Save my marks”** state. Database evidence recorded a profile update at **2026-08-15 10:34:05** and a completed round at **2026-08-15 10:26:45**, without disclosing profile values or identity.

| Checklist entries | Status | Evidence |
|---|---|---|
| Sign-in-aware UI, signed-out fallback, profile persistence, quiz flow, and source-label behavior | **Closed** | Live user account flow, deterministic learner-card coverage, and the unified topic-only learner-facing question format. |
| Historical upgrade checkpoint and future-upload notes | **Closed** | The project now has repeatable trusted-source intake scripts, source-safe validation, and current checkpoint documentation. |
| Real signed-in profile, round sync, reload persistence, logout fallback, and source labels | **Closed** | Live profile save, Study-round completion, reload, and logout confirmation; persisted profile and round timestamps verified in the database. |
| Broad comeback/provenance/notification/responsive verification | **Closed** | Existing browser coverage plus live reminder delivery and account-flow confirmation. |

## Item 3 — Completed: active explanation-style audit

The active approved imported bank was audited with the same deterministic natural-explanation gate used by the regression suite. It reviewed **1,468** learner-facing approved explanations for label-led templates, prohibited template phrases, duplicated sentences, and repeated sentence stems. **Zero records were flagged.** No owner-supplied explanation was changed or withheld because no active explanation failed the accepted compact teaching-paragraph standard.

| Checklist entries | Status | Evidence |
|---|---|---|
| Replace formulaic generated explanation language | **Closed** | Active-bank style audit found zero formulaic/template-like approved explanations. |
| Regenerate previously AI-written explanations against the authentic-style contract | **Open: style remediation completed; provenance and answer-safety evidence remain** | The approved imported bank has 0 style violations, the repaired active model bank has 0 style violations, and the explicit submitted-rich manifest has 39 active conforming records plus 3 unreleased records. The historical model-bank generation scope and answer-safety evidence still need direct documentation. |

## Remaining work classification

| Priority | Legacy checklist entries | Classification | Next honest action |
|---|---|---|---|
| **Next core verification** | Sign-in-aware UI, profile persistence, and broad source-label checks | **Completed** | Closed as Item 2 using live learner confirmation and persisted profile/round evidence. |
| **Next reminder evidence** | Recurring callback and no-duplicate reminder proof | **Live operational verification** | Capture one scheduled eligible reminder and a second no-duplicate decision from the deployed scheduler when the timing permits; do not manufacture reminder history. |
| **Explanation provenance and depth** | Historical model-bank source scope, answer-safety review, and 838 short active model explanations | **Source-limited evidence and enrichment backlog** | Preserve current wording; document source/release basis and answer safety before any expansion, then deepen only against a trusted source or an explicit owner-approved enrichment brief. |

### Legacy generated-explanation provenance result

The only explicitly traceable legacy AI-conditioned batch is the preserved `submitted_rich_questions.short-enrichment.style-conditioned.output.json` manifest. Its **42** records were reconciled directly against the database: **39** were found as approved, active, style-conforming learner-facing explanations, while **3** have no released database record and therefore remain outside gameplay. Owner-supplied sources without this generation manifest are not described as AI-written by inference.

| Explicit legacy generated set | Regenerated and active | Not released / withheld | Style violations |
|---|---:|---:|---:|
| Submitted rich short-enrichment manifest | 39 | 3 | 0 |

The explicit-manifest evidence and active model-bank audit complete the learner-facing **template-style** review. The broader historical provenance, answer-safety, and explanation-depth review remains open; none of those gaps is represented as a resolved template-style issue.

### Active model-bank audit

The active 1,000-question model bank was inspected directly. Eight explanations contained the prohibited label-led template pattern. They were repaired by removing only the labels—not by changing questions, answers, or explanation substance—and the application now uses the repaired asset. The deterministic audit in `reports/model_explanation_style_audit.json` reports **1,000 total questions**, **0 template-style violations**, and **838 explanations under 25 words**.

The 838 short model explanations are not automatically rewritten or removed because the present model-bank asset does not distinguish authored wording from generated wording at record level. They remain a controlled explanation-depth and provenance backlog; no supplied explanation has been silently changed. A separate answer-safety audit is also still required before the wider historical regeneration item can close.

### Model-bank provenance and structural answer-integrity evidence

`reports/model_bank_provenance_audit.json` identifies a single 1,000-record source set: the **Original JAMB-aligned model practice bank**. The asset metadata explicitly says that it is not official and not copied from past papers. Its metadata and per-record source field do not name an AI writer or generation run, so the set is classified as **historically AI-written: unproven** rather than assumed. The evidence comparison confirms eight label-only explanation repairs, 992 unmodified explanations, zero question-or-answer changes, and zero withheld records.

`reports/model_bank_answer_integrity_audit.json` separately confirms zero structural answer-integrity violations across all 1,000 active model records. The audit verifies non-empty question text; exactly four non-empty, distinct options; no embedded answer or explanation spillover in options; a valid A–D key; and exact agreement between answer text and the keyed option. It deliberately does **not** claim factual correctness, absence of every ambiguity, or syllabus validity beyond metadata. Those content-level claims require trusted-source or expert review and remain outside this deterministic closure.

### Owner-confirmed Lekki Headmaster direct release

The owner confirmed that the previously supplied curated Lekki Headmaster question source is the intended release basis and that a long explanation is not required for each item. The direct importer accepted **109** keyed, four-option questions from `lekki-headmaster-120-keyed-staging.json`; it found **zero** duplicate questions and **zero** structural holds. Database verification confirms that all 109 records in the new active source are approved and playable. The 17 malformed or missing-key records excluded by the earlier parser remain outside this release.

The learner-facing Practice desk now includes a compact **Topics + Lekki novel** panel, with a visible one-tap The Lekki Headmaster 20-question study launch. This provides a direct path to the released source without turning the home screen into a longer feed.

## Item 4 — In progress: real reminder no-duplicate evidence

The deployed project-level Heartbeat job is present and enabled: `daily-comeback-reminder` (task UID `aLjy5X6DvvsNmXBwD69jdf`) posts to `/api/scheduled/daily-comeback` on the six-field UTC schedule `0 0 19 * * *`. It has two successful automatic callback records, on 2026-08-13 and 2026-08-14, with HTTP 200 responses and no retries. Both correctly reported `totalEnabled: 0`, `sent: 0`, and `skipped: 0`; therefore they prove operational scheduling and safe empty-device handling, but do **not** constitute an eligible reminder or duplicate-prevention result.

The next scheduled execution is 2026-08-15 17:31 UTC. The outstanding verification remains intentionally open until the live schedule encounters an opted-in, incomplete learner and records a real send, followed by a later eligible check that records the no-duplicate decision. No manual trigger or fabricated history will be substituted for that evidence.
| **Question-bank source review** | Remaining eligible authentic-question enrichment | **Source-dependent** | Continue only when a clean, answer-safe owner batch is supplied. Existing trusted owner batches are already directly imported. |
| **Lekki Headmaster** | Owner-confirmed 109-question keyed direct batch | **Released** | Directly released with answer keys and no required long explanations; 17 missing-key or malformed records remain withheld. |
| **Future rich Markdown batch** | Next generated/enriched explanation batch | **Awaiting source** | Use the submitted rich source only when the owner supplies it. |
| **Topic-plus-difficulty search** | Search and enhanced filtering | **Intentionally deferred** | Do not build until metadata is reliable and the owner explicitly reprioritises it. |
| **Flashcards, formula vault, AI explanation levels, diagrams, error classification** | Broader learning modules | **Intentionally deferred** | Keep outside the focused JAMB Quest MVP unless explicitly reprioritised. |
| **Checkpoint/setup notes and broad historical verification entries** | Older pre-release checklist items | **Superseded or documentation cleanup** | Close after a brief evidence review; they do not indicate a current learner-facing defect. |

## Closure order

1. **Complete a current signed-in profile/sign-out regression** and close the broad historical auth/profile entries.
2. **Record real reminder no-duplicate evidence** from the deployed schedule without fabricating a send history.
3. **Complete active explanation-style remediation** — **completed**: active imported and model-bank audits now report zero template-style violations. Keep historical model-bank provenance, answer safety, and short explanatory depth as separate controlled backlogs.
4. Leave source-dependent and deliberately deferred work visible but inactive until the required source or explicit prioritisation arrives.

> **Guardrail:** “Unchecked” does not automatically mean “build now.” It may mean a real user action, a dependable source file, a time-based production observation, or an intentionally deferred scope decision is still required.
