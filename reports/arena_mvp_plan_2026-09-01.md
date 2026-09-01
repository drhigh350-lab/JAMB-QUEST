# JAMB Quest Arena: MVP decision record

## Product decision

The Arena should become a competitive learning home, not a second social network. The first milestone must make competition easier to discover and understand while keeping the current safe question and scoring rules. Fancy community systems will wait until the core loop is trusted.

## What already exists

The current Challenge Mode lets a signed-in creator name a challenge, choose 5–30 approved questions, create a share code, and copy a link. A learner can open a shared link, see the challenge, answer the same question set, submit one attempt, and enter a global challenge leaderboard. The server checks approved question eligibility again when a challenge is read and submitted. Scores use correct answers first and completion time as the tie-breaker. The current interface now supports all four approved subjects and has Play, See leaderboard, and Create your own actions.

The project also has learner progress, subject performance, achievements, daily activity, reports, owner-only report status changes, owner question review, diagram audit, and a single approved question-bank query. Those existing systems are important Arena inputs. They should be reused rather than copied into a second question bank.

## What must be preserved

The existing share-link format and `?challenge=CODE` route must keep working. Existing `publicChallenges` and `challengeAttempts` data must not be deleted or rewritten destructively. The approved-question guard, one-attempt rule, score ordering, four-subject scope, owner report protections, owner-supplied-image rules, and Lekki Headmaster separation must remain unchanged. Public community features must never allow users to type their own academic questions in the first Arena release.

## What should improve first

The most valuable first improvement is discoverability. A learner should enter Arena and quickly understand what is available, what they have done, and where they stand. This means a compact Arena Home with a personal summary, a list of real public challenges, subject filters, challenge status, and a route into the existing challenge flow. It should not yet add chat, unrestricted following, clubs, tournaments, or multiple opaque currencies.

The current challenge records need a safe public/private boundary. Existing link-only challenges should keep working. Public discoverable challenges should be explicitly marked public and should pass simple title and volume limits. A public list should show only challenge metadata, never private learner data or answer keys.

## Phase 1 Arena MVP

Phase 1 should contain Arena Home, public challenge discovery, existing private link challenges, challenge creation, challenge results, challenge-specific leaderboards, a basic global ranking summary, subject filters, and a compact Arena profile summary. Daily challenges, subject rankings, follows, friend challenges, and basic XP are valuable next slices, but they should be added only after the discoverability loop is stable.

The first code milestone should therefore be: `Arena Home → discover a real public challenge → open existing Challenge Mode → submit → see rank → return to Arena`. The design should also show a truthful empty state when there are no public challenges. It must never fabricate participants, reviews, ratings, or activity.

## Data boundaries

The smallest safe data addition is to extend the challenge record with visibility and discovery metadata only if the current schema does not already carry it: `visibility` (`link_only` or `public`), `status` (`active`, `expired`, or `closed`), `description` with a conservative length limit, `expiresAt`, and `lastActivityAt`. A separate discovery query should return challenge metadata and participant counts without exposing question IDs, answers, or user email data. Existing attempt rows remain the source for leaderboard counts.

Arena profile, XP, divisions, friendships, clubs, notifications, tournaments, and activity events should be separate future entities. They should not be created as empty tables just to match the large vision document. Each future table must have a clear event or user action that writes trusted data.

## Deferred work

Head-to-head battles can follow public discovery because they reuse the same challenge question snapshot and score comparison. Daily challenges, weekly rankings, divisions, creator reputation, recommendations, and achievements come after basic discovery has real usage. Clubs, following feeds, tournaments, live events, direct messages, and school competitions are deferred. Unrestricted messaging is explicitly rejected for the first release because the product serves students and must keep interactions learning-centred and safe.

## Release gates

Every Arena challenge must be built only from approved JAMB Quest questions. The server must re-check the question set at read and submit time. Public cards must not contain fake ratings, fake users, fake activity, or invented testimonials. Learner reports must remain owner-visible only. Any database migration must be additive and reversible through the project checkpoint process. The first release is ready only when the old share-link flow, new public discovery flow, four subjects, leaderboard ordering, mobile layout, and owner protections all pass tests.
