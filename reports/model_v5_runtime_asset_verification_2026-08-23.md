# Managed Model Bank v5 Runtime Verification — 23 August 2026

The active learner loader references `/manus-storage/jamb_high_yield_practice_bank_1000_model_v5_explanations_reviewed_688e6cd1.json`. The exact runtime URL was opened directly on 23 August 2026 and returned a JSON payload whose metadata identifies the **JAMB-Aligned High-Yield Practice Bank**, `question_count: 1000`, `format_version: 1.0`, and a source notice that its items are original JAMB-aligned practice items rather than copied official past questions.

The payload begins with the active Use of English model records, including `ENG-001` and `ENG-002`, and retains the expected protected fields: identifier, subject, topic, subtopic, difficulty, question text, options, answer index/text, explanation, tags, and provenance source. This runtime check confirms the v5 asset path loaded by the learner is present; it does not authorise an explanation rewrite or a change to protected question fields.

The only remaining deterministic quality findings are the three previously held English explanations `ENG-044`, `ENG-086`, and `ENG-087`, as recorded in `model_explanation_quality_audit_2026-08-23.md`. They remain source-dependent holds rather than targets for unsourced modification.
