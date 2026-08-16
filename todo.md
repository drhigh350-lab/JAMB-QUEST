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
- [ ] Deploy the daily callback, create the recurring schedule, and verify that incomplete opted-in learners receive no duplicate reminders.
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
- [ ] Identify each historically AI-written model-bank explanation set and document whether each record was label-repaired, regenerated, or withheld from gameplay. The current model-bank metadata identifies one original JAMB-aligned practice set, but does not identify an AI writer or generation run; owner/source evidence is still needed before calling it historically AI-written.
- [x] Add a structural answer-integrity audit for active model-bank explanations, separate from the completed template-style audit. All 1,000 active records have a valid A-D key, matching answer text, four distinct clean options, and no embedded answer/explanation metadata; factual correctness and wording ambiguity remain separately unverified.
- [ ] Keep the 838 short active model explanations in an explanation-depth and provenance backlog until their release basis is documented or an owner-approved enrichment brief is supplied.
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
- [ ] Complete the remaining eligible owner-provided authentic-question enrichment and release pass, with only corrupted, diagram-dependent, or answer-uncertain records left held for cleaner source review.
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
- [ ] Identify every remaining historically AI-written explanation set by source and prove each was regenerated to the authentic-style contract or withheld from gameplay.
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
- [ ] Map every Chemistry record to an official JAMB Chemistry syllabus topic
- [x] Deduplicate and structurally audit the Chemistry batch before release
- [ ] Release only quality-approved Chemistry records and document held records with reasons

- [x] Reconcile the reported 2,275 versus 3,118 question counts across stored, approved, playable, and UI display paths without changing question data
- [x] Explain or correct any intentional quality-gate exclusions in the learner-facing count

- [x] Diagnose why the 650 stored Lekki Headmaster questions are not visible or launchable from the current Practice interface
- [x] Restore the Lekki Headmaster Practice entry without weakening source or quality gates
- [x] Add regression coverage for Lekki visibility and launch

- [x] Recount and parse every question format in the supplied Chemistry DOCX before stating its total; inventory confirms 1,341 source-labelled questions across the 1–1,020 sequence and separate 1–321 bracketed set
- [ ] Restore legacy questions toward the former 3,118 level only after they pass syllabus, answer, duplicate, and concise-explanation review
- [ ] Identify only genuinely diagram-dependent Chemistry questions and add restrained black-and-white learning visuals where useful

- [x] Audit the newly supplied all-subject JAMB PDF for extractable question formats, subject coverage, duplicates, and structural safety before intake
- [ ] Parse and stage only structurally complete records from the all-subject PDF under the existing syllabus, duplicate, answer, and concise-explanation gates
- [ ] Add black-and-white visuals only to approved questions where a diagram is required for solving or understanding the concept

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
- [ ] Continue legacy explanation restoration from batch 10 onward.
- [ ] Identify and add black-and-white diagrams only for questions whose wording requires a visual.
- [ ] Resolve the all-subject PDF answer-key gap before importing its held questions.

- [x] Restore legacy explanation batch 10: 20 approved records updated with validated four-line answer-safe explanations and unchanged question/answer content.
- [x] Audit 21 staged and legacy reports for diagram candidates; 48 wording-level candidates were identified for selective review, with no indiscriminate visuals added.
- [x] Re-run the active syllabus/explanation audit after Biology batch 1 and legacy batch 10; current authorised playable audit reports 1,763 authorised playable records and keeps unmapped, over-cap, and needs-review rows held.

- [x] Harden Biology and legacy explanation generators so empty or error model responses become explicit holds instead of aborting or releasing unsafe content.
- [x] Attempt Biology explanation batch 2 and retain all 20 records held after empty structured responses; no records imported.
- [x] Stage and attempt legacy explanation batch 11; retain all 20 records held after model-response failures; no records applied.
- [ ] Retry held Biology batch 2 when structured model output is available.
- [ ] Retry held legacy batch 11 when structured model output is available.

- [x] Inventory the held all-subject PDF by subject, question range, and answer-key availability before any release decision.
- [x] Research multiple independent answer-key sources for the held all-subject PDF and save source URLs and confidence evidence.
- [x] Release only records whose answer keys are independently cross-checked; keep uncertain records held.
- [x] Verify the evidence-backed import with duplicate, syllabus, explanation, and runtime-playability audits.

- [x] Inventory the held all-subject PDF: 843 pages and approximately 3,095 in-scope question starts across English, Biology, Chemistry, and Physics, with no embedded usable answer key.
- [x] Research public answer-key candidates and preserve source URLs and evidence notes in reports/all_subject_answer_key_research_notes.md.
- [x] Cross-check a bounded 1983 sample across Myschool and SchoolNGR; Biology agreed 5/5, while Chemistry agreed 1/5, Physics 2/5, and English 2/5.
- [x] Refuse unsafe bulk release from conflicting external answer evidence; no held all-subject PDF records were imported.
- [ ] Expand exact matching and corroboration across additional years and subjects when reliable answer evidence is available.

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
