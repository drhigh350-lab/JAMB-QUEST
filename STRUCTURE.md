# JAMB Quest Structure

## Frontend composition

`client/src/App.tsx` owns the top-level app shell and route-free game screen switching. `client/src/pages/Home.tsx` is the setup and home experience. `client/src/components/QuizShell.tsx` owns the active-round and results composition. `client/src/components/QuestionCard.tsx` renders one question and its four answer options. `client/src/components/QuestionLedger.tsx` renders the numbered round map. `client/src/components/ResultSummary.tsx` renders score and review actions.

## Game modules

`client/src/game/types.ts` defines the question, subject, mode, and round types. `client/src/game/questionBank.ts` loads and validates the remote JSON bank. `client/src/game/roundEngine.ts` contains framework-agnostic round selection, scoring, timer, streak, and wrong-answer logic. `client/src/game/storage.ts` owns local progress persistence. `client/src/game/useQuizGame.ts` is the React adapter that subscribes UI state to the round engine without moving quiz rules into presentational components.

## Data flow

1. The app loads the question bank storage URL and validates it.
2. Home setup selects subject, mode, and question count.
3. The round engine shuffles a filtered set and starts in `active` mode.
4. The question card emits selected option and submit actions.
5. The engine records correctness, elapsed time, streak, and wrong answers.
6. The result screen writes a compact summary to local storage and exposes retry/review actions.
