/* Field Notes Arcade: React is the picture frame; quiz state and data stay in focused game modules. */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import ErrorBoundary from "./components/ErrorBoundary";
import "./field-notes-overrides.css";
import "./profile.css";
import Home from "./pages/Home";
import { useQuizGame } from "./game/useQuizGame";
import { QuizShell } from "./components/QuizShell";
import { ResultSummary } from "./components/ResultSummary";
import { ExamReview } from "./components/ExamReview";
import type { StoredProgress } from "./game/types";
import { urlBase64ToUint8Array } from "./lib/push";
import { startLogin } from "./const";
import "./comeback.css";
import { QuestOpening } from "./components/QuestOpening";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function App() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();
  const dashboardQuery = trpc.learner.dashboard.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const sourceQuery = trpc.questionSources.list.useQuery();
  const authorisedQuestionsQuery = trpc.questions.authorisedPlayable.useQuery(undefined, { retry: false });
  const [pushStatus, setPushStatus] = useState<"idle" | "unsupported" | "denied" | "enabling" | "enabled" | "disabled" | "failed" | "test-sent" | "test-failed">("idle");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installStatus, setInstallStatus] = useState<"idle" | "installing" | "installed" | "dismissed">("idle");
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [showOpening, setShowOpening] = useState(() => new URLSearchParams(window.location.search).get("skipOpening") !== "1");
  const [examReviewError, setExamReviewError] = useState<string | null>(null);
  const cbtHistoryQuery = trpc.learner.cbtHistory.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const pushKeyQuery = trpc.push.publicKey.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const updateProfile = trpc.learner.updateProfile.useMutation({
    onSuccess: (dashboard) => utils.learner.dashboard.setData(undefined, dashboard),
  });
  const recordRound = trpc.learner.recordRound.useMutation({
    onSuccess: (dashboard) => utils.learner.dashboard.setData(undefined, dashboard),
  });
  const updateSystem = trpc.learner.updateSystem.useMutation({ onSuccess: (dashboard) => utils.learner.dashboard.setData(undefined, dashboard) });
  const updateReminder = trpc.learner.updateReminder.useMutation({ onSuccess: (dashboard) => utils.learner.dashboard.setData(undefined, dashboard) });
  const enablePush = trpc.learner.enablePush.useMutation({ onSuccess: (dashboard) => utils.learner.dashboard.setData(undefined, dashboard) });
  const disablePush = trpc.learner.disablePush.useMutation({ onSuccess: (dashboard) => utils.learner.dashboard.setData(undefined, dashboard) });
  const testPush = trpc.learner.sendTestPush.useMutation();
  const toggleBookmark = trpc.learner.toggleBookmark.useMutation({ onSuccess: (dashboard) => utils.learner.dashboard.setData(undefined, dashboard) });
  const remoteProgress: StoredProgress | undefined = dashboardQuery.data ? {
    totalAnswered: dashboardQuery.data.progress.totalAnswered,
    totalCorrect: dashboardQuery.data.progress.totalCorrect,
    bestScore: dashboardQuery.data.progress.bestScore,
    lastScore: dashboardQuery.data.progress.lastScore,
    roundsPlayed: dashboardQuery.data.progress.roundsPlayed,
    wrongIds: dashboardQuery.data.progress.wrongIds,
    subjectBest: dashboardQuery.data.progress.subjectBest,
  } : undefined;
  const handleRoundComplete = useCallback((payload: Parameters<typeof recordRound.mutate>[0]) => {
    if (isAuthenticated) recordRound.mutate(payload);
  }, [isAuthenticated, recordRound]);
  const game = useQuizGame({ remoteProgress, onRoundComplete: handleRoundComplete, additionalQuestions: authorisedQuestionsQuery.data ?? [] });
  const roundReview = trpc.learner.roundReview.useMutation({
    onSuccess: (attempt) => {
      if (!attempt) {
        setExamReviewError("That saved CBT attempt could not be found in your account.");
        return;
      }
      const opened = game.openHistoricalReview({ ...attempt, subject: attempt.subject as import("./game/types").RoundSubject });
      setExamReviewError(opened ? null : "The questions for that older CBT are no longer available in the active bank, so its corrections cannot be recreated safely.");
    },
    onError: () => setExamReviewError("The saved CBT could not be opened. Please try again."),
  });
  const profileName = dashboardQuery.data?.profile.displayName ?? user?.name ?? "Learner";
  const setupBrowserPush = useCallback(async () => {
    if (!isAuthenticated || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setPushStatus("unsupported");
      return;
    }
    if (!pushKeyQuery.data) {
      setPushStatus("failed");
      return;
    }
    try {
      setPushStatus("enabling");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushStatus("denied");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      const existingSubscription = await registration.pushManager.getSubscription();
      // A successful provider response does not prove the installed app still owns a live
      // endpoint. Explicitly renew on re-enable so the learner can recover from stale,
      // rotated, or browser-restored subscriptions without clearing site data manually.
      if (existingSubscription) await existingSubscription.unsubscribe();
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(pushKeyQuery.data) });
      const serialized = subscription.toJSON();
      if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys.auth) throw new Error("The browser did not provide a usable push subscription.");
      enablePush.mutate({ endpoint: serialized.endpoint, keys: { p256dh: serialized.keys.p256dh, auth: serialized.keys.auth } }, {
        onSuccess: () => { updateReminder.mutate({ enabled: true }); setPushStatus("enabled"); },
        onError: () => setPushStatus("failed"),
      });
    } catch {
      setPushStatus("failed");
    }
  }, [enablePush, isAuthenticated, pushKeyQuery.data, updateReminder]);
  const disableBrowserPush = useCallback(() => {
    disablePush.mutate(undefined, {
      onSuccess: () => { updateReminder.mutate({ enabled: false }); setPushStatus("disabled"); },
      onError: () => setPushStatus("failed"),
    });
  }, [disablePush, updateReminder]);
  const sendTestPush = useCallback(() => {
    testPush.mutate(undefined, {
      onSuccess: (result) => {
        void utils.learner.dashboard.invalidate();
        setPushStatus(result.delivered ? "test-sent" : "test-failed");
      },
      onError: () => setPushStatus("test-failed"),
    });
  }, [testPush, utils]);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const legacyUpgradeFixture = new URLSearchParams(window.location.search).get("swUpgradeFixture") === "legacy";
    const workerPath = legacyUpgradeFixture ? "/sw.js?upgradeFixture=legacy" : "/sw.js";
    let reloading = false;
    const refreshForNewWorker = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", refreshForNewWorker);
    void navigator.serviceWorker.register(workerPath).then((registration) => {
      const activateWaitingWorker = () => registration.waiting?.postMessage({ type: "SKIP_WAITING" });
      activateWaitingWorker();
      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) installing.postMessage({ type: "SKIP_WAITING" });
        });
      });
      void registration.update().catch(() => undefined);
    }).catch(() => undefined);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", refreshForNewWorker);
  }, []);
  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setInstallStatus("installed");
    };
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  const installPwa = useCallback(async () => {
    if (!installPrompt) return;
    setInstallStatus("installing");
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    setInstallStatus(choice.outcome === "accepted" ? "installed" : "dismissed");
  }, [installPrompt]);
  return (
    <ErrorBoundary>
      {showOpening && <QuestOpening onComplete={() => setShowOpening(false)} />}
      {game.screen === "home" && <Home loading={game.loading} loadError={game.loadError} progress={game.progress} canReview={game.canReview} onRetryLoad={game.reload} onStart={game.startRound} auth={{ loading: authLoading, isAuthenticated, profileName, targetScore: dashboardQuery.data?.profile.targetScore ?? 380, onLogout: logout, onSaveProfile: (displayName, targetScore) => updateProfile.mutate({ displayName, targetScore, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }), savingProfile: updateProfile.isPending }} questionCount={game.questions.length} questionCountReady={!game.loading && !authorisedQuestionsQuery.isLoading} comeback={dashboardQuery.data?.comeback} reminder={dashboardQuery.data?.reminder} achievementStats={dashboardQuery.data?.achievementStats} examHistory={cbtHistoryQuery.data ?? dashboardQuery.data?.recentRounds ?? []} onOpenExamLog={(roundId) => { setExamReviewError(null); roundReview.mutate({ roundId }); }} examReviewOpening={roundReview.isPending} examReviewError={examReviewError} weakTopics={dashboardQuery.data?.performance.weakTopics ?? []} subjectPerformance={dashboardQuery.data?.performance.subjectPerformance ?? []} fullMockSubjectPerformance={dashboardQuery.data?.performance.fullMockSubjectPerformance ?? []} bookmarks={dashboardQuery.data?.revision.bookmarks ?? []} comparison={dashboardQuery.data?.comparison} availableTopics={game.questions.reduce<Array<{ subject: import("./game/types").Subject; topic: string }>>((topics, question) => topics.some((item) => item.subject === question.subject && item.topic === question.topic) ? topics : [...topics, { subject: question.subject, topic: question.topic}], [])} onUpdateDailyMinimum={(dailyMinimum) => updateSystem.mutate({ dailyMinimum })} onUpdateDailyGoal={(dailyGoalCount, dailyGoalSubject, dailyGoalTopic) => updateSystem.mutate({ dailyGoalCount, dailyGoalSubject, dailyGoalTopic })} onEnablePush={setupBrowserPush} onDisablePush={disableBrowserPush} onTestPush={sendTestPush} pushWorking={enablePush.isPending || disablePush.isPending || testPush.isPending || updateReminder.isPending || pushStatus === "enabling"} pushStatus={pushStatus} pwa={{ isOnline, canInstall: !!installPrompt, installStatus, onInstall: installPwa }} resumableCbt={game.resumableCbt} onResumeCbt={game.resumeCbt} onDiscardResumableCbt={game.discardResumableCbt} />}
      {game.screen === "quiz" && game.currentQuestion && game.roundConfig && (
        <QuizShell config={game.roundConfig} questions={game.roundQuestions} currentIndex={game.currentIndex} currentQuestion={game.currentQuestion} selectedIndex={game.selectedIndex} answered={game.answered} currentAnswer={game.currentAnswer} secondsLeft={game.secondsLeft} streak={game.streak} answers={game.answers} onSelect={game.selectAnswer} onSubmit={() => game.submitAnswer(false)} onNext={game.isCbt ? game.saveAndNextCbt : game.nextQuestion} onQuit={game.quitRound} flaggedIds={game.flaggedIds} onNavigate={game.navigateQuestion} onToggleFlag={game.toggleFlag} onFinishCbt={game.finishCbt} isPaused={game.isPaused} onTogglePause={game.togglePause} historicalReview={Boolean(game.historicalReview)} historicalFilter={game.historicalFilter} onHistoricalFilter={game.filterHistoricalReview} bookmarkedQuestionIds={dashboardQuery.data?.revision.bookmarks.map((bookmark) => bookmark.questionId) ?? []} onToggleBookmark={() => isAuthenticated ? toggleBookmark.mutate({ questionId: game.currentQuestion!.id, subject: game.currentQuestion!.subject, topic: game.currentQuestion!.topic }) : startLogin()} />
      )}
      {game.screen === "exam-review" && game.roundConfig && <ExamReview config={game.roundConfig} questions={game.roundQuestions} answers={game.answers} flaggedIds={game.flaggedIds} onFinalize={game.submitCbtReview} onHome={game.goHome} historical={game.historicalReview} />}
      {game.screen === "result" && game.roundConfig && (
        <ResultSummary config={game.roundConfig} questions={game.roundQuestions} answers={game.answers} score={game.score} correctCount={game.correctCount} bestScore={game.progress.bestScore} onRetry={game.retryRound} onReview={() => game.startRound({ ...game.roundConfig!, mode: "review" })} onHome={game.goHome} />
      )}
    </ErrorBoundary>
  );
}

export default App;
