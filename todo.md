# JAMB Quest Upgrade Checklist

- [x] Read the full-stack WebDev guide and apply the user/auth/database feature scaffold.
- [x] Add profile identity and account-state UI without disrupting the existing quiz flow.
- [x] Move progress, best scores, wrong-answer history, and round summaries from local-only storage to per-user persistence.
- [x] Define question provenance fields so original model questions and authorised real questions are visibly separated.
- [x] Add an import-ready schema and validation path for the user’s authorised question files.
- [x] Verify sign-in-aware UI, signed-out fallback, profile persistence contracts, quiz gameplay, and question-source labeling.
- [x] Save and deliver the upgraded checkpoint with concise setup notes for the user’s future question upload.
- [x] Implement an authenticated authorised-question import workflow with source metadata, schema validation, status handling, and clear error states.
- [x] Test and document a real signed-in profile flow: login, save profile, completed-round sync, reload persistence, logout fallback, and source labels.
- [x] Preserve guest-first gameplay and defer only the user-mediated OAuth completion test until the user independently signs in after publication.
- [x] Summarize the Atomic Habits systems-first brief into product principles for a 380-score comeback journey.
- [x] Connect and inspect the owner’s authorised Google Drive past-question folder without importing unverified material.
- [x] Validate and stage the supplied Biology authentic-question Markdown separately from the original model bank.
- [x] Re-theme the experience around “Comeback from Setback” and “Smashing 380 in JAMB.”
- [x] Add habit-driven gamification: daily minimum system, streak recovery, consistency score, comeback XP, badges, and focused missions.
- [x] Add a personal activity and progress view with daily history, subject mastery, goal trajectory, and wrong-answer recovery.
- [x] Select and implement a daily accountability-notification approach after presenting viable delivery options.
- [x] Verify the authentic-question provenance labels, comeback loop, progress calculations, daily-notification setup, and responsive UI.
- [x] Add daily-system, activity, achievement, and streak-recovery data models for the 380 comeback loop.
- [x] Build the in-app daily comeback check-in, minimum action, consistency score, XP, badges, and mission flow.
- [x] Add opt-in browser notification subscriptions, permission states, and an off-switch with no loss of core gameplay.
- [x] Configure a deployed daily scheduler only after the push UI, service worker, and notification keys are ready.
- [x] Add a visible progress-to-380 trajectory indicator that updates from learner performance data.
- [x] Add explicit browser-push states for unsupported devices, permission denial, subscription failure, and successful enable or disable feedback.
- [x] Deploy the daily callback and recurring schedule; live Heartbeat job `daily-comeback-reminder` is enabled at 19:00 UTC and has successful callback runs. The real two-run no-duplicate learner verification remains separately open below.
- [ ] Verify the deployed reminder callback against a real opted-in incomplete learner twice, retaining evidence of one send followed by a no-duplicate result.
- [x] Add a pure reminder-delivery eligibility helper and unit test the already-sent, completed-minimum, and eligible reminder decisions.
- [x] Add an installable PWA manifest, app icons, service worker, and clear install affordance for supported devices.
- [x] Cache the app shell and existing model question bank for resilient offline quiz play with a clear offline status.
- [x] Add production-size 192px and 512px maskable PWA icon assets and reference them in the app manifest.
- [x] Re-verify PWA installation metadata after adding platform-ready icon assets.
- [x] Download and profile the confirmed 27 eligible owner-provided Drive PDFs across English, Biology, Chemistry, Physics, and one mixed JAMB simulation; exclude Mathematics from the current four-subject game scope.
- [x] Parse, validate, deduplicate, and stage Drive-extracted questions under distinct owner-provided source labels without overwriting model questions.
- [x] Keep source provenance visible and do not represent owner-provided material as official JAMB wording without verification.
- [x] Verify installation, offline app-shell behavior, cached model-bank gameplay, and authorisation-source separation before delivery.
- [x] Add a persistent mobile-friendly tab bar for Practice, Progress, Profile, and About.
- [x] Add a standard timed CBT exam mode with subject mix, question navigator, flagged questions, submit confirmation, and a full answer-review screen.
- [x] Add learner performance charts and persistent exam/practice logs showing score trend, subject accuracy, timing, and weak-topic recovery.
- [x] Add a CBT submit-confirmation step before entering final answer review, with browser-flow coverage.
- [x] Add a dedicated weak-topic recovery panel derived from persisted answer-review data and verify the Progress analytics view in the browser.
- [x] Add browser coverage for the real useQuizGame CBT pause/resume flow, proving its actual countdown freezes and resumes without losing saved answers or navigator state.
- [x] Add a revision planner, saved-question bookmarks, and focused topic drills based on missed-question patterns.
- [x] Add an exam-result comparison view that turns logged attempts into actionable next-step recommendations.
- [x] Persist authenticated saved-question bookmarks and make each saved record returnable from Progress.
- [x] Add focused topic drills from weak-topic recovery while preserving normal sprint, recovery, and full-mock selection rules.
- [x] Add a latest-versus-previous CBT comparison with an evidence-based next study action.
- [x] Add an explicit revision-planner panel that converts weak topics, saved questions, and recent CBT comparison into an ordered next-study plan.
- [x] Handle unavailable bookmark and topic-drill records safely without falling back to unrelated subject questions.
- [x] Add an authenticated browser/DB-backed flow that saves a question, confirms it appears in Progress, and reopens that exact question.
- [x] Prepare the rich-question intake workflow to preserve the user's supplied explanation style when the next batch arrives.
- [x] Preserve multiline rich explanations and supplied topic headings through Markdown parsing without changing their instructional wording.
- [x] Inspect and stage the newly supplied Lekki Headmaster and JAMB Idioms PDFs with verification-pending provenance; do not add unvalidated items to gameplay.
- [x] Apply the user's forthcoming rich-explanation examples as the quality standard before enriching the next question batch.
- [x] Parse and validate the submitted Biology, Chemistry, and Physics rich-question Markdown batches with preserved topics and multiline explanations.
- [x] Classify the submitted records into importable and held-for-review groups, retaining every flagged or answer-uncertain question outside gameplay.
- [x] Import only the validated submitted records with owner-provided verification-pending provenance and approved rich explanations.
- [x] Verify the updated playable total, provenance gate, and rich explanation rendering after the submitted batch release.
- [x] Render supplied paragraph-style rich explanations as readable multi-line notes without replacing them with generic fallback text.
- [x] Upgrade the 42 short-explanation submitted records using the user’s rich explanatory style, then re-run the same quality and ambiguity gate.
- [x] Update the bulk enrichment prompt to apply a style contract derived from the submitted rich explanations, then regenerate only the 42 short submitted records.
- [x] Add a regression verifier that confirms regenerated short-record explanations meet the submitted rich-explanation style contract before gameplay approval.
- [x] Replace formulaic generated explanation language with the user’s compact, natural teaching-paragraph style.
- [x] Convert already released label-led generated explanations into compact neutral paragraphs while leaving authentic source prose untouched.
- [x] Preserve every user-supplied authentic explanation verbatim in learner-facing cards rather than rewrapping it into generated templates.
- [x] Preserve authentic paragraph boundaries and whitespace without text collapsing, with a multi-paragraph learner-card regression test.
- [ ] Regenerate previously AI-written explanations against the authentic-style contract and keep only answer-safe, style-conforming versions. Style conformance is evidenced for 1,468 imported and 1,000 model explanations, but source-by-source provenance and answer-safety evidence remain to be completed for the historical model bank.
- [x] Remove the eight active model-bank template-labelled explanations and record the 838 short model explanations as a separate, source-limited enrichment backlog. The repaired active model asset now has zero template-style violations; short explanatory depth remains a separately tracked quality backlog, not a silent rewrite.
- [x] Identify each historically AI-written model-bank explanation set and document whether each record was label-repaired, regenerated, or withheld from gameplay. The provenance audit identifies one original JAMB-aligned practice set; eight records received label-only repair, 992 remained unchanged, none were withheld, and historical AI authorship remains explicitly unproven pending owner/source evidence.
- [x] Add a structural answer-integrity audit for active model-bank explanations, separate from the completed template-style audit. All 1,000 active records have a valid A-D key, matching answer text, four distinct clean options, and no embedded answer/explanation metadata; factual correctness and wording ambiguity remain separately unverified.
- [x] Keep the 838 short active model explanations in an explanation-depth and provenance backlog until their release basis is documented or an owner-approved enrichment brief is supplied; the backlog and its release restriction are documented in the model-bank audit reports.
- [x] Add a style regression check that rejects label-led, repetitive, or template-like generated explanations before release.
- [x] Detect repeated sentence stems or duplicated clauses in generated explanations and prove the release verifier rejects a repetitive fixture.
- [x] Add a simple JAMB-style calculator with standard arithmetic, clear, backspace, and keyboard support.
- [x] Make the calculator available from both practice and CBT question screens without interrupting the timer or answer state.
- [x] Verify calculator use during a real CBT exam keeps the countdown, selected answer, flag, and navigator state intact after closing.
- [x] Add calculator unit and browser coverage, including phone-sized verification.
- [x] Make every Progress recovery action open its exact saved, missed, or weak-topic question set instead of behaving as a static summary.
- [x] Provide an honest empty state when a requested recovery set no longer has matching playable questions.
- [x] Add browser coverage proving Progress actions launch the matching recovery questions and never silently substitute unrelated material.
- [x] Differentiate unavailable saved-question and missed-question recovery messages so the learner knows exactly what no longer exists.
- [x] Add a Progress browser scenario that requests an unavailable recovery record and proves the app stays on Progress with a truthful no-match message.
- [x] Add authentic JAMB keyboard shortcuts for answer selection, previous/next navigation, and the submit-confirmation workflow in CBT mode.
- [x] Upgrade CBT submission review with direct actions to inspect unanswered and flagged questions before final submission.
- [x] Separate no-timer Study mode from strict Exam mode in the learner-facing practice setup.
- [x] Add a 20-question mixed-subject diagnostic baseline with five questions per subject for learners without sufficient performance evidence.
- [x] Verify that completing the diagnostic produces a meaningful weak-topic priority for the following daily mission.
- [x] Add a regression that persists diagnostic answer reviews and proves the next automatic mission targets the weakest resulting topic.
- [x] Persist an active CBT’s answers, flags, current question, and remaining time locally so an interruption can resume the same exam.
- [x] Verify a refreshed CBT session restores the exact in-progress question, selected answer, flag, and countdown without restoring an untimed Study session.
- [x] Replace the learner-facing “To be tagged during syllabus mapping” topic label with clear neutral study wording everywhere it is active, including persisted weak-topic analytics and daily-mission cards.
- [x] Audit all active approved placeholder-topic records and produce a deterministic report that assigns verified actual topics or marks unresolved records as excluded from weakness guidance.
- [x] Migrate only verified actual topics for placeholder records, while excluding unresolved records from weak-topic and daily-mission analytics.
- [x] Add browser or fixture coverage proving an affected legacy weak-topic mission renders an actual classified topic rather than a generic fallback.
- [x] Map the remaining approved-question topics against the owner-supplied Biology and Chemistry syllabus PDFs before allowing them into weakness guidance.
- [x] Extract the supplied Biology and Chemistry syllabus PDFs into a reviewable authoritative topic map for the remaining question classifications.
- [x] Keep the JAMB Quest roadmap focused on preparation, CBT simulation, mistake correction, weakness tracking, target scoring, study planning, and offline readiness; defer marketplace, live teaching, social, and AI-tutor modules.
- [x] Add a real target-score view that translates recent four-subject performance into an estimated UTME score, subject contributions, and a transparent target gap.
- [x] Add question-speed analytics and a concise next-action recommendation based on accuracy and pace.
- [x] Defer topic-plus-difficulty practice and question search until reliable metadata and an indexable content source are available; documented in reports/open_quality_gate_classification.md.
- [x] Add a focused subject-and-topic Study drill that launches an exact 20-question practice set from the completed syllabus-grounded topics.
- [x] Keep error classification, dynamic flashcards, formula vault, rich passages/diagrams, and AI explanation levels as protected staged capabilities pending validated content and user-approved scope; documented in reports/open_quality_gate_classification.md.
- [x] Deliver the selected core daily study-and-revision loop: one clear daily action, exact mistake recovery, and brief performance guidance.
- [x] Make the main daily action an automatic 20-question mission from the learner’s weakest available topic.
- [x] Show concise review analytics that connect score, accuracy, speed, weak topics, and exact missed-question recovery to a next action.
- [x] Show an estimated UTME score only after a completed full 180-question mock; show no projection from shorter practice rounds.
- [x] Make the analytics next action responsive to accuracy and pace, choosing a speed drill for slow-but-accurate work and a weak-topic repair for inaccurate-but-fast work.
- [x] Add unit and browser coverage for pace-aware next-action recommendations across slow-but-accurate and inaccurate-but-fast scenarios.
- [x] Show each subject’s answer-review accuracy alongside its clearest weak topic on Progress.
- [x] Make every weak-topic recovery action launch the exact 20-question topic drill.
- [x] Keep nonessential marketplace-style modules from the submitted brief deferred unless the user explicitly reprioritizes them.
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
- [x] Validate the uniform question card, topic display, explanation readability, responsive quiz flow, and updated tests.

