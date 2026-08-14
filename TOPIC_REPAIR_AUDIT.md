# Topic Repair Audit

The active 1,000-item model-bank asset does not contain `authorised-60074`. The affected Chemistry label originated from persisted answer-review data for an authorised question, so its actual topic was recovered through the authorised-question source path rather than guessed.

`authorised-60074` asks about the diffusion time of hydrogen and another gas. Its verified stored and learner-facing topic is **Gas Laws and Diffusion**. Runtime topic inference now derives actual content-based topics for other approved placeholder records, while the dashboard resolves legacy review records by their question IDs before creating weak-topic guidance.

## Conservative full-bank migration

The active authorised bank originally contained 780 placeholder-topic records. The owner-supplied Biology and Chemistry syllabus PDFs enabled the final conservative review. All **780** records now carry actual, syllabus-grounded topics; the deterministic audit reports **zero** remaining placeholder-topic records. The direct verification of `authorised-60074` remains preserved as **Gas Laws and Diffusion**.

The repeatable audit report is stored at `reports/placeholder_topic_audit.json`. It confirms that all remaining placeholder records are unresolved, not candidates for automatic topic migration.

## Official syllabus source check

On 14 August 2026, the official JAMB Integrated Brochure and Syllabus System exposed Biology and Chemistry as e-syllabus subjects, but the Biology detail panel returned **“No document available or PDF renderer not loaded.”** The user subsequently provided the authoritative `Biology.pdf` and `Chemistry.pdf` files. Their reviewed topic map is stored in `SUPPLIED_SYLLABUS_TOPIC_MAP.md`, and it was used to resolve the final direct Biology and Chemistry mappings.
