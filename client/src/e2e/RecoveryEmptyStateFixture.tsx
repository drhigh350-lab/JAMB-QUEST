import { useEffect, useRef } from "react";
import Home from "@/pages/Home";
import { useQuizGame } from "@/game/useQuizGame";

export default function RecoveryEmptyStateFixture() {
  const game = useQuizGame();
  const started = useRef(false);
  const recoveryOrigin = new URLSearchParams(window.location.search).get("recoveryOrigin") === "missed-questions" ? "missed-questions" : "saved-question";

  useEffect(() => {
    if (started.current || game.loading || game.loadError || !game.questions.length) return;
    started.current = true;
    game.startRound({ subject: "Biology", mode: "review", count: 1, questionIds: ["NO-LONGER-PLAYABLE"], recoveryOrigin });
  }, [game.loadError, game.loading, game.questions.length, game.startRound, recoveryOrigin]);

  return <Home
    loading={game.loading}
    loadError={game.loadError}
    progress={game.progress}
    canReview={false}
    onRetryLoad={game.reload}
    onStart={game.startRound}
    questionCount={game.questions.length}
    questionCountReady={!game.loading}
    auth={{ loading: false, isAuthenticated: false, profileName: "Fixture Learner", targetScore: 380, onLogout: () => undefined, onSaveProfile: () => undefined, savingProfile: false }}
    questionSources={[]}
    examHistory={[]}
    weakTopics={[]}
    onUpdateDailyMinimum={() => undefined}
    onEnablePush={() => undefined}
    onDisablePush={() => undefined}
    pushWorking={false}
    pushStatus="idle"
    pwa={{ isOnline: true, canInstall: false, installStatus: "idle", onInstall: () => undefined }}
  />;
}
