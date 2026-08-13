# JAMB Quest Upgrade Checklist

- [x] Read the full-stack WebDev guide and apply the user/auth/database feature scaffold.
- [x] Add profile identity and account-state UI without disrupting the existing quiz flow.
- [x] Move progress, best scores, wrong-answer history, and round summaries from local-only storage to per-user persistence.
- [x] Define question provenance fields so original model questions and authorised real questions are visibly separated.
- [x] Add an import-ready schema and validation path for the user’s authorised question files.
- [ ] Verify sign-in-aware UI, signed-out fallback, profile persistence contracts, quiz gameplay, and question-source labeling.
- [ ] Save and deliver the upgraded checkpoint with concise setup notes for the user’s future question upload.
- [x] Implement an authenticated authorised-question import workflow with source metadata, schema validation, status handling, and clear error states.
- [ ] Test and document a real signed-in profile flow: login, save profile, completed-round sync, reload persistence, logout fallback, and source labels.
- [x] Preserve guest-first gameplay and defer only the user-mediated OAuth completion test until the user independently signs in after publication.
- [x] Summarize the Atomic Habits systems-first brief into product principles for a 380-score comeback journey.
- [x] Connect and inspect the owner’s authorised Google Drive past-question folder without importing unverified material.
- [x] Validate and stage the supplied Biology authentic-question Markdown separately from the original model bank.
- [x] Re-theme the experience around “Comeback from Setback” and “Smashing 380 in JAMB.”
- [x] Add habit-driven gamification: daily minimum system, streak recovery, consistency score, comeback XP, badges, and focused missions.
- [x] Add a personal activity and progress view with daily history, subject mastery, goal trajectory, and wrong-answer recovery.
- [x] Select and implement a daily accountability-notification approach after presenting viable delivery options.
- [ ] Verify the authentic-question provenance labels, comeback loop, progress calculations, daily-notification setup, and responsive UI.
- [x] Add daily-system, activity, achievement, and streak-recovery data models for the 380 comeback loop.
- [x] Build the in-app daily comeback check-in, minimum action, consistency score, XP, badges, and mission flow.
- [x] Add opt-in browser notification subscriptions, permission states, and an off-switch with no loss of core gameplay.
- [x] Configure a deployed daily scheduler only after the push UI, service worker, and notification keys are ready.
- [x] Add a visible progress-to-380 trajectory indicator that updates from learner performance data.
- [x] Add explicit browser-push states for unsupported devices, permission denial, subscription failure, and successful enable or disable feedback.
- [ ] Deploy the daily callback, create the recurring schedule, and verify that incomplete opted-in learners receive no duplicate reminders.
- [x] Add an installable PWA manifest, app icons, service worker, and clear install affordance for supported devices.
- [x] Cache the app shell and existing model question bank for resilient offline quiz play with a clear offline status.
- [x] Add production-size 192px and 512px maskable PWA icon assets and reference them in the app manifest.
- [x] Re-verify PWA installation metadata after adding platform-ready icon assets.
- [x] Download and profile the confirmed 27 eligible owner-provided Drive PDFs across English, Biology, Chemistry, Physics, and one mixed JAMB simulation; exclude Mathematics from the current four-subject game scope.
- [x] Parse, validate, deduplicate, and stage Drive-extracted questions under distinct owner-provided source labels without overwriting model questions.
- [x] Keep source provenance visible and do not represent owner-provided material as official JAMB wording without verification.
- [ ] Verify installation, offline app-shell behavior, cached model-bank gameplay, and authorisation-source separation before delivery.
- [x] Add a persistent mobile-friendly tab bar for Practice, Progress, Profile, and About.
- [x] Divide the current home dashboard into focused tab panels so learners are not presented with every function at once.
- [x] Keep the daily system, quiz entry points, source provenance, and signed-in profile controls reachable from the appropriate tab.
- [x] Verify tab navigation, profile actions, and responsive layout at desktop and phone sizes.
- [x] Exercise all four tab panels at desktop and phone sizes, checking for overlap, dead ends, and misplaced fixed navigation.
- [x] Exercise the signed-in Profile tab flow and confirm that profile editing, push controls, installation controls, and logout remain reachable.
- [x] Fix the deployed PWA update path so the fixed bottom tab navigation appears on existing browser and installed-app sessions.
- [x] Verify the live production app shows the fixed bottom tab bar after a service-worker update, without requiring manual cache clearing.
- [x] Reproduce and document an old-cache-to-new-worker production upgrade that refreshes the fixed tab bar without manual cache clearing.
- [x] Import the staged owner-provided Biology Markdown batch into gameplay under a distinct verification-pending source label.
- [x] Add a repeatable Markdown-source intake path that validates, deduplicates, labels, and reports each new owner-provided question batch on the route to 10,000 questions.
- [x] Research public feature patterns in leading JAMB study apps and write a differentiated, non-copying product roadmap for JAMB Quest.
- [x] Reconcile the legacy JAMB Mock mixed-subject import by removing duplicate Biology rows and restoring correct per-source question totals.
- [x] Add and run an end-to-end mixed-subject Markdown import verification proving subject-aware source labels, unique external IDs, and no duplicate playable rows after reruns.
- [x] Re-verify the displayed total question count after database reconciliation so the live bank count reflects actual unique playable records.

