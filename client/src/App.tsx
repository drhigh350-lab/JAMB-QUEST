/* Field Notes Arcade: React is the picture frame; quiz state and data stay in focused game modules. */

import ErrorBoundary from "./components/ErrorBoundary";
import "./field-notes-overrides.css";
import Home from "./pages/Home";
import { useQuizGame } from "./game/useQuizGame";
import { QuizShell } from "./components/QuizShell";
import { ResultSummary } from "./components/ResultSummary";

function App() {
  const game = useQuizGame();
  return (
    <ErrorBoundary>
      {game.screen === "home" && <Home loading={game.loading} loadError={game.loadError} progress={game.progress} canReview={game.canReview} onRetryLoad={game.reload} onStart={game.startRound} />}
      {game.screen === "quiz" && game.currentQuestion && game.roundConfig && (
        <QuizShell config={game.roundConfig} questions={game.roundQuestions} currentIndex={game.currentIndex} currentQuestion={game.currentQuestion} selectedIndex={game.selectedIndex} answered={game.answered} currentAnswer={game.currentAnswer} secondsLeft={game.secondsLeft} streak={game.streak} answers={game.answers} onSelect={game.selectAnswer} onSubmit={() => game.submitAnswer(false)} onNext={game.nextQuestion} onQuit={game.quitRound} />
      )}
      {game.screen === "result" && game.roundConfig && (
        <ResultSummary config={game.roundConfig} questions={game.roundQuestions} answers={game.answers} score={game.score} correctCount={game.correctCount} bestScore={game.progress.bestScore} onRetry={game.retryRound} onReview={() => game.startRound({ ...game.roundConfig!, mode: "review" })} onHome={game.goHome} />
      )}
    </ErrorBoundary>
  );
}

export default App;