- [x] Add a real explanation-quality pipeline that upgrades short model and imported explanations into question-specific five-to-six-line learning notes or flags records as needing review before gameplay.
- [x] Add a reusable explanation-quality auditor that accepts structured rich notes and flags generic or underdeveloped imported explanations for review.
- [x] Add an imported-question enrichment path that preserves already-rich supplied notes, upgrades short authorised explanations in batches, and records review status before gameplay exposure.
- [x] Keep authorised questions that fail the explanation-quality gate out of active gameplay until they are enriched or explicitly approved, then rerun a DB-backed quality audit.
- [x] Generate and quality-check a 25-question owner-provided Biology explanation pilot, then approve only the records that pass the same six-sentence quality gate.
- [x] Generate and quality-check a second non-overlapping 25-question owner-provided Biology explanation batch, preserving the three ambiguous pilot records for separate source review.
- [x] Process up to 500 additional owner-provided authentic questions tonight through accelerated explanation batches, releasing only explanation-approved records and retaining unclear items for review.
- [x] Complete the remaining eligible owner-provided authentic-question enrichment and release pass; all deterministic and source-preserving candidates are released, and the remaining 352 authorised exclusions are invalid option-content records documented by the live audit.
- [x] Enrich the 174 clear held owner-provided records using the submitted explanation-style contract and release only quality-approved results.
- [x] Align the authorised explanation audit with the approved paragraph-style contract so its reporting matches the playable-bank gate.
- [x] Deactivate the 75 confirmed unclear or answer-uncertain authentic records at the user's request, while retaining the 174 clear TechMed records for a separate short-explanation decision.
- [x] Verify sampled model and owner-provided questions render substantial, question-specific explanations rather than generic filler text.
- [x] Update the displayed-question-count verifier so it checks the model bank plus only explanation-approved, active owner-provided questions without leaving a browser process stalled.
- [x] Retain a browser-level verifier against the real Home flow that proves the authorised playable-question query reaches `data-ready=true` before rendering the approved-only 1,975-question count.

- [x] Enrich a reviewable Biology pilot batch with question-specific five-to-six-sentence explanations before scaling to other subjects.
- [x] Quality-check the Biology pilot for answer alignment, option reasoning, topic relevance, factual caution, and generic-filler rejection.
- [x] Integrate only the validated Biology pilot into the playable explanation pipeline and verify it in the uniform quiz card.

- [x] Add a successful component-level or browser-level verification that loads a Biology pilot question from the updated asset and asserts topic-only context plus six enriched explanation lines.
- [x] Re-run and record a passing responsive quiz-flow check for the updated uniform question card after the Biology pilot asset switch.

- [x] Add an auth-independent real-asset quiz-shell interaction fixture for desktop and mobile verification of starting, answering, and revealing the uniform explanation card.

- [x] Source the component-level QuestionCard verification directly from the generated Biology pilot asset so the test covers the real integrated data-to-UI path.

- [x] Generate and quality-check Biology explanation batch 2 with the same structured six-sentence contract before integration.
- [x] Integrate only the approved Biology batch 2 records and rerun real-asset and component-level verification.

- [x] Point the QuestionCard component test at a batch-2 Biology record from the combined batches-1-and-2 asset and assert topic-only context plus six enriched lines.

- [x] Generate and quality-check Biology explanation batch 3 with the same structured six-sentence contract before integration.
- [x] Integrate only the approved Biology batch 3 records and verify the combined asset and QuestionCard path.

- [x] Point the QuestionCard component test at a batch-3 Biology record from the combined batches-1-to-3 asset and rerun the real UI-path verification.

- [x] Generate and quality-check Biology explanation batch 4 with the same structured six-sentence contract before integration.
- [x] Integrate only the approved Biology batch 4 records and verify the combined asset and QuestionCard path.

- [ ] Generate and quality-check the next explanation batch from the user’s forthcoming rich-explanation Markdown source, preserving its supplied explanations where they meet the quality gate.
- [x] Generate and quality-check Biology explanation batch 5 with the same structured six-sentence contract while the richer Markdown source is pending.
- [x] Integrate only the approved Biology batch 5 records and verify the combined asset and real QuestionCard path.
- [x] Search the authorised Drive corpus for The Lekki Headmaster materials and stage any matching files with explicit novel provenance and verification-pending status.
- [x] Validate any Lekki Headmaster question keys and explanations before adding them to gameplay; do not represent staged material as verified official content until checked. Superseded by the owner-confirmed direct-release instruction: 109 supplied keyed questions were structurally validated and released without inventing explanations; no official-status claim is made.
- [x] Preserve the uniform learner-facing format while keeping novel provenance in the internal source ledger.

- [x] Add a Lekki Headmaster staging/import path that writes its verification-pending source metadata into the same internal source ledger used by other authorised question batches without exposing source-set labels in gameplay.
- [x] Verify one staged Lekki Headmaster record end to end: internal provenance remains verification-pending and the learner-facing card still shows only the uniform topic context and explanation format.
- [x] Correct the Lekki Headmaster parser to align answer keys by chapter sequence rather than unreliable OCR printed numbers, and reject or report chapter coverage anomalies before staging.

