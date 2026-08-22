# Quest Rush — Game Mode Receipt

## Purpose

**Quest Rush** is a short, game-first study mode for moments when a learner wants a change from normal Practice or long CBT sessions. It uses only the active approved JAMB Quest learner bank and remains separate from normal Practice, CBT saving, and CBT history.

| Element | Implemented behavior |
|---|---|
| Subject choice | The learner chooses Use of English, Biology, Chemistry, or Physics before each burst. |
| Short round | A burst draws up to 12 active-bank questions in one subject with a 75-second round timer. |
| Score feedback | Correct answers earn base, streak, and remaining-time points; wrong answers reset the streak. |
| Learning protection | The mode presents the correct answer and compact explanation immediately after a response. |
| Correction | The results screen exposes every missed question and can open the exact missed set in the existing correction flow. |
| Safety | The learner can pause or exit; Quest Rush does not overwrite a saved CBT or add a false CBT record. |

## Verification

The launch screen and live timed-question screen were visually checked at mobile size. The full project regression suite passed with **98 test files / 239 tests**, and TypeScript and the production build passed. The game mode is accessible from **Practice → Quest Rush**, alongside—not in place of—Single Subject and Standard CBT.
