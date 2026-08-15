# JAMB Quest Question Count Reconciliation — 15 August 2026

The former **3,118** figure was a historical released-bank count from before the runtime syllabus and explanation gates were applied to every learner-facing authorised row. It should not be treated as the current playable total after the Quality Before Quantity release rule.

The current live count path separates stored rows from learner-playable rows:

| Count layer | Records | Meaning |
| --- | ---: | --- |
| Model practice bank | 1,000 | Original model questions retained as the baseline bank |
| Authorised rows stored across active sources | 2,769 | Includes approved, pending, and held material |
| Authorised rows with approved source status | 2,360 | Approved at source level, before the stricter runtime mapper |
| Authorised rows passing runtime quality gates | 1,375 | Syllabus-mapped, structurally valid, and explanation-compliant rows |
| Current learner-facing total | 2,375 | 1,000 model + 1,375 quality-gated authorised rows |

The difference from 3,118 is therefore an intentional quality hold, not deletion. The runtime mapper currently holds approved-source rows whose topic is not mapped to the official syllabus or whose explanation exceeds five non-empty lines. The recently imported Chemistry batches remain stored but are pending their final approval pass; they are not counted until that pass completes.

The previously observed **2,275** display was a stale or earlier UI count. The current development and published checkpoint render **2,375 practice questions**, and the mobile Practice screen visibly includes the **LEK** palette with 13 chapters. A hard refresh or PWA update may be needed on a device that cached the earlier asset.
