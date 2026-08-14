# Topic Repair Audit

The active 1,000-item model-bank asset does not contain `authorised-60074`. The affected Chemistry label originated from persisted answer-review data for an authorised question, so its actual topic was recovered through the authorised-question source path rather than guessed.

`authorised-60074` asks about the diffusion time of hydrogen and another gas. Its verified stored and learner-facing topic is **Gas Laws and Diffusion**. Runtime topic inference now derives actual content-based topics for other approved placeholder records, while the dashboard resolves legacy review records by their question IDs before creating weak-topic guidance.

## Conservative full-bank migration

The active authorised bank originally contained 780 placeholder-topic records. Successive deterministic wording audits classified and migrated **697** records where question wording matched a specific topic rule, including the direct verification of `authorised-60074`. Those records now carry actual stored topics. The remaining **83** records did not meet the conservative evidence rule and remain explicitly unresolved: 80 Biology and three Chemistry records. They are excluded from weak-topic and daily-mission guidance rather than being assigned a generic or invented topic.

The repeatable audit report is stored at `reports/placeholder_topic_audit.json`. It confirms that all remaining placeholder records are unresolved, not candidates for automatic topic migration.

## Official syllabus source check

On 14 August 2026, the official JAMB Integrated Brochure and Syllabus System exposed Biology and Chemistry as e-syllabus subjects, but the Biology detail panel returned **“No document available or PDF renderer not loaded.”** The remaining 124 records therefore continue to be excluded pending a usable official syllabus export or owner-supplied authoritative mapping.

A published UTME 2026 syllabus reference was used only to align the names of direct Biology curriculum concepts—such as reproduction, transport, ecology, and coordination and control—not to infer ambiguous records. The remaining 83 records require a usable official export or owner-source mapping before release into weakness guidance.
