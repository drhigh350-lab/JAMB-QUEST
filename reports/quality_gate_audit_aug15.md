# JAMB Quest Quality-Gate Audit — 15 August 2026

## Decision

JAMB Quest now follows **Quality Before Quantity** for authorised question intake. A new record can enter the learner feed only when its subject and topic resolve to the supplied official JAMB syllabus map, its options are structurally valid, its answer index is valid, and its explanation stays within five non-empty lines. The Lekki Headmaster approved-reading-text set remains the documented exception to the explanation requirement because the source is intentionally question-led.

## Active-bank audit

The database audit examined 2,360 active approved authorised records without rewriting owner content. The resolver mapped 2,018 records to official parent areas. The remaining 342 records are preserved in the JSON audit as topic exceptions and are held from the learner feed until a precise syllabus classification is established.

| Gate | Result |
| --- | ---: |
| Active approved authorised records audited | 2,360 |
| Topic labels mapped to official syllabus areas | 2,018 |
| Topic labels held as unmapped | 342 |
| Explanations within five-line cap | 975 |
| Explanations over five-line cap and held | 735 |
| Lekki approved-reading-text records without explanations | 650 |

The figures are intentionally not presented as a claim that all stored records are learner-playable. Stored source material remains available for controlled remediation, while the runtime mapper excludes unmapped or over-cap rows from gameplay.

## Release verification

The shared resolver has regression coverage for common Physics, Biology, Use-of-English, and Lekki labels. Authorised imports reject unmapped topics and explanations exceeding five non-empty lines. Four-option and five-option question support remains covered. The latest verification passed **88 Vitest tests**, TypeScript checking, and the production build.

## Next intake rule

The next question batch may be supplied in JSON or Markdown form. It will be processed in bounded batches, deduplicated, syllabus-mapped, and explanation-audited before release. Records that fail a quality gate will be held with a deterministic reason; they will not be counted as playable merely to reach the 10,000 target.

The machine-readable evidence is stored in `reports/active_syllabus_explanation_audit.json`, and the official parent taxonomy is recorded in `reports/syllabus_topic_map_aug15.md`.
