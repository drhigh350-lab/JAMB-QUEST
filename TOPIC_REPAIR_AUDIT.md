# Topic Repair Audit

The active 1,000-item model-bank asset does not contain `authorised-60074`. The affected Chemistry label originated from persisted answer-review data for an authorised question, so its actual topic was recovered through the authorised-question source path rather than guessed.

`authorised-60074` asks about the diffusion time of hydrogen and another gas. Its verified stored and learner-facing topic is **Gas Laws and Diffusion**. Runtime topic inference now derives actual content-based topics for other approved placeholder records, while the dashboard resolves legacy review records by their question IDs before creating weak-topic guidance.

## Conservative full-bank migration

The active authorised bank originally contained 780 placeholder-topic records. Successive deterministic wording audits classified and migrated **615** records where question wording matched a specific topic rule, including the direct verification of `authorised-60074`. Those records now carry actual stored topics. The remaining **165** records did not meet the conservative evidence rule and remain explicitly unresolved: 121 Biology, 43 Chemistry, and one Physics record. They are excluded from weak-topic and daily-mission guidance rather than being assigned a generic or invented topic.

The repeatable audit report is stored at `reports/placeholder_topic_audit.json`. It confirms that all remaining placeholder records are unresolved, not candidates for automatic topic migration.