- [x] Keep the Lekki Headmaster source inactive and paused until the user supplies a cleaner source file with reliable answer-key alignment and question-specific explanations.
- [x] Record and apply the final JAMB Quest positioning: a serious preparation weapon where Practice → Understand → Diagnose → Improve → Repeat guides every core product decision.
- [x] Refine the full 180-question UTME mock navigator into direct subject-oriented palettes with local numbering, per-subject answered progress, and accessible answered/unanswered/flagged states.
- [x] Repair or withhold every playable question whose explanation text has been embedded in an answer option, and add a regression gate for this malformed data shape.
- [x] Simplify the About page so JAMB Quest presents one unified question bank without learner-facing source packages or file labels.
- [x] Diagnose and repair the daily browser-reminder delivery path, including subscription, preference, schedule, and device-feedback verification.
- [x] Parse, validate, and safely release the newly supplied Chemistry questions, preserving their authentic explanations while holding any answer-uncertain or structurally malformed records.
- [x] Import the trusted owner-provided Chemistry questions 51–100 with preserved explanations and automatic duplicate and malformed-card safeguards.
- [x] Import the trusted owner-provided Physics questions 1–100 with preserved explanations and automatic duplicate and malformed-card safeguards.
- [x] Import the trusted owner-provided Biology questions 1–100 with preserved explanations and automatic duplicate and malformed-card safeguards.
- [x] Import the trusted owner-provided Use of English questions 1–100 with preserved explanations and automatic duplicate and malformed-card safeguards.
- [x] Work through the remaining JAMB Quest checklist one item at a time, classifying source-dependent, deferred, and superseded work honestly while closing each verifiable core item with evidence; remaining blockers are documented in reports/open_quality_gate_classification.md.
- [x] Identify the explicitly traceable submitted-rich AI-conditioned explanation set and document its regenerated-versus-withheld status.
- [x] Identify every remaining historically AI-written explanation set by source and prove each was regenerated to the authentic-style contract or withheld from gameplay. Legacy batches 001–011 have generator receipts and validated four-line treatment; the 1,000-record model bank remains explicitly unproven as historically AI-written; owner-supplied sets remain source-labelled.
- [x] Compact the Practice and Progress interfaces into a small number of grouped, tappable panels so the app does not require long continuous scrolling to reach core actions. Mobile and desktop visual review plus topic and Progress interaction fixtures passed.
- [x] Replace permanent 380 hero messaging with the learner’s own saved target score while preserving the comeback theme. Mobile verification confirmed that the signed-in preview’s 380 is its persisted user target, while the signed-out fixture renders “your goal”; no fixed guest headline remains.
- [x] Release the owner-confirmed curated Lekki Headmaster questions directly, preserving their answer keys and allowing concise or absent explanations; 109 keyed four-option records were released with zero structural holds or duplicates.
- [x] Use the supplied novel only as optional future source support; do not delay the direct curated-question release for full-novel OCR. The owner-confirmed keyed batch is the release basis.
- [x] Verify the direct novel-question import and learner cards with characters, dialogue, settings, chronology, and locations represented when present in the owner-curated source. Database verification confirmed 109 active, approved records; learner-card and structural regressions pass.
- [x] Complete and verify the compact grouped-card home interface on mobile and desktop, including the learner-target-led hero copy.
- [x] Add a visible compact Lekki Headmaster launch action so the released novel questions are easy to find from Practice.
- [x] Replace the current 109-question Lekki Headmaster source with the owner’s forthcoming cleaner arranged source, validating the replacement before deactivating the former batch. All 650 chapter-keyed questions were imported in two safeguarded source parts and the former 109-question source was deactivated only after approval verification.
- [x] Keep the owner’s Lekki chapter topics visible for precise study while allowing the compact novel launch to select across all verified chapters. The chapter topics remain selectable; the compact launch starts a 20-question mixed chapter study round.
- [x] Promote The Lekki Headmaster from the Topic panel into an equal fifth Practice palette beside English, Biology, Chemistry, and Physics, with random and chapter selection. Browser verification confirms both Random 20 and exact chapter Study launches.
- [x] Replace the long flat Topic menu with compact broad subject groups that reveal exact drills only on demand. The grouped topic browser fixture confirms precise untimed drills remain available after selecting a broad area.
- [x] Add restrained, accessible real-time writing and study-feedback effects without disrupting focused practice or reduced-motion preferences. Phone and desktop review confirms the learner-specific LIVE DESK line plus subtle reduced-motion-safe signal and book effects.
- [x] Add a polished home-screen typewriter hero and staggered modern entrance choreography for key Practice elements, with full reduced-motion support and no delay to study controls. Phone and desktop visual checks plus full interaction regression verification passed.
- [x] Replace launch-page comeback and target-score hero messaging with a question-first JAMB Questions entry experience. Phone and desktop checks confirm the launch hero is now JAMB QUESTIONS with direct subject, Lekki, and mission entry points.
- [x] Remove any learner-facing model-bank-only count and present one authoritative playable-question total consistently across the launch interface. The initial unresolved state now says Loading JAMB questions instead of exposing 1,000, and the settled header/hero shows only the full 3,118 total.
- [x] Replace remaining learner-facing comeback labels in Profile and global footer copy with direct JAMB preparation wording while retaining personal progress features. Profile goal context, reminders, progress, and question-bank navigation remain intact.
- [x] Make the selected broad study area launch a 20-question drill directly; retain the exact-topic dropdown as an optional refinement rather than a required prerequisite. Browser verification confirms the button enables with an empty exact-topic selector and launches a 20-question untimed Study round drawn only from the selected area.
- [x] Restore a JAMB Quest goal-and-system-led launch header: present the learner’s score goal and daily system as the primary identity, with question count as supporting proof rather than the product name. Phone review confirms the header reads “Build toward 380 with a system” for the signed-in learner, while the global identity reads JAMB Quest / Your study system.
- [x] Directly verify that Start topic drill launches a 20-question untimed round after only a broad area is selected, with the exact-topic selector left empty. The browser fixture asserts the no-filter broad-area configuration before testing longer sizes.
- [x] Let learners choose flexible topic-drill sizes instead of forcing 20 questions, including a 50-question option where questions are available. Broad-area and exact-topic fixtures confirm the selected 50-question configuration is preserved.
- [x] Let Lekki Headmaster learners choose a chapter-specific 50-question practice round instead of forcing Random 20 or a 20-question chapter drill. The verifier confirms Random 20 remains available and an exact selected chapter launches with 50 questions.
- [x] Add cinematic, reduced-motion-safe entry transitions each time a learner opens a tab, without delaying controls or navigation. Each tab now remounts its hero and content entry layers with a contained cinematic sweep; tab navigation regression and reduced-motion CSS fallback remain intact.
- [x] Assess publicly accessible JAMB-question platforms, including MySchoolNG, for lawful coverage research and a safe intake strategy toward the 10,000-question target. Findings are documented in `reports/public_source_coverage_research.md`; third-party question text remains reference-only unless written permission or a licence is obtained.
- [x] Finalise the existing four-part slanted square mark already used in the app as the official JAMB Quest logo for the licensing document; the owner confirmed this is the intended brand identity.
- [x] Restore the existing four-part slanted JAMB Quest mark in the top-left header and remove all generated-logo image references. Mobile review confirms a clear JAMB Quest / Your study system lockup with the original mark.
- [x] Render and deliver the existing four-part slanted JAMB Quest mark as a direct transparent PNG image file for the licensing document. Superseded duplicate entry; the completed delivery is recorded directly below.
- [x] Render and deliver the existing four-part slanted JAMB Quest mark as a direct transparent PNG image file for the licensing document. The 1024×1024 transparent PNG precisely uses the established navy-and-gold four-tile slanted mark.
- [x] Create and deliver a centered official JAMB Quest logo image with the four-part slanted mark above the exact “JAMB Quest” wordmark. Superseded duplicate entry; the completed delivery is recorded directly below.
- [x] Create and deliver a centered official JAMB Quest logo image with the four-part slanted mark above the exact “JAMB Quest” wordmark. The final composition is centered with the established navy-and-gold mark and a clear JAMB Quest label underneath.
- [x] Refine the centered JAMB Quest wordmark with the original logo’s warm-gold accent outline while preserving the four-part slanted mark and centered composition. Superseded duplicate entry; the completed delivery is recorded directly below.
- [x] Refine the centered JAMB Quest wordmark with the original logo’s warm-gold accent outline while preserving the four-part slanted mark and centered composition. The final label uses a thin gold contour around the dominant navy JAMB Quest lettering.
- [x] Review the uploaded content-licensing agreement to confirm whether JAMB Quest may import, host, and present licensed question content and under which conditions. Superseded duplicate entry; the completed written review is recorded directly below.
- [x] Review the uploaded content-licensing agreement to confirm whether JAMB Quest may import, host, and present licensed question content and under which conditions. The written review identifies the permitted four-subject mobile/web scope and the required signature, attribution, payment-reference, PWA/offline, and authority corrections before activation.
- [x] Audit the uploaded Physics, Biology, and Chemistry 100-question batches for duplicate questions within the files and against the active JAMB Quest bank before any import. The final audit found 6 exact duplicates, 3 near duplicates, no cross-file duplicates, and 7 incomplete or conflicting records; all were held.
- [x] Import only the newly unique, structurally safe records from the uploaded Physics, Biology, and Chemistry batches and retain an exact deduplication receipt. Exactly 242 unique records were released, bringing the verified playable total to 3,360; the receipt remains in `reports/owner_batches_aug15_import_receipt.json`.
- [x] Extend JAMB Quest to safely support legitimate four- and five-option question cards, answer keys, imports, and CBT keyboard selection without breaking existing four-option rounds. Validation, mapping, learner cards, and CBT keyboard A–E are covered by unit, mobile browser, build, topic, and Lekki regressions.
- [x] Use the official four-part slanted JAMB Quest mark as the browser, PWA, and installed-app icon set. The browser favicon, Apple touch icon, and any/maskable 192px and 512px manifest assets now use the approved mark.
- [x] Add a fast system-led opening sequence in which the official mark resolves into “Build your system. Win JAMB.” before the standard app opens, with skip and reduced-motion support. Phone review and browser verification confirm the official mark, message, skip handoff, and motion fallback.
- [x] Cap new learner-facing explanations at 4–5 readable lines while preserving the answer reason and key teaching point; hold records that cannot stay accurate and concise.
- [x] Map every learner-facing Biology, Chemistry, Physics, and Use-of-English topic tag to the supplied syllabus maps before release, with unmapped records held for review.
- [x] Audit the existing playable bank against the concise-explanation and syllabus-topic gates without silently rewriting owner-supplied content.

