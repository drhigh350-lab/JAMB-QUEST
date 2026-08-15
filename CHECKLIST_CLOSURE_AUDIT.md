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

## Remaining work classification

| Priority | Legacy checklist entries | Classification | Next honest action |
|---|---|---|---|
| **Next core verification** | Sign-in-aware UI, profile persistence, and broad source-label checks | **Completed** | Closed as Item 2 using live learner confirmation and persisted profile/round evidence. |
| **Next reminder evidence** | Recurring callback and no-duplicate reminder proof | **Live operational verification** | Capture one scheduled eligible reminder and a second no-duplicate decision from the deployed scheduler when the timing permits; do not manufacture reminder history. |
| **Explanation quality** | Formulaic AI-written explanation cleanup and regeneration | **Content-quality follow-up** | Audit only existing generated explanations against the current style gate; retain or hold records rather than inventing replacements. |
| **Question-bank source review** | Remaining eligible authentic-question enrichment | **Source-dependent** | Continue only when a clean, answer-safe owner batch is supplied. Existing trusted owner batches are already directly imported. |
| **Lekki Headmaster** | Validate keys and explanations | **Source-dependent and paused** | Await a cleaner source with reliable answer-key alignment and question-specific explanations. |
| **Future rich Markdown batch** | Next generated/enriched explanation batch | **Awaiting source** | Use the submitted rich source only when the owner supplies it. |
| **Topic-plus-difficulty search** | Search and enhanced filtering | **Intentionally deferred** | Do not build until metadata is reliable and the owner explicitly reprioritises it. |
| **Flashcards, formula vault, AI explanation levels, diagrams, error classification** | Broader learning modules | **Intentionally deferred** | Keep outside the focused JAMB Quest MVP unless explicitly reprioritised. |
| **Checkpoint/setup notes and broad historical verification entries** | Older pre-release checklist items | **Superseded or documentation cleanup** | Close after a brief evidence review; they do not indicate a current learner-facing defect. |

## Closure order

1. **Complete a current signed-in profile/sign-out regression** and close the broad historical auth/profile entries.
2. **Record real reminder no-duplicate evidence** from the deployed schedule without fabricating a send history.
3. **Audit current generated explanation prose** and hold only records that fail the accepted compact-paragraph standard.
4. Leave source-dependent and deliberately deferred work visible but inactive until the required source or explicit prioritisation arrives.

> **Guardrail:** “Unchecked” does not automatically mean “build now.” It may mean a real user action, a dependable source file, a time-based production observation, or an intentionally deferred scope decision is still required.
