# JAMB Quest Question Count Reconciliation — 16 August 2026

The screenshot is not showing a broken About-page calculation. It is showing the current **runtime-playable** total used by the app.

| Count layer | Records | Meaning |
| --- | ---: | --- |
| Active approved authorised rows stored in the database | 4,304 | Rows whose source is active and whose explanation status is approved before the runtime mapper runs. |
| Authorised rows rejected by runtime structural gates | 352 | Approved rows containing embedded answer/explanation metadata in an option; these are not playable. Three additional raw over-five-line rows overlap this blocker set. |
| Authorised rows returned by `getPlayableAuthorisedQuestions()` | 3,952 | Active, approved rows that pass the server mapper; this is the count actually returned to the browser. |
| Local model practice asset | 1,000 | Original model questions loaded from the versioned JAMB-aligned practice asset. |
| **Current learner-facing total** | **4,952** | **3,952 runtime-playable authorised + 1,000 model questions.** |

The previously reported **5,304** figure incorrectly added all 4,304 approved database rows to the 1,000 model questions without subtracting the 352 rows that the runtime mapper excludes. The About page and Practice header are using `game.questions.length`, which is the safer learner-facing count. No question was deleted by this correction; the 352 rows remain outside gameplay until their embedded option metadata is safely repaired.