- [x] Create normalized Biology, Chemistry, Physics, and Use-of-English syllabus parent map from the supplied PDFs
- [x] Add syllabus-backed topic resolution for authorised imports and learner-facing playable rows
- [x] Enforce a maximum of five non-empty explanation lines in authorised import validation
- [x] Update explanation audit reporting for the five-line cap and substantive minimum
- [x] Run and repair the full Vitest suite after the new syllabus and explanation gates
- [x] Audit the existing 3,360-question playable bank for syllabus-topic coverage and explanation-cap compliance
- [x] Resolve or hold any legacy records that remain unmapped or exceed the explanation cap before the next batch intake

- [x] Inspect and parse the newly supplied Chemistry past-question DOCX in bounded batches without altering supplied question or answer wording
- [x] Add uniform medium explanations of four to five readable lines to all release-eligible Chemistry candidates; hold unmapped or duplicate records for review
- [x] Map every Chemistry record to an official JAMB Chemistry syllabus topic; deterministic coverage audit confirms all 1,157 active authorised Chemistry rows resolve to the official map.
- [x] Deduplicate and structurally audit the Chemistry batch before release
- [x] Release only quality-approved Chemistry records and document held records with reasons; the subject-specific audit confirms all 1,157 active authorised Chemistry rows are approved and playable, with no Chemistry hold remaining.

- [x] Reconcile the reported 2,275 versus 3,118 question counts across stored, approved, playable, and UI display paths without changing question data
- [x] Explain or correct any intentional quality-gate exclusions in the learner-facing count

- [x] Diagnose why the 650 stored Lekki Headmaster questions are not visible or launchable from the current Practice interface
- [x] Restore the Lekki Headmaster Practice entry without weakening source or quality gates
- [x] Add regression coverage for Lekki visibility and launch

- [x] Recount and parse every question format in the supplied Chemistry DOCX before stating its total; inventory confirms 1,341 source-labelled questions across the 1–1,020 sequence and separate 1–321 bracketed set
- [x] Supersede the former 3,118-question legacy-restoration target: the verified learner-facing bank now contains 4,473 questions, while any additional legacy records remain protected unless they pass the same syllabus, answer, duplicate, and concise-explanation gates.
- [x] Review Chemistry diagram candidates and add no visual where the source figure is missing or the question is answerable textually; document the source-safe decision in reports/diagram_candidate_review.md

- [x] Audit the newly supplied all-subject JAMB PDF for extractable question formats, subject coverage, duplicates, and structural safety before intake
- [x] Parse and stage only structurally complete records from the all-subject PDF under the existing syllabus, duplicate, answer, and concise-explanation gates. The 3,095-question structural inventory is complete; zero records were staged because the answer-key gate failed, with the separate answer-key resolution item still open. See reports/all_subject_pdf_structural_stage_receipt.json.
- [x] Review approved-question visual needs; no source-safe mandatory diagram was available, so no fabricated visual was added; document the decision in reports/diagram_candidate_review.md

- [x] Re-run the runtime playable audit for all 197 Chemistry DOCX records and confirm every released row passes the live mapper
- [x] Correct any Chemistry row whose runtime topic, explanation line count, option structure, or approval status fails the release gate
- [x] Inspect and parse the newly supplied Biology DOCX across every question, option, answer-key, and explanation format
- [x] Deduplicate and structurally audit the Biology DOCX before staging any records
- [x] Map Biology records to official JAMB syllabus parent topics and hold ambiguous records
- [x] Normalize Biology explanations to a uniform four-to-five-line teaching format without changing answer keys
- [x] Process the Biology DOCX in bounded authorised batches and verify runtime playability after each release

- [x] Generate and revalidate Biology DOCX explanation batch 1: 20 release candidates with uniform four-line explanations and official syllabus topics.
- [x] Stage and import Biology DOCX explanation batch 1 through the duplicate-safe authorised ledger; 20 records released and approved, with no duplicates or structural holds.
- [x] Repair three broad Biology batch-1 labels from Human Physiology to the official Transport syllabus area before import.
- [x] Preserve a deterministic Biology revalidator fallback after a transient structured-model response failure; no unvalidated records were released.
- [x] Continue Biology DOCX explanation batches after batch 1.
- [x] Continue legacy explanation restoration from batch 10 onward. Batch 11 was restored with 20 validated four-line explanations; batch 12 found zero remaining over-cap candidates, so no further records were changed.
- [x] Review the 48 wording-level diagram candidates and keep missing-source or optional visuals out of gameplay; document the decision in reports/diagram_candidate_review.md
- [ ] Resolve the all-subject PDF answer-key gap before importing its held questions.
- [x] Push the learner-facing bank beyond 5,000 by exhausting every supplied or reliably aligned answer-key source, while retaining full-bank duplicate prevention and never guessing an answer. The current learner-facing total is 5,304 questions (4,304 authorised approved plus 1,000 model-bank questions).
- [x] Make every broad official syllabus section directly launchable as an untimed drill, with exact nested topics remaining optional refinements. Parent launches now pass all member topics into one selected-size Study round.
- [x] Add a visible target-score goal setter that persists the learner’s chosen JAMB score and updates the goal-led guidance. Signed-in learners can choose common targets or open the custom profile editor from Practice.
- [x] Add a functional final-day JAMB review flow that launches exact saved, missed, and weak-topic recovery—not static advice. It surfaces the top three weak topics, recent saved questions, missed-question recovery, and a full-mock launch.

- [x] Restore legacy explanation batch 10: 20 approved records updated with validated four-line answer-safe explanations and unchanged question/answer content.
- [x] Audit 21 staged and legacy reports for diagram candidates; 48 wording-level candidates were identified for selective review, with no indiscriminate visuals added.
- [x] Re-run the active syllabus/explanation audit after Biology batch 1 and legacy batch 10; current authorised playable audit reports 1,763 authorised playable records and keeps unmapped, over-cap, and needs-review rows held.

- [x] Harden Biology and legacy explanation generators so empty or error model responses become explicit holds instead of aborting or releasing unsafe content.
- [x] Attempt Biology explanation batch 2 and retain all 20 records held after empty structured responses; no records imported.
- [x] Stage and attempt legacy explanation batch 11; retain all 20 records held after model-response failures; no records applied.
- [x] Retry held Biology batch 2 when structured model output is available. The four remaining candidates were all normalised duplicates of active-bank questions, so no duplicate was imported.
- [x] Import only the four non-duplicate Biology DOCX batch-2 candidates after reapplying duplicate, official-topic, and four-line explanation gates. Full-bank duplicate prevention retained all four outside import.
- [x] Retry held legacy batch 11 when structured model output is available. All 20 records now have approved four-line answer-safe explanations with unchanged question and answer content.

- [x] Inventory the held all-subject PDF by subject, question range, and answer-key availability before any release decision.
- [x] Research multiple independent answer-key sources for the held all-subject PDF and save source URLs and confidence evidence.
- [x] Release only records whose answer keys are independently cross-checked; keep uncertain records held.
- [x] Verify the evidence-backed import with duplicate, syllabus, explanation, and runtime-playability audits.

- [x] Inventory the held all-subject PDF: 843 pages and approximately 3,095 in-scope question starts across English, Biology, Chemistry, and Physics, with no embedded usable answer key.
- [x] Research public answer-key candidates and preserve source URLs and evidence notes in reports/all_subject_answer_key_research_notes.md.
- [x] Cross-check a bounded 1983 sample across Myschool and SchoolNGR; Biology agreed 5/5, while Chemistry agreed 1/5, Physics 2/5, and English 2/5.
- [x] Refuse unsafe bulk release from conflicting external answer evidence; no held all-subject PDF records were imported.
- [x] Expand exact matching and corroboration across additional years and subjects when reliable answer evidence is available. Subject-page research was expanded across Biology, Physics, and general subject sources; partial answer views were recorded, but no complete aligned key was found, so the separate answer-key gap remains open.

- [x] Reconcile the user-reported approximately 5,000-question upload against every received file, parsed source, staged batch, held record, and released record.
- [x] Report the exact bottleneck in simple terms and identify any safe batch ready for immediate processing.

- [x] Reconcile owner-provided Chemistry and Biology sources that already include answer keys and explanations, separately from the held all-subject PDF.
- [x] Identify all Chemistry and Biology records that only need four-to-five-line explanation fine-tuning and can bypass new answer-key inference.
- [x] Process the fine-tuning-ready Chemistry and Biology records in bounded duplicate-safe batches and verify runtime playability.

- [x] Confirm that the supplied Chemistry DOCX and Biology DOCX preserve answer keys and source explanations; separate them from the answer-key-missing all-subject PDF.
- [x] Process the first source-preserving Biology fine-tuning batch: 8 candidates passed the line-wrap gate, 4 were already present as duplicates, and 4 new records were released after canonical topic repairs.
- [x] Continue source-preserving Biology explanation fine-tuning for the remaining eligible candidates.
- [x] Continue any Chemistry explanation fine-tuning beyond the 197 processed candidates, preserving supplied answer keys and source wording.

- [x] Process Biology source-preserving fine-tuning batches 3 and 4: 28 owner-explanation candidates passed the four-to-five-line gate; 18 new records were released and 10 existing duplicates were skipped.
- [x] Re-run the active syllabus/explanation audit after Biology batches 2–4: active approved rows increased to 2,599, mapped rows to 2,257, and within-cap explanations to 1,414; existing 342 topic and 535 over-cap exceptions remain held.

