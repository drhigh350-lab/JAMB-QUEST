import { useEffect } from "react";
import { QuizShell } from "@/components/QuizShell";
import { useQuizGame } from "@/game/useQuizGame";

export default function RealGameCbtFixture() {
  const game = useQuizGame();
  useEffect(() => {
    if (!game.loading && !game.loadError && game.screen === "home" && game.questions.length) game.startRound({ subject: "Full JAMB Mock", mode: "cbt", count: 4 });
  }, [game.loadError, game.loading, game.questions.length, game.screen, game.startRound]);
  if (game.loadError) return <main data-e2e="real-cbt-error">{game.loadError}</main>;
  if (game.screen !== "quiz" || !game.roundConfig || !game.currentQuestion) return <main data-e2e="real-cbt-loading">Loading real CBT session…</main>;
  return <QuizShell config={game.roundConfig} questions={game.roundQuestions} currentIndex={game.currentIndex} currentQuestion={game.currentQuestion} selectedIndex={game.selectedIndex} answered={game.answered} currentAnswer={game.currentAnswer} secondsLeft={game.secondsLeft} streak={game.streak} answers={game.answers} onSelect={game.selectAnswer} onSubmit={() => game.submitAnswer(false)} onNext={game.saveAndNextCbt} onQuit={game.quitRound} flaggedIds={game.flaggedIds} onNavigate={game.navigateCbt} onToggleFlag={game.toggleFlag} onFinishCbt={game.finishCbt} isPaused={game.isPaused} onTogglePause={game.togglePause} />;
}
