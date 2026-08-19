# Original Visual Backlog Reconciliation — August 19, 2026

## Current learner-feed evidence

The public `questions.authorisedPlayable` endpoint was queried directly after the four source-backed recoveries. It returned **4,988 authorised learner-playable records**. The restored records `750005`, `750006`, `1050122`, and `1050171` are all present in that exact response.

The authorised database ledger contains **5,510 approved** and **132 needs-review** records across both current and archival sources. The active source set is **5,401 approved** plus **6 needs-review** records, while inactive archival sources contain **109 approved** and **126 needs-review** records. The difference between the active approved ledger and learner feed is governed by the existing learner eligibility rules: subject scope, option integrity, syllabus mapping, diagram-asset presence for explicit visual stems, and the five-line explanation guard. It must not be treated as a diagram-only number.

| Measure | Current evidence | Interpretation |
| --- | ---: | --- |
| Authorised learner-playable API records | 4,988 | Current safe authorised feed; includes all four newly restored record IDs. |
| Static model-bank records | 1,000 | Kept as the separate bundled study bank. |
| Combined learner-visible baseline | 5,988 | Current count before any further evidence-backed releases. |
| Earlier learner-visible snapshot | 5,990 | Historical baseline; the two-record difference is now reconciled below. |

## Resolved two-record count change

The apparent two-record drift is fully explained by two later, evidence-preserving changes. The historical checkpoint at the 5,990 baseline had **5,403 active approved** records and **4,990 API-playable** records. Four records were then restored after exact owner-original visual recovery, while six Use-of-English comprehension records were moved to review because their shared source passage was absent and could not be invented.

| Count basis | Historical checkpoint | Later safe changes | Current state |
| --- | ---: | ---: | ---: |
| Active approved authorised records | 5,403 | +4 restored originals −6 contextless English records | 5,401 |
| Learner-playable authorised API records | 4,990 | +4 restored originals −6 contextless English records | 4,988 |
| Combined learner-visible bank, including the static model bank | 5,990 | −2 net safe change | 5,988 |

The six held English records are `csv-aug16-use_of_english_0192`, `0193`, `0197`, `0198`, `0199`, and `0200`. They all depend on the same unavailable malpractice-comprehension passage. The historical snapshot is therefore reconciled; no unexplained learner-bank loss remains.

## Visual-recovery conclusion

The former claim that exactly **30 figure-dependent questions** remained is no longer reliable. The screenshot-source groups documented in the relinking list have their recovered originals attached, while the two initially missing Chemistry visuals and the two held Biology plant-transport records have since been restored from separate owner PDFs. Any further recovery must start from a current learner-feed exclusion, match an owner original exactly, and pass the same phone-readability and no-answer-leakage review.

## Exact eligibility audit and source-match review

The current TypeScript eligibility audit, run with the same `requiresDiagramAsset()` and `toPlayableAuthorisedQuestion()` helpers used by the learner API, found **5,401 active approved records**, of which **4,988 are learner-playable** and **413 remain held for one or more quality gates**. Exactly **29** of those 413 require a diagram asset and do not have one. This is the current figure-dependent hold count; it is not inferred from the broader approved-versus-playable gap.

| Review group | Records | Owner-source result | Safe outcome |
| --- | ---: | --- | --- |
| Supplied keyed Biology records labelled 2004 | 9 | The owner’s `JAMB Biology Past Questions 1983–2004` source was checked visually around its 2004 section. The question-and-figure pairings do not match the held reconstructed descriptions exactly. | Remain held. |
| Supplied keyed Chemistry / Kairo Chemistry records | 16 | The two owner Chemistry source PDFs were text-searched for distinctive held stems. No exact stem-and-figure match was established. | Remain held. |
| Kairo Biology record | 1 | No exact original visual source was established in the owner corpus reviewed so far. | Remain held. |
| Owner Physics attachment records | 3 | The records preserve source URLs and require figures, but no owner-original image/PDF page has yet been matched and reviewed. | Remain held. |

The source PDFs may still be useful for later recovery, but a shared year, topic, question number, or generic phrase is not enough evidence to crop and attach a figure. No additional record was released in this audit.