- [x] Process Biology source-preserving fine-tuning batch 5: 20 owner-explanation candidates passed the 60-character four-to-five-line gate; 14 new records were released and 6 existing duplicates were skipped.
- [x] Re-run the active audit after Biology batch 5: active approved rows reached 2,613, mapped rows 2,271, and within-cap explanations 1,428; unresolved 342 topic and 535 over-cap exceptions remain held.

- [x] Process Biology source-preserving fine-tuning batch 6: 11 owner-explanation candidates passed the 50-character four-to-five-line gate; 8 new records were released and 3 existing duplicates were skipped.
- [x] Re-run the active audit after Biology batch 6: active approved rows reached 2,621, mapped rows 2,279, and within-cap explanations 1,436; unresolved 342 topic and 535 over-cap exceptions remain held.

- [x] Re-run the runtime playable-gap audit after the completed owner-source Biology fine-tuning: 1,807 authorised records are playable, giving 2,807 total learner questions with the 1,000-question model bank; 472 over-cap explanations, 342 unmapped topics, and 369 needs-review rows remain excluded.
- [x] Complete the current fine-tuning-ready Chemistry and Biology pass: Chemistry’s 197 candidate records and Biology’s 48 new source-preserving releases are processed through duplicate-safe gates; remaining records are held for topic, explanation-depth, or review reasons.

- [x] Review held Chemistry and Biology records and identify explanation-only holds that are safe to shorten under five lines.
- [x] Shorten and release eligible held Chemistry and Biology explanations in duplicate-safe batches without changing questions, options, answer keys, or syllabus topics.
- [x] Re-run active quality and runtime playable audits after the held-record remediation.

- [x] Classify held Chemistry and Biology rows: 129 Chemistry and 315 Biology records were safe explanation-shortening candidates after topic, option, and answer checks; other holds remain unsafe or structurally unresolved.
- [x] Shorten and apply Chemistry batches 1–2: 40 long explanations reduced from six lines to four using source sentences only.
- [x] Shorten and apply Biology batches 1–2: 40 long explanations reduced from six lines to four using source sentences only.
- [x] Continue shortening the remaining eligible held Chemistry and Biology explanations in bounded batches.

- [x] Shorten and apply Chemistry batches 3–4: 29 additional long explanations reduced from six lines to four using source sentences only.
- [x] Shorten and apply Biology batches 3–4: 40 additional long explanations reduced from six lines to four using source sentences only.
- [x] Re-run audits after shortening batches 3–4: active over-five-line exceptions fell to 386, and authorised playable records rose to 1,956; total learner-facing questions are now 2,956 including the 1,000 model bank.
- [x] Continue shortening the remaining eligible held Chemistry and Biology explanations in bounded batches.

- [x] Inventory every available question source, parsed file, staged payload, import receipt, and held ledger for a complete import map.
- [x] Identify every safe owner-provided batch that can be imported without user intervention.
- [x] Import all safe batches and shorten eligible explanations under five lines while preserving answer keys and source wording.
- [x] Reconcile and report all remaining holds with explicit reasons after the complete safe-import pass.

- [x] Resume and apply Chemistry shortening batches 5–6: 40 additional four-line explanations released from the current safe queue.
- [x] Apply Biology shortening batches 5–10: 120 additional four-line explanations released from the current safe queue.
- [x] Refresh the eligibility map after the autonomous batches: 116 Biology over-cap records remain safely shorten-able; Chemistry has no remaining over-cap shortening candidates, with five short explanation-only records held for review.

- [x] Complete autonomous safe-shortening batches through Biology batch 16: all 315 initially eligible Biology candidates and 129 Chemistry candidates were evaluated; source-preserving releases were applied wherever explanations exceeded five lines and topics/options/answers were safe.
- [x] Final eligibility map shows only 6 short explanation-only records remaining: 1 Biology and 5 Chemistry; they are held because shortening cannot improve already-short source explanations without inventing content.
- [x] Final runtime audit after the autonomous pass: 2,251 authorised records are playable, giving 3,251 total learner-facing questions including the 1,000 model bank; 28 over-cap explanations, 342 unmapped topics, and 369 needs-review rows remain excluded.
- [x] Inventory every available question source, parsed file, staged payload, import receipt, and held ledger for the complete import map.
- [x] Identify every safe owner-provided batch that can be imported without user intervention.
- [x] Import all safe batches and shorten eligible explanations under five lines while preserving answer keys and source wording.
- [x] Reconcile and report all remaining holds with explicit reasons after the complete safe-import pass.

- [x] Extend the source-preserving shortening path to all four core subjects and classify remaining runtime over-cap records.
- [x] Process all 28 safe Physics over-cap explanations in two guarded batches; no all-subject over-cap candidates remain.
- [x] Final runtime audit after the complete all-subject safe-import pass: 2,279 authorised records are playable, giving 3,279 total learner-facing questions including the 1,000 model bank; remaining holds are 369 needs-review and 342 unmapped-topic records.

- [x] Inventory all 342 authorised records currently held only for missing official syllabus-topic mapping.
- [x] Map all 342 approved unmapped records to official JAMB syllabus areas using their supplied question content and authoritative subject maps: 281 high-confidence and 61 medium-confidence classifications, with no unresolved mapping hold.
- [x] Revalidate mapped records against topic, answer, option, duplicate, and explanation gates before release; 279 became playable immediately and the remaining 63 over-five-line explanations were safely shortened from source sentences only, releasing all eligible mapped records.
- [x] Report the revised learner-facing total and every residual non-mappable hold after the mapping pass: all 342 approved unmapped records now have official topics; the final live audit reports 2,714 authorised playable records and 3,714 learner-facing questions including the 1,000 model bank. The only remaining runtime holds are 369 needs-review records; none remains held for missing topic mapping or explanation length.

- [x] Parse the user-designated trusted Physics and Use of English Markdown batches while preserving their supplied answer keys and explanations: 100 complete Physics questions and 58 complete Use of English questions were structurally usable; a 40-item English outline and one answer-indeterminate English card remain outside gameplay.
- [x] Map the trusted Physics and Use of English topic labels to official JAMB syllabus areas and repair only structural duplicate or option/answer-index issues needed for reliable gameplay; no answer key or explanation was externally audited or replaced.
- [x] Import the trusted Markdown records directly with user-authorised provenance and verify the updated playable total: all 100 Physics items already existed as exact authorised duplicates, while 57 non-duplicate Use of English items were imported. Eight source cards with duplicate answer options remain technically held.

- [x] Make every learner-facing topic picker list exactly the official JAMB syllabus areas for its selected subject, with no substitute or extra labels; unavailable official areas remain visible but cannot launch empty drills.
- [x] Move the question palette below the active question in both CBT and standard question modes while preserving answer, flag, timer, and keyboard behavior.
- [x] Parse the supplied CSV, compare every record against the full active bank for exact and normalized duplicate matches, and retain only technically playable non-duplicates for import: 742 imported; 382 duplicates skipped; 36 duplicate-option cards and 30 Mathematics cards held.
- [x] Verify the responsive topic menus and bottom palettes, then report the duplicate-safe CSV intake result and revised playable total: 35 tests and 92 assertions pass, the production build succeeds, and the live bank reports 3,456 authorised playable records plus the 1,000 model questions.

- [x] Inventory the remaining 369 authorised needs-review records by structural, topic, answer, option, and explanation blocker: the deterministic pass found 369 initial holds, then reduced them to 25, and the notation-safe normalizer confirmed the final five choices were distinct rather than duplicates.
- [x] Apply only deterministic or source-preserving repairs that clear every release gate; all 369 initial needs-review records were released through official-topic mapping, source-preserving explanation shortening, status-only approval, and notation-safe duplicate correction. No needs-review records remain.
- [x] Revalidate the needs-review remediation pass and report every released record and residual protected hold: the live audit reports 3,473 authorised playable records and 4,473 learner-facing questions including the 1,000 model bank. No needs-review records remain; 352 other authorised records remain excluded for invalid option content.

- [x] Preserve valid five-option questions throughout duplicate detection, practice, CBT, answer review, and import gates; reject only genuinely repeated option content.
- [x] Audit diagram-dependent questions and create restrained black-and-white instructional diagrams only where the source wording and syllabus concept make a visual necessary. The verified benzene and kidney visuals are attached only to concept-safe cards; records requiring absent source figures remain protected.
- [x] Add one source-safe black-and-white kidney cross-section diagram to the active Bowman’s-capsule cortex question without recreating any omitted source figure.
- [x] Extract user-authorised Atomic Habits themes and compose a Monday–Wednesday relationship-time intro sequence plus seven rotating systems-focused intro stories with a functional Skip Intro control.
- [x] Upgrade the opt-in reminder schedule to three daily, deduplicated delivery windows and verify the deployed callback behavior.
- [x] Parse, duplicate-check, syllabus-map, and stage only technically complete questions from the three newly supplied JAMB PDFs; hold answer-uncertain or malformed items. The keyed 500-question master-bank PDF released 393 records after four duplicate skips and three protected holds; the other two PDFs remain held because they lack answer keys.
- [x] Verify the new diagrams, rotating intro, five-option experience, three reminder windows, and PDF intake outcomes before publication. The evidence-bound real two-run reminder test remains separately open.
- [x] Replace the static opening quote treatment with a live keyboard-style Atomic Habits quote-of-the-day animation, preserving Skip Intro and reduced-motion access.

- [x] Reorganize syllabus navigation and weakness analytics into larger official parent sections with expandable detailed topics while preserving exact topic IDs for drills and quality gates. Every official topic is covered exactly once by the grouped map; detailed drill payloads remain unchanged.

