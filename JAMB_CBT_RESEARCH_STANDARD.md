# JAMB CBT Research and JAMB Quest Question Standard

## Research snapshot

The reviewed leading CBT products consistently emphasise a realistic timed simulator, subject and topic practice, instant grading, detailed answer explanations, offline access, bookmarks or saved questions, history and performance analytics, and flexible practice settings. MySchool presents year-by-year archives, search, bookmarks, review history, subject/topic resources, calculators, and multiple exam simulators. O3Schools combines topic practice, detailed explanations, offline questions, CBT simulation, analytics, bookmarks, and adjustable exam settings. Schoolhub presents a simple flow of pick a subject, take a timed session, then improve through score review, explanations, and subject strengths and weaknesses. These patterns are product research, not instructions to copy any brand, wording, or visual identity.

A notable quality lesson from the public reviews is that explanation depth is valuable only when the answer is reliable. One O3Schools review specifically reports confusion caused by incorrect English answer keys, so JAMB Quest should favour a consistent, transparent explanation format and preserve internal provenance and validation metadata even when the learner interface stays clean.

## Uniform learner-facing standard

Every question should use the same learner-facing card structure regardless of whether it originated in the original model bank or an owner-provided source. The visible hierarchy is: subject context, one topic label, question number and progress, question stem, four answer options, navigation controls, and after submission a result state with the correct answer plus a substantial explanation. The interface should not expose source-set names, import labels, verification strings, external IDs, or internal provenance badges during normal practice. Provenance remains available to administrators and in the About or data-governance layer.

The only question-level contextual label shown during practice is `Topic: <topic>`. Subject is shown once as the session context, not repeated as competing source labels. Topic text should be normalised for casing and whitespace, with a safe `General revision` fallback when a record has no usable topic.

Explanations should be rendered as a readable learning block rather than a compact one-line note. The content contract is at least five meaningful sentences or approximately 60 words where the source material permits it, covering the concept, why the correct option fits, why common alternatives fail when useful, and a short exam takeaway. Existing shorter explanations must pass through a display fallback that expands the learning structure without inventing unsupported facts; records that cannot meet the quality threshold should be flagged for content review rather than silently presented as authoritative.

## Product decisions for implementation

JAMB Quest should adopt the common high-value patterns of timed CBT simulation, focused topic practice, instant grading, detailed explanations, offline shell support, progress analytics, bookmarks or wrong-answer recovery, and flexible session lengths. It should differentiate through the Smashing 380 comeback system, daily minimums, streak recovery, and a deliberately calm single-format question experience. The implementation should not add more visible labels merely because the data contains more metadata.

## References

[1]: https://play.google.com/store/apps/details?id=com.myschool.cbt&hl=en_US "JAMB CBT + WAEC Past Questions — Google Play"
[2]: https://play.google.com/store/apps/details?id=com.iafsawii.o3schools.jamb&hl=en_US "O3Schools JAMB CBT & AI Tutor — Google Play"
[3]: https://myschool.ng/latest-jamb-cbt-practice-software-free-download "JAMB CBT Software 2026 — MySchool"
[4]: https://jamb.schoolhub.tech/ "JAMB CBT Practice Online & Offline — Schoolhub"
