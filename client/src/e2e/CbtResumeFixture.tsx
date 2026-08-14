import { useEffect } from "react";
import { QuizShell } from "@/components/QuizShell";
import { useQuizGame } from "@/game/useQuizGame";

export default function CbtResumeFixture() {
  const game = useQuizGame();
  const studyOnly = new URLSearchParams(window.location.search).get("study") === "1";
  useEffect(() => {
    if (!game.loading && !game.loadError && game.screen === "home" && game.questions.length && !game.resumableCbt) game.startRound(studyOnly ? { subject: "Biology", mode: "sprint", count: 1, timing: "study" } : { subject: "Full JAMB Mock", mode: "cbt", count: 4 });
  }, [game.loadError, game.loading, game.questions.length, game.resumableCbt, game.screen, game.startRound, studyOnly]);
  if (game.loadError) return <main data-e2e="resume-cbt-error">{game.loadError}</main>;
  if (game.loading) return <main data-e2e="resume-cbt-loading">Loading resume fixture…</main>;
  if (game.screen === "home" && game.resumableCbt) return <main data-e2e="resume-cbt-ready"><p>Interrupted CBT is ready.</p><button onClick={game.resumeCbt}>Resume exact CBT</button><button onClick={game.discardResumableCbt}>Discard CBT</button></main>;
  if (game.screen !== "quiz" || !game.roundConfig || !game.currentQuestion) return <main data-e2e="resume-cbt-loading">Preparing real CBT session…</main>;
  return <main data-e2e="resume-cbt-session" data-index={game.currentIndex} data-answers={JSON.stringify(game.answers)} data-flags={JSON.stringify(game.flaggedIds)} data-seconds={game.secondsLeft}><QuizShell config={game.roundConfig} questions={game.roundQuestions} currentIndex={game.currentIndex} currentQuestion={game.currentQuestion} selectedIndex={game.selectedIndex} answered={game.answered} currentAnswer={game.currentAnswer} secondsLeft={game.secondsLeft} streak={game.streak} answers={game.answers} onSelect={game.selectAnswer} onSubmit={() => game.submitAnswer(false)} onNext={game.saveAndNextCbt} onQuit={game.quitRound} flaggedIds={game.flaggedIds} onNavigate={game.navigateCbt} onToggleFlag={game.toggleFlag} onFinishCbt={game.finishCbt} isPaused={game.isPaused} onTogglePause={game.togglePause} /></main>;
}