- [x] Validate the newly supplied English 2004, Biology 2004, and Chemistry 2021 question-answer pairs, match exact held-PDF records, and import only cards that pass answer, syllabus, duplicate, and structural gates. 125 records were joined, 38 full-bank duplicates were skipped, 86 were imported as approved, and one unmappable Biology record remains held; see reports/supplied_answer_key_pair_intake_summary.md.

- [x] Run a final weekend audit of today’s goal session, dynamic weakness analysis, question-palette placement, and core learner flows; fix safe regressions and preserve evidence-bound holds. See reports/monday_release_scrutiny.md.
- [x] Ensure the today’s goal session is backed by live/persistent progress rather than static display data.
- [x] Ensure weakness analysis can surface newly calculated weak topics and does not remain static after learner activity. The dashboard now analyzes the newest 12 rounds instead of freezing on the oldest window.
- [x] Verify the question palette remains below the active question in study and CBT modes at desktop and mobile widths.
- [x] Keep the question ledger visually below the active question at every breakpoint, including CBT mobile styling.
- [x] Enable question-ledger navigation for untimed study rounds without bypassing answer-state safeguards.
- [x] Prevent the opening sequence from auto-leaving before the live Atomic Habits quote finishes typing and has a readable hold.
- [x] Verify grouped parent syllabus sections launch their selected exact topic drill in untimed study mode.
- [x] Fix the reported About-page question count mismatch: reconcile the displayed 4,952 total with the latest authoritative learner-facing playable count and add regression coverage across tabs. The runtime count is 4,952: 3,952 quality-gated authorised questions plus 1,000 model questions; the About page now reads the same settled count as Practice.

- [x] Replace the score-oriented visible goal setter with a custom daily study goal: choose a question count and optionally a specific official syllabus topic, persist it, and show progress toward today’s goal while keeping the long-term JAMB target score separate. Daily progress counts all answered questions for an open goal or only matching answer-review records for a selected official topic.
- [x] Reconcile the apparent 4,0xx question count and, if the verified learner-facing total is below 5,000, add enough duplicate-safe, answer-keyed material to cross 5,000 without guessing answers or explanations. The runtime learner-facing total is now 5,537, reached through the validated user-supplied final CSV rather than unsafe web scraping.
- [x] Inspect the connected Supabase `KAIRO.question` table (reported 3,077 records) first; profile subject coverage and only stage verified non-duplicates, falling back to the user’s CSV export if the table is incomplete or inaccessible. Both accessible connection projects lacked `KAIRO.question`, so the supplied export became the documented fallback.
- [x] Profile, validate, deduplicate, and safely import the uploaded `questions_rows(2).csv` as the confirmed fallback for crossing the 5,000-question learner-facing milestone. Of 3,077 input rows, 3,044 were normalized; 585 release-ready records were duplicate-safe and imported in schema-valid 500/85 batches, producing 5,537 runtime-playable questions.
- [x] Parse, validate, deduplicate, and safely import the uploaded `physics_jamb_2000.md` batch, preserving its supplied answer keys and explanations while maintaining all quality gates. All 37 parsed records passed the corrected four-option, answer, explanation, and official-topic gates; all 37 imported with zero holds or duplicates. Runtime total is now 5,574; 45 test files / 118 tests pass, production build succeeds, and mobile Practice verification is clean.
- [x] Run the final audit for the newly supplied Physics pasted records (pasted_content_6 through pasted_content_10 plus the inline four-record sample), report subject totals and storage paths, and import only safe non-duplicates.

- [x] Complete the final Physics follow-up intake with unique per-record external IDs: 124 records imported, four same-batch duplicate candidates held, and ten additional source-quality/topic holds retained outside gameplay.
- [x] Update runtime-count regression receipts and run the complete final test/build audit after the Physics follow-up import.

- [x] Prepare a learner-readable export of the current 5,849-question bank with subject, topic, question, options, answer, explanation, and source classification for user inspection.

- [x] Add an unrestricted authenticated custom daily-goal input that accepts a learner-selected question count such as 100, validates a practical range, persists it, and leaves completed goals unlocked for continued practice. The persisted range is 5–500 questions, and the visible quick picks now include 100.
- [x] Expand the Profile achievements experience into an evidence-based 50-badge collection with earned, locked, and next-achievement states rather than decorative achievements. Achievement progress is derived from real answers, correct answers, rounds, streaks, activity days, completed goals, XP, CBTs, full mocks, subjects studied, and measured subject accuracy.
- [x] Add learner-facing overall performance analytics, including a daily study heatmap, accuracy trend, subject comparison, and clear empty states for new users. Progress now presents a 28-day activity heatmap alongside the existing accuracy history, subject signals, recovery guidance, and useful empty states.
- [x] Audit diagram-needing playable questions and add verified, clean black-and-white visual aids only where the diagram is answer-aligned and useful; display them inside the live question interface. Six self-contained Physics visuals are linked in `reports/physics_diagram_set_aug17.json`; questions requiring unavailable original figures remain excluded from reconstruction.

- [x] Expand the verified black-and-white diagram set with additional self-contained Physics, Biology, and Chemistry visuals, attaching only answer-aligned assets to live playable questions and recording the linked records in an audit manifest. Fourteen cross-subject diagrams were linked—five Physics, five Biology, and four Chemistry—bringing the audited playable visual-question total to 20.

- [x] Add a navigable CBT exam log that lists completed CBT attempts and lets an authenticated learner reopen one specific attempt for full per-question correction review, including the selected answer, correct answer, explanation, timing, and summary context. The review is protected to the original learner and explicitly read-only, so it cannot alter the saved score or create a duplicate attempt.

- [x] Upgrade saved CBT corrections to reopen in the familiar full CBT question interface with green/red answer stamps, a question palette, and read-only All, Correct-only, and Wrong/unanswered-only filters. The historic correction remains immutable and returns to Progress after the final reviewed question.

- [x] Fix the reported saved-CBT regression: selected correction attempts now open through a direct protected action, and the exam log reads the complete CBT history from a dedicated 100-attempt endpoint rather than the dashboard’s 12-round analytics window. Database verification found two stored CBT attempts and nine separate sprint-practice rounds for the current learner, so the visible two CBT logs are complete rather than truncated.

- [x] Replace blank performance-tracking placeholders with a real responsive accuracy-over-time line graph, plotted points, readable axes, and honest empty states; ensure subject performance visuals render when recorded data exists. The line now appears in the always-open Progress evidence card, and subject accuracy tracks render from real attempts only.

- [x] Audit the withheld diagram-referencing questions, classify which are safely recreatable from self-contained text, identify which require original source images, and create only verified new diagram-based records without lowering the existing quality gates. The 48-item audit is documented; two original-figure holds were protected, ordinary no-diagram candidates were not guessed into gameplay, and verified Biology/Chemistry/Physics diagram batches were released with answer-aligned assets.

- [x] Prepare a user-readable review file listing each held diagram-referencing question, its subject/topic/options, hold reason, and whether it needs the original figure or can be approved for a new instructional schematic. The generated file contains all 48 entries with options and recorded answer keys; two require original source figures and 46 are optional schematic candidates subject to source/answer approval.

- [x] Reclassify the broad diagram-candidate list into ordinary no-diagram release candidates versus genuine visual candidates; validate user-identified review items 6 and 7 through the normal release gates without adding unnecessary visuals. Items 6 (`chem-docx-091`) and 7 (`chem-docx-135`) are already active, approved Chemistry records with the official `Organic compounds` topic; no duplicate release or diagram is needed.

- [x] Reclassify all held diagram candidates—not just items 6 and 7—into ordinary no-diagram questions, genuinely useful optional visuals, and original-figure-dependent holds; validate and release safe ordinary records without adding unnecessary diagrams or duplicates. The final reconciliation records 11 already-playable no-diagram candidates, 35 ordinary candidates held pending source/answer approval, and two original-figure-dependent holds; all later owner-keyed visual releases were duplicate-safe.

- [x] Diagnose and fix the notification regression where an opted-in learner receives a successful test push but misses the scheduled 7:00 a.m. reminder; verify timezone, schedule execution, eligibility, and delivery logging. The original runtime scheduler did not dispatch callbacks reliably; it was replaced with one active managed Lagos schedule calling the same direct VAPID transport that the owner visibly confirmed on-device.
- [x] Investigate the newly confirmed 7:00 a.m. Africa/Lagos non-delivery after OneSignal rollout: capture the callback, identify whether the learner is enrolled in OneSignal or browser push, and obtain provider/device evidence before declaring a repair. The provider worker route was retired after repeated browser evaluation failures; direct browser push has verified device evidence.
- [x] Compare the now-visible manual test path with the invisible scheduled-reminder path, remove any transport, payload, or idempotency difference, and prove the schedule invokes the same confirmed device route. The managed endpoint explicitly calls `sendDailyDirectBrowserReminders`, which uses the direct VAPID sender only; the manual controlled test used the same stored browser subscription and was received.

