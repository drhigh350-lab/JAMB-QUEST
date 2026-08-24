/* Field Notes Arcade: React is the picture frame; quiz state and data stay in focused game modules. */

import { useCallback, useEffect, useRef, useState } from "react";
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
import type { BankQuestion, StoredProgress } from "./game/types";
import { urlBase64ToUint8Array } from "./lib/push";
import { clearOfflineStudyPack, downloadOfflineStudyPack, loadOfflineStudyPack, type OfflineStudyPackInfo } from "./lib/offlineStudyPack";
import { startLogin } from "./const";
import "./comeback.css";
import { QuestOpening } from "./components/QuestOpening";
import { markQuestOpeningComplete, shouldShowQuestOpening } from "./lib/openingSessionState";
import { isUnsavedQuestionFlow } from "./lib/appUpdateSafety";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function App() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();
  const dashboardQuery = trpc.learner.dashboard.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const questionReportsQuery = trpc.learner.myQuestionReports.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const ownerQuestionReportsQuery = trpc.qualityReview.questionReports.useQuery(undefined, { enabled: user?.role === "admin", retry: false });
  const sourceQuery = trpc.questionSources.list.useQuery();
  const authorisedQuestionsQuery = trpc.questions.authorisedPlayable.useQuery(undefined, { retry: false });
  const [pushStatus, setPushStatus] = useState<"idle" | "unsupported" | "denied" | "enabling" | "enabled" | "disabled" | "failed" | "test-sent" | "test-failed">("idle");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installStatus, setInstallStatus] = useState<"idle" | "installing" | "installed" | "dismissed">("idle");
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [offlineAuthorisedQuestions, setOfflineAuthorisedQuestions] = useState<BankQuestion[]>([]);
  const [offlineStudyPack, setOfflineStudyPack] = useState<OfflineStudyPackInfo | null>(null);
  const [offlinePackStatus, setOfflinePackStatus] = useState<"idle" | "downloading" | "ready" | "failed" | "clearing">("idle");
  const [offlinePackError, setOfflinePackError] = useState<string | null>(null);
  const updateReadyFixture = new URLSearchParams(window.location.search).get("updateReadyFixture") === "1";
  const [appUpdateReady, setAppUpdateReady] = useState(updateReadyFixture);
  const [appUpdateStatus, setAppUpdateStatus] = useState<"idle" | "updating" | "deferred">("idle");
  const serviceWorkerRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const [showOpening, setShowOpening] = useState(() => shouldShowQuestOpening(window.location.search));
  const [examReviewError, setExamReviewError] = useState<string | null>(null);
  const [homeTab, setHomeTab] = useState<"practice" | "study" | "progress" | "profile" | "about">(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    return requested === "study" || requested === "progress" || requested === "profile" || requested === "about" ? requested : "practice";
  });
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
  const reportQuestion = trpc.learner.reportQuestion.useMutation({ onSuccess: () => void utils.learner.myQuestionReports.invalidate() });
  const updateQuestionReportStatus = trpc.qualityReview.updateQuestionReportStatus.useMutation({ onSuccess: () => void utils.qualityReview.questionReports.invalidate() });
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
  const game = useQuizGame({ remoteProgress, onRoundComplete: handleRoundComplete, additionalQuestions: authorisedQuestionsQuery.data ?? offlineAuthorisedQuestions });
  const roundReview = trpc.learner.roundReview.useMutation({
    onSuccess: (attempt) => {
      if (!attempt) {
        setExamReviewError("That saved CBT attempt could not be found in your account.");
        return;
      }
      setHomeTab("progress");
      window.history.pushState({ jambQuestSavedCorrection: true }, "", window.location.href);
      const opened = game.openHistoricalReview({ ...attempt, subject: attempt.subject as import("./game/types").RoundSubject });
      setExamReviewError(opened ? null : "The questions for that older CBT are no longer available in the active bank, so its corrections cannot be recreated safely.");
    },
    onError: () => setExamReviewError("The saved CBT could not be opened. Please try again."),
  });
  const profileName = dashboardQuery.data?.profile.displayName ?? user?.name ?? "Learner";
  const setupBrowserPush = useCallback(async () => {
    if (!isAuthenticated || !("serviceWorker" in navigator) || !("Notification" in window)) {
      setPushStatus("unsupported");
      return;
    }
    if (!("PushManager" in window) || !pushKeyQuery.data) {
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
      if (!pushKeyQuery.data) throw new Error("No browser-push transport is configured.");
      const registration = await navigator.serviceWorker.register("/sw.js");
      const existingSubscription = await registration.pushManager.getSubscription();
      // A successful provider response does not prove the installed app still owns a live
      // endpoint. Explicitly renew on re-enable so the learner can recover from stale,
      // rotated, or browser-restored subscriptions without clearing site data manually.
      if (existingSubscription) await existingSubscription.unsubscribe();
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(pushKeyQuery.data) });
      const serialized = subscription.toJSON();
      if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys.auth) throw new Error("The browser did not provide a usable push subscription.");
      await enablePush.mutateAsync({ endpoint: serialized.endpoint, keys: { p256dh: serialized.keys.p256dh, auth: serialized.keys.auth } });
      await updateReminder.mutateAsync({ enabled: true });
      setPushStatus("enabled");
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
  const activeQuestionFlow = isUnsavedQuestionFlow(game.screen, Boolean(game.historicalReview));
  const activeCbt = activeQuestionFlow && game.isCbt;
  const applyAppUpdate = useCallback(() => {
    if (activeQuestionFlow) {
      if (activeCbt) game.persistActiveCbt();
      setAppUpdateStatus("deferred");
      return;
    }
    if (updateReadyFixture) {
      setAppUpdateStatus("updating");
      return;
    }
    const waitingWorker = serviceWorkerRegistrationRef.current?.waiting;
    if (!waitingWorker) return;
    setAppUpdateStatus("updating");
    const reloadWhenControlled = () => window.location.reload();
    navigator.serviceWorker.addEventListener("controllerchange", reloadWhenControlled, { once: true });
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }, [activeCbt, activeQuestionFlow, game, updateReadyFixture]);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const legacyUpgradeFixture = new URLSearchParams(window.location.search).get("swUpgradeFixture") === "legacy";
    void navigator.serviceWorker.register(legacyUpgradeFixture ? "/sw.js?upgradeFixture=legacy" : "/sw.js", { updateViaCache: "none" }).then((registration) => {
      serviceWorkerRegistrationRef.current = registration;
      if (registration.waiting && navigator.serviceWorker.controller) setAppUpdateReady(true);
      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) setAppUpdateReady(true);
        });
      });
      void registration.update().catch(() => undefined);
    }).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!activeQuestionFlow && appUpdateStatus === "deferred") setAppUpdateStatus("idle");
  }, [activeQuestionFlow, appUpdateStatus]);

  useEffect(() => {
    if (game.screen !== "quiz" || !game.isCbt || game.historicalReview) return;
    const protectExit = (event: BeforeUnloadEvent) => {
      game.persistActiveCbt();
      event.preventDefault();
      event.returnValue = "";
    };
    const protectBack = () => {
      game.persistActiveCbt();
      const leave = window.confirm("Leave this CBT? Your answers and timer have been saved. Choose Cancel to continue the exam.");
      if (leave) game.quitRound();
      else window.history.pushState({ jambQuestCbt: true }, "", window.location.href);
    };
    window.history.pushState({ jambQuestCbt: true }, "", window.location.href);
    window.addEventListener("beforeunload", protectExit);
    window.addEventListener("popstate", protectBack);
    return () => {
      window.removeEventListener("beforeunload", protectExit);
      window.removeEventListener("popstate", protectBack);
    };
  }, [game.historicalReview, game.isCbt, game.persistActiveCbt, game.quitRound, game.screen]);
  useEffect(() => {
    if (game.screen !== "quiz" || !game.historicalReview) return;
    const returnToProgress = () => {
      setHomeTab("progress");
      game.goHome();
    };
    window.addEventListener("popstate", returnToProgress);
    return () => window.removeEventListener("popstate", returnToProgress);
  }, [game.goHome, game.historicalReview, game.screen]);
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
  useEffect(() => {
    void loadOfflineStudyPack().then(({ info, questions }) => {
      setOfflineStudyPack(info);
      setOfflineAuthorisedQuestions(questions);
      if (info) setOfflinePackStatus("ready");
    });
  }, []);
  const saveOfflineStudyPack = useCallback(async () => {
    const questions = authorisedQuestionsQuery.data ?? [];
    setOfflinePackError(null);
    setOfflinePackStatus("downloading");
    try {
      const info = await downloadOfflineStudyPack(questions);
      setOfflineStudyPack(info);
      setOfflineAuthorisedQuestions(questions);
      setOfflinePackStatus("ready");
    } catch (error) {
      setOfflinePackStatus("failed");
      setOfflinePackError(error instanceof Error ? error.message : "The study pack could not be downloaded. Please try again while online.");
    }
  }, [authorisedQuestionsQuery.data]);
  const removeOfflineStudyPack = useCallback(async () => {
    setOfflinePackError(null);
    setOfflinePackStatus("clearing");
    try {
      await clearOfflineStudyPack();
      setOfflineStudyPack(null);
      setOfflineAuthorisedQuestions([]);
      setOfflinePackStatus("idle");
    } catch {
      setOfflinePackStatus("failed");
      setOfflinePackError("The downloaded study pack could not be removed from this device.");
    }
  }, []);
  return (
    <ErrorBoundary>
      {showOpening && <QuestOpening onComplete={() => { markQuestOpeningComplete(); setShowOpening(false); }} />}
      {game.screen === "home" && <Home initialTab={homeTab} onActiveTabChange={setHomeTab} loading={game.loading} loadError={game.loadError} progress={game.progress} canReview={game.canReview} onRetryLoad={game.reload} onStart={game.startRound} auth={{ loading: authLoading, isAuthenticated, profileName, targetScore: dashboardQuery.data?.profile.targetScore ?? 380, onLogout: logout, onSaveProfile: (displayName, targetScore) => updateProfile.mutate({ displayName, targetScore, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }), savingProfile: updateProfile.isPending }} questionCount={game.questions.length} questionCountReady={!game.loading && (!authorisedQuestionsQuery.isLoading || offlineAuthorisedQuestions.length > 0)} comeback={dashboardQuery.data?.comeback} reminder={dashboardQuery.data?.reminder} achievementStats={dashboardQuery.data?.achievementStats} examHistory={cbtHistoryQuery.data ?? dashboardQuery.data?.recentRounds ?? []} onOpenExamLog={(roundId) => { setHomeTab("progress"); setExamReviewError(null); roundReview.mutate({ roundId }); }} examReviewOpening={roundReview.isPending} examReviewError={examReviewError} weakTopics={dashboardQuery.data?.performance.weakTopics ?? []} topicConfidence={dashboardQuery.data?.performance.topicConfidence ?? []} subjectPerformance={dashboardQuery.data?.performance.subjectPerformance ?? []} fullMockSubjectPerformance={dashboardQuery.data?.performance.fullMockSubjectPerformance ?? []} coreSubjectFocus={dashboardQuery.data?.performance.coreSubjectFocus ?? null} bookmarks={dashboardQuery.data?.revision.bookmarks ?? []} comparison={dashboardQuery.data?.comparison} questionReports={questionReportsQuery.data ?? []} isOwner={user?.role === "admin"} ownerQuestionReports={ownerQuestionReportsQuery.data ?? []} onOwnerReportStatus={(reportId, status) => updateQuestionReportStatus.mutate({ reportId, status })} ownerReportUpdatingId={updateQuestionReportStatus.isPending ? updateQuestionReportStatus.variables?.reportId ?? null : null} activeQuestions={game.questions} availableTopics={game.questions.reduce<Array<{ subject: import("./game/types").Subject; topic: string }>>((topics, question) => topics.some((item) => item.subject === question.subject && item.topic === question.topic) ? topics : [...topics, { subject: question.subject, topic: question.topic}], [])} onUpdateDailyMinimum={(dailyMinimum) => updateSystem.mutate({ dailyMinimum })} onUpdateDailyGoal={(dailyGoalCount, dailyGoalSubject, dailyGoalTopic) => updateSystem.mutate({ dailyGoalCount, dailyGoalSubject, dailyGoalTopic })} onEnablePush={setupBrowserPush} onDisablePush={disableBrowserPush} onTestPush={sendTestPush} pushWorking={enablePush.isPending || disablePush.isPending || testPush.isPending || updateReminder.isPending || pushStatus === "enabling"} pushStatus={pushStatus} pwa={{ isOnline, canInstall: !!installPrompt, installStatus, onInstall: installPwa, update: { available: appUpdateReady, status: appUpdateStatus, onUpdate: applyAppUpdate }, offlinePack: { status: offlinePackStatus, questionCount: offlineStudyPack?.questionCount ?? 0, visualCount: offlineStudyPack?.visualCount ?? 0, savedAt: offlineStudyPack?.savedAt ?? null, isCurrent: Boolean(offlineStudyPack && authorisedQuestionsQuery.data && offlineStudyPack.questionCount === authorisedQuestionsQuery.data.length), canDownload: Boolean(authorisedQuestionsQuery.data?.length), error: offlinePackError, onDownload: () => void saveOfflineStudyPack(), onClear: () => void removeOfflineStudyPack() } }} resumableCbt={game.resumableCbt} onResumeCbt={game.resumeCbt} onDiscardResumableCbt={game.discardResumableCbt} />}
      {game.screen === "quiz" && game.currentQuestion && game.roundConfig && (
        <QuizShell config={game.roundConfig} questions={game.roundQuestions} currentIndex={game.currentIndex} currentQuestion={game.currentQuestion} selectedIndex={game.selectedIndex} answered={game.answered} currentAnswer={game.currentAnswer} secondsLeft={game.secondsLeft} streak={game.streak} answers={game.answers} onSelect={game.selectAnswer} onSubmit={() => game.submitAnswer(false)} onNext={game.isCbt ? game.saveAndNextCbt : game.nextQuestion} onQuit={game.historicalReview ? () => { setHomeTab("progress"); game.goHome(); } : game.quitRound} flaggedIds={game.flaggedIds} onNavigate={game.navigateQuestion} onToggleFlag={game.toggleFlag} onFinishCbt={game.finishCbt} isPaused={game.isPaused} onTogglePause={game.togglePause} historicalReview={Boolean(game.historicalReview)} historicalFilter={game.historicalFilter} onHistoricalFilter={game.filterHistoricalReview} bookmarkedQuestionIds={dashboardQuery.data?.revision.bookmarks.map((bookmark) => bookmark.questionId) ?? []} onToggleBookmark={() => isAuthenticated ? toggleBookmark.mutate({ questionId: game.currentQuestion!.id, subject: game.currentQuestion!.subject, topic: game.currentQuestion!.topic }) : startLogin()} onReportQuestion={isAuthenticated ? (input) => reportQuestion.mutateAsync(input) : undefined} />
      )}
      {game.screen === "exam-review" && game.roundConfig && <ExamReview config={game.roundConfig} questions={game.roundQuestions} answers={game.answers} flaggedIds={game.flaggedIds} onFinalize={game.submitCbtReview} onHome={game.goHome} historical={game.historicalReview} mistakeReasons={game.mistakeReasons} onMistakeReasonChange={game.setMistakeReason} />}
      {game.screen === "result" && game.roundConfig && (
        <ResultSummary config={game.roundConfig} questions={game.roundQuestions} answers={game.answers} score={game.score} correctCount={game.correctCount} bestScore={game.progress.bestScore} onRetry={game.retryRound} onReview={() => game.startRound({ ...game.roundConfig!, mode: "review" })} onHome={game.goHome} />
      )}
    </ErrorBoundary>
  );
}

export default App;