- [x] Add a DB-backed end-to-end verification for mixed-subject Markdown reruns that imports or re-imports a fixture and asserts correct source labels plus zero duplicate question items afterward.
- [x] Verify in the browser or with an automated page assertion that the displayed total question count matches the reconciled database-backed total after duplicate cleanup, and fix the count source if stale.

- [x] Execute the Markdown importer twice against a controlled mixed-subject fixture and assert unchanged counts, correct source labels, and zero duplicate question items after the second run.
- [x] Add a database-backed full playable-bank total query and make the browser assertion compare the rendered question count against that verified total rather than a hardcoded number.

- [x] Extend the rerun verification to assert expected TechMed provenance labels and per-label counts after the second importer run, then rerun it successfully.

- [x] Research leading JAMB CBT apps and document the common learner-facing patterns JAMB Quest should adopt without copying branding or content.
- [x] Standardise the learner-facing question format so every question uses the same layout and exposes only topic context, not confusing source-set labels.
- [x] Ensure every playable question has a useful explanation of at least five to six readable lines, with a safe fallback for short or missing explanations.
- [ ] Validate the uniform question card, topic display, explanation readability, responsive quiz flow, and updated tests.

- [ ] Add a real explanation-quality pipeline that upgrades short model and imported explanations into question-specific five-to-six-line learning notes or flags records as needing review before gameplay.
- [ ] Verify sampled model and owner-provided questions render substantial, question-specific explanations rather than generic filler text.

- [x] Enrich a reviewable Biology pilot batch with question-specific five-to-six-sentence explanations before scaling to other subjects.
- [x] Quality-check the Biology pilot for answer alignment, option reasoning, topic relevance, factual caution, and generic-filler rejection.
- [x] Integrate only the validated Biology pilot into the playable explanation pipeline and verify it in the uniform quiz card.

- [x] Add a successful component-level or browser-level verification that loads a Biology pilot question from the updated asset and asserts topic-only context plus six enriched explanation lines.
- [ ] Re-run and record a passing responsive quiz-flow check for the updated uniform question card after the Biology pilot asset switch.

- [x] Source the component-level QuestionCard verification directly from the generated Biology pilot asset so the test covers the real integrated data-to-UI path.

- [x] Generate and quality-check Biology explanation batch 2 with the same structured six-sentence contract before integration.
- [x] Integrate only the approved Biology batch 2 records and rerun real-asset and component-level verification.

- [x] Point the QuestionCard component test at a batch-2 Biology record from the combined batches-1-and-2 asset and assert topic-only context plus six enriched lines.

- [x] Generate and quality-check Biology explanation batch 3 with the same structured six-sentence contract before integration.
- [x] Integrate only the approved Biology batch 3 records and verify the combined asset and QuestionCard path.

- [x] Point the QuestionCard component test at a batch-3 Biology record from the combined batches-1-to-3 asset and rerun the real UI-path verification.

- [x] Generate and quality-check Biology explanation batch 4 with the same structured six-sentence contract before integration.
- [x] Integrate only the approved Biology batch 4 records and verify the combined asset and QuestionCard path.