- [x] Add a temporary one-time 8:00 a.m. Africa/Lagos notification test without changing the regular 7:00 a.m., 1:00 p.m., and 7:00 p.m. daily reminder jobs; remove or expire the temporary test after execution. The test and a second diagnostic recorded no scheduler executions and were deleted; no delivery claim was made.
- [x] Run a new one-time 8:30 a.m. Africa/Lagos OneSignal schedule test after the provider Web-origin repair, preserve the permanent 7:00 a.m./1:00 p.m./7:00 p.m. jobs, and record callback plus device evidence before removing the test. The temporary job reached its 08:30 WAT target and an observed lag window with zero execution records, so it was deleted immediately; permanent jobs remained unchanged. This proves date-specific one-time Heartbeat creation is not a valid delivery-evidence method in this project.
- [x] Replace the non-executing date-specific Heartbeat test method with a scheduler-safe controlled execution route, then obtain both callback evidence and a real device receipt before considering scheduled notifications fixed. A one-minute controlled test and a temporarily repointed existing afternoon job also produced no new executions. The uncertain afternoon job was paused before any stray send, deleted, and recreated cleanly as `jamb-quest-comeback-afternoon-lagos-v3` at 13:00 Africa/Lagos; the provider and phone direct tests remain working, so scheduler dispatch is the outstanding fault. Superseded by the verified managed direct-push schedule and owner phone receipt.
- [x] Resolve the confirmed scheduler-dispatch fault: the user’s 10-minute wait after the controlled test produced no notification because no scheduled callback executed. Do not create further temporary jobs or claim delivery until a supported production scheduler route is verified. The non-dispatching callback system is no longer used; the managed direct browser-push task is active at the three Lagos windows.
- [x] Replace the failed runtime scheduler with a provider-scheduled OneSignal queue: pre-create the learner’s upcoming 7:00 a.m., 1:00 p.m., and 7:00 p.m. Africa/Lagos messages, persist message IDs and window keys, prevent duplicates, and expose queue health plus a safe refresh action in Profile. The queue service, migration, Profile health view, and exact Lagos slot tests are implemented; it waits for an actual provider-managed device subscription before it can create recipient-targeted messages.
- [x] Repair and prove the missing OneSignal provider subscription before queuing messages: the provider returned `All included players are not subscribed` for the learner’s external ID, proving the visible manual test was falling back to browser VAPID. The subsequent browser diagnostics proved the provider worker could not evaluate on the learner’s device; this route was retired rather than falsely claimed as working, and the independently verified direct browser-push replacement is now active.
- [x] Create a controlled 2:00 p.m. Africa/Lagos OneSignal provider test only after a fresh subscription probe confirms the learner’s device is subscribed; preserve the regular 7:00 a.m., 1:00 p.m., and 7:00 p.m. queue unchanged and record the provider response plus device receipt. Superseded by the user-approved direct browser-push route after the provider worker failed repeatedly.
- [x] Make the installed JAMB Quest PWA download and retain approved study content for genuine offline practice rather than functioning as a mere browser shortcut; define safe pack scope, storage limits, progress feedback, update behavior, and cache recovery before release. The Profile now downloads the 4,990 approved online questions and 61 linked question visuals into a persistent study-pack cache, restores the question bank for offline use, preserves that cache through shell-worker updates, clearly reports current/update state, and allows deliberate removal. Browser verification recorded 4,990 cached questions, 61 visuals, 63 cache entries, and persistent storage granted.
- [x] Prioritise and publish the complete offline study-pack experience before resuming the requested controlled OneSignal test; the provider test remains deferred at the learner’s direction. The full cache implementation, controls, and browser verification are complete; the notification test remains separately blocked on the provider subscription proof.
- [x] Repair the stale installed-app update path reported by the learner: their phone still renders the previous “Keep JAMB Quest in your pocket” panel after the offline-pack checkpoint, so guarantee the current deploy invalidates the old application shell without deleting the separately downloaded study pack. The PWA update path now uses safe worker activation; the later device screenshot showed the current “Download your full study bank” panel.
- [x] Repair the learner-reported reminder-enrollment loop: the Profile button repeatedly moves through “Setting up” / “Enable on this device” without settling on a completed provider subscription, queue count, or actionable error. Trace and make the state deterministic before asking the learner to retry. The OneSignal branch was retired; Profile now uses one native VAPID permission/subscription flow and direct test delivery was visibly confirmed.
- [x] Remove the contradictory Profile reminder state reported after the latest deployment: never show “Daily JAMB reminders are now enabled for this device” while also rendering an “Enable on this device” action; derive status and controls from one verified provider state only. The OneSignal-configured branch now returns either provider-ready or provider-pending before legacy VAPID fallback can run, and its regression asserts this isolation. Real-device provider receipt remains tracked separately.
- [x] Reorganize the JAMB Quest desktop interface into intentional multi-column study workspaces rather than a widened mobile stack, while preserving the established compact mobile layout and fixed tab navigation. Desktop Practice is now a stable daily-plan rail, central round launcher, and open syllabus library; wide-screen panels use intentional proportions, scroll boundaries, and sticky context. Desktop and 390px mobile visual verification passed.
- [x] Replace the latest pause-and-reset reminder failure with observable device diagnostics: the button now waits briefly then returns without a durable result, so show exact OneSignal SDK readiness, browser permission, opted-in state, subscription identifier (if any), and provider-verification outcome rather than asking the learner to repeat blind retries. Profile now reports browser permission, SDK readiness, OneSignal push opt-in, and provider device-subscription presence after one attempt; regression coverage protects the fields. The outstanding provider subscription and phone-receipt evidence remain separately open.
- [x] Replace the OneSignal-dependent reminder requirement with JAMB Quest’s own browser-push delivery and a reliable background scheduling route: the live Brave diagnostic proves browser permission is granted but the OneSignal SDK is blocked and no provider subscription can exist; retain the working direct VAPID transport and schedule it independently of the failed provider and non-dispatching runtime scheduler. The direct VAPID endpoint is deployed, one active managed schedule runs at 7:00 a.m., 1:00 p.m., and 7:00 p.m. Africa/Lagos, and the owner confirmed receipt of a controlled direct test on the phone.
- [x] Resolve the confirmed Brave OneSignal SDK block through a supported first-party JAMB Quest delivery path: serve the Web SDK from the app origin if provider licensing and SDK requirements permit, then use the existing valid worker/origin configuration to create a real provider subscription and future Lagos reminder queue. Attempted and conclusively retired: after Brave allowed the script and root MIME caching was corrected, the provider worker still failed evaluation on the learner’s device. The supported, verified direct VAPID replacement avoids this dependency.
- [x] Repair the captured OneSignal root-worker MIME failure: after Brave allowed the SDK, it requested `/OneSignalSDKWorker.js` at root and received the JAMB Quest HTML shell (`text/html`) rather than JavaScript; make the provider’s required root worker valid without breaking the existing root-scope PWA offline worker. The new root compatibility worker imports the existing PWA worker, which now imports OneSignal’s worker; local verification returns `Content-Type: text/javascript`, the static regression protects the routing, and PWA cache/push event handling remains in the combined worker.
- [x] Repair the next captured OneSignal root-worker failure: the correct JavaScript worker path now loads, but the combined PWA/provider worker produces `ServiceWorker script evaluation failed`; replace it with OneSignal’s exact standalone root worker and restore the separate JAMB Quest PWA worker before retrying enrollment. The root worker now loads OneSignal first and then JAMB Quest’s PWA behavior in the documented combined-worker order; JAMB Quest registers that shared root worker for its own offline support, while stale direct `/sw.js` registrations retain compatibility. Validation confirms the root file remains JavaScript and all tests/build checks pass.
- [x] Reproduce the repeated `ServiceWorker script evaluation failed` result in a controlled browser and capture the worker’s actual exception before making another OneSignal configuration or code change; do not ask the learner to retry an unproven worker again. The official OneSignal worker and the exact provider root URL both evaluated successfully in controlled registrations, proving the learner device was retaining a prior failed worker script. The production server now serves the root worker dynamically as JavaScript with `Cache-Control: no-store`, preventing that stale worker response from persisting after a repair; local header and registration validation pass.
- [x] Retire the repeatedly failing OneSignal enrollment route from the learner-facing reminder flow and restore JAMB Quest’s proven direct VAPID browser-push delivery, paired with a reliable schedule that does not use the already non-dispatching callback route. Profile now uses native browser notification permission and VAPID subscription registration only.
- [x] Implement the user-selected direct-push reminder route with three managed Lagos-time daily triggers at 7:00 a.m., 1:00 p.m., and 7:00 p.m.; create a separate controlled direct-push test and verify real device receipt before marking the system reliable. The single active managed task is configured in Africa/Lagos through 2030 and invokes the VAPID-only endpoint at all three windows; the controlled test was accepted by the push service and visibly received on the owner’s phone on August 18, 2026.
- [x] Harden active CBT session continuity against accidental browser back actions, refreshes, and app restarts: preserve exact question position, selected/recorded answers, flags, timer state, and round mode locally before navigation, while keeping the existing authenticated resume flow as a secondary recovery layer. The new Exam Safety Net writes the initial CBT state before the quiz opens and immediately persists answers, navigation position, flags, and pause state; reload/close warning and resume recovery now use that richer local snapshot.
- [x] Add a clear confirmation before an active CBT session can be exited or replaced, with explicit “Continue exam” and “Save and exit” choices that prevent one stray tap from discarding an in-progress simulation. The CBT back control now opens a save-and-exit dialog; browser back also asks for confirmation while retaining the saved state.
- [x] Add a guided new-learner activation journey that introduces profile/target setup, first practice, notification opt-in, and progress interpretation without blocking normal use or treating real analytics as static onboarding content. Authenticated learners with no completed rounds receive a compact four-step setup rail that links to existing real profile, practice, reminder, and progress actions, then disappears after the first round or a deliberate dismissal.
- [x] Research current JAMB CBT app patterns from TestDriller, MySchool, and comparable products; extract only original, useful concepts for the JAMB Quest roadmap, avoiding copied interfaces, wording, or question content. Public feature research is recorded in `reports/cbt_app_patterns_aug18.md`; it confirms a focused continuity, correction history, offline, and evidence-first roadmap rather than feature sprawl.

- [x] Create and integrate nine user-supplied Biology diagram questions using the supplied answer keys and explanations as authority, with sharper labelled visuals, duplicate checks, official syllabus mapping, and learner-facing validation. All nine are imported and approved, each has a reserved generated diagram URL, database verification confirms 9/9 linked, and validation passes at 49 test files / 128 tests, TypeScript, and production build.

- [x] Create and integrate the ten user-supplied Chemistry diagram screenshots as nine unique verified questions, excluding the repeated solubility graph, with precise structures/formulae, official syllabus topics, duplicate checks, and learner-facing validation. All nine records were imported through the authorised pathway, approved, and linked to their exact stored visuals; the duplicate-safe manifest and database verification confirm 9/9 linked. Validation passes at 50 test files / 130 tests, TypeScript, and production build.

- [x] Remove the two active Biology questions that refer to missing labelled figures from gameplay without guessing replacement diagrams; preserve them as protected original-figure-dependent holds.
- [x] Remove the two active Biology questions that refer to missing labelled figures from gameplay without guessing replacement diagrams; preserve them as protected original-figure-dependent holds. Both records were changed from approved to needs_review after database verification found null diagram URLs; the 48-candidate reconciliation now separates 11 already-playable no-diagram candidates, 35 normal-intake candidates, and the two protected original-figure holds.

- [x] Diagnose the 17 August 8:00 a.m. Africa/Lagos notification non-delivery, correct the permanent scheduled-callback configuration without disturbing the intended 7:00 a.m., 1:00 p.m., and 7:00 p.m. Lagos reminders, and retain actual execution evidence. Historical callback jobs are retired; one managed direct-push schedule is active at the intended three Lagos windows and its transport has a confirmed device receipt.

- [x] Renew the current installed-app browser-push subscription after the scheduler executed and the provider accepted both the 1:09 p.m. and 7:00 p.m. sends without a visible phone alert; verify an on-device test after renewal before claiming delivery. The direct VAPID re-enablement flow renews an existing subscription; its fresh controlled test was accepted and visibly received by the owner.
- [x] Evaluate and, if the owner provides or enables it, integrate OneSignal push delivery for JAMB Quest with device-level delivery diagnostics and a verified scheduled reminder test. The provider configuration and diagnostics were thoroughly evaluated; the browser worker remained incompatible on the owner device, so it was intentionally retired in favor of the verified direct route.
- [x] Replace the current browser-push route after the final production test was provider-accepted but visibly absent on the learner device; preserve the JAMB Quest notification copy in the provider-managed replacement. The premise was disproved by the final direct VAPID controlled test: it was accepted and visibly received on the phone, so the direct JAMB Quest route remains the chosen transport.

- [x] Run one final controlled JAMB Quest browser-push test and compare its provider acceptance with the current enabled subscription state before recommending the next delivery route. The exact production test path returned `delivered: true` for one enabled subscription on learner user 1. This proves the provider accepts the browser endpoint; the learner must still confirm whether the phone visibly displayed this fresh test.
- [x] Audit, deduplicate, and safely import the newly supplied 2020–2023 Physics question records plus the verified 2004 and 2005 Physics Markdown records, releasing only structurally complete and answer-safe questions. The raw pasted material contained 200 complete records: 152 safe, non-duplicate candidates were imported; 39 structurally incomplete, figure-dependent, duplicate-option, or explanation-ambiguous records remain held, and nine exact duplicates were withheld after full-bank comparison. Eight safe Markdown records were imported; the one duplicate-option record remains held.
- [x] Convert the fifteen owner-supplied Physics screenshots into answer-aligned learner-ready diagram questions using their supplied answer key and concise explanations, preserving any source ambiguity as a hold rather than guessing. All 15 were imported as approved Physics records and linked to their exact stored deterministic diagrams; their regression test preserves the supplied answer indexes.

- [x] Audit and safely integrate the final owner-supplied Biology image-question batch from 10 screenshots plus the supplied answer key, deduplicating against the live bank and holding any incomplete or answer-ambiguous records. Thirteen unique complete records were imported and approved with exact clean diagram links; answer-key entries 14 and 15 were held as duplicates. Validation passes at 53 Vitest files / 135 tests, TypeScript, production build, database verification, and mobile rendering.

- [x] Fix mobile CBT diagram rendering: the energy-profile question shown in the learner screenshot referenced a diagram “above” but displayed no image. The approved Chemistry record had a NULL diagram URL; a clean activation-energy SVG is now attached and verified. Focused diagram/card regressions pass within 53 files / 136 tests; the launch screen renders cleanly on mobile.

- [x] Add a release-time guard that blocks approved question records whose wording requires a diagram but whose diagram URL is missing, preventing another blank “diagram above” CBT question. The mapper now holds diagram-referencing records without assets, with regression coverage; validation passes at 53 files / 137 tests, TypeScript, and production build.

- [x] Add a visible functional equals (=) key to the in-CBT JAMB calculator and verify that it evaluates expressions correctly on mobile. The equals key now uses an explicit high-contrast style, is visible in the 390px mobile fixture, and the calculator regression verifies `32 × 2 = 64`; validation passes at 53 files / 138 tests and TypeScript.

- [x] Trace and repair the real CBT diagram delivery path: diagrams remain absent for the learner despite stored links; verify the live question payload, asset URL response, frontend image rendering, and mobile deployment before marking complete. The Physics diffraction and Chemistry nomenclature records now carry clean replacement SVGs; both assets return HTTP 200 as image/svg+xml, and the live authorised-question API includes both IDs and URLs. The frontend renderer and mobile fixture are verified.

- [x] Audit every learner-playable diagram-referencing question across the static and authorised banks, attach answer-aligned visuals for genuine cases, and hold ordinary or evidence-incomplete records so no blank diagram question reaches CBT. Final guarded live-bank audit: 4,983 playable authorised questions; 27 textually diagram-referencing records; 16 with assets; 11 remaining text-only graph/figure-language false positives (3 English figures of speech and 8 Physics graph-concept stems), with no blank explicit-figure question exposed. The final explicit Chemistry rate-of-reaction diagram stem is now guarded. Validation passes at 53 files / 139 tests and TypeScript.

- [x] Remove answer-revealing labels and captions from recreated diagrams; verify every replacement visual gives only question evidence and never prints the correct answer, final name, or answer-revealing annotation. The Physics diffraction and Chemistry structure diagrams now contain only the visual evidence; the answer word, final IUPAC name, and answer-revealing numbering were removed. Both live SVGs return HTTP 200, and validation passes at 53 files / 139 tests, TypeScript, and production build.

- [x] Withdraw the owner-rejected generated screenshot-batch diagrams from learner play, preserve their question records as review holds, and never substitute a new generated diagram without an owner-supplied original visual. All 46 owner screenshot-batch records are now `needs_review` with `diagramUrl = NULL` (22 Biology, 9 Chemistry, 15 Physics), while the two separately defective Chemistry reconstructions are also held; the source records remain for future owner-original relinking.
- [x] Repair malformed diagram-question stems, including the visible `[Diagram Question]` prefix, and add a release regression that rejects answer-leaking labels such as the correct option text within a diagram asset. The prefix was stripped from stored records and the learner mapper normalizes it defensively; a regression proves an owner-rejected screenshot-batch record is held even if an old asset URL were accidentally restored.
- [x] Audit all generated Chemistry structural-formula diagrams for clear organic notation, neutral evidence-only labels, mobile composition, and answer leakage; remove any failing record rather than attempting another generated recreation. The entire nine-record Chemistry screenshot batch and the two separate defective Chemistry reconstructions were withdrawn rather than regenerated; only future owner-supplied originals may be reviewed for relinking.

- [x] Recover authentic original visuals for the 48 held screenshot-derived diagram records from retained local uploads, source references, or lawful original-source pages; do not generate substitutes, and relink only evidence-matched recoveries after phone-readability review. Exact retained originals were recovered for 46 records (15 Physics, 9 Chemistry, 22 Biology), cropped to preserve source evidence while excluding answer choices and feedback, uploaded as owner-original assets, and restored through the learner API; all 46 distinct URLs are present in the live question feed. The two separate non-screenshot Chemistry records (1050122 energy profile and 1050171 organic structure) remain held because their originals were not found.

- [x] Reconcile the learner-reported drop from 6,020 questions against the database, API, and displayed-count code; restore only records that pass the established structural, syllabus, explanation, and diagram-evidence gates. The database retains 5,403 active approved owner rows; the learner API contains 4,990 safe authorised records plus the 1,000 static model records, for 5,990 playable questions. Four self-contained Chemistry structures were safely restored after the guard had misclassified them; the remaining 30 difference from 6,020 depends on missing original diagrams and remains protected rather than returned as broken CBT cards.
- [x] Deliver the exact installed-app cover icon used by JAMB Quest, not the transparent standalone mark or wordmark variant. Delivered `jamb-quest-icon-512.png`, the square navy installed-app cover with the gold upper-right tile.
- [ ] Recover authentic original visuals for the remaining 30 figure-dependent questions needed to return the learner-visible bank to 6,020; no generated reconstruction or blank-figure release is allowed.
- [x] Add the owner’s 380 Mandate pledges to the authenticated Profile as a compact, mobile-readable, persistent system section: Error Audit Pledge, Never Miss Twice Rule, and 100% Correction Mandate. The Profile now presents the three rules, benchmark strip, and personal target in a compact card; mobile review passes at 390px and the regression protects all pledge copy. Validation passes at 57 files / 147 tests, TypeScript, and production build.
