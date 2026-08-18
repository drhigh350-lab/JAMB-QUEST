/* Field Notes Arcade: explicit round modes keep timer, answer, feedback, and result transitions deterministic. */

import { useCallback, useEffect, useMemo, useState } from "react";
import { isRoundTimed } from "./dailyMission";
import { loadQuestionBank, normaliseQuestionTopic, selectQuestions } from "./questionBank";
import { clearActiveCbtSession, getActiveCbtSession, getProgress, recordRound, saveActiveCbtSession, saveProgress } from "./storage";
import { STANDARD_FULL_CBT_SECONDS, type ActiveCbtSession, type AnswerRecord, type BankQuestion, type ExamReviewRecord, type GameScreen, type QuizMode, type RoundConfig, type RoundSubject, type StoredProgress } from "./types";

const DEFAULT_SECONDS = 35;
const CBT_MINIMUM_SECONDS = 20 * 60;

export function resolveCbtDurationSeconds(config: RoundConfig) {
  if (config.mode !== "cbt") return DEFAULT_SECONDS;
  if (config.durationSeconds) return config.durationSeconds;
  if (config.subject === "Full JAMB Mock" && config.count === 180) return STANDARD_FULL_CBT_SECONDS;
  return Math.max(CBT_MINIMUM_SECONDS, config.count * 75);
}

export type RoundCompletionPayload = {
  subject: RoundSubject;
  mode: QuizMode;
  questionCount: number;
  correctCount: number;
  score: number;
  wrongIds: string[];
  durationSeconds: number;
  flaggedIds: string[];
  answerReview: ExamReviewRecord[];
};

type QuizGameOptions = {
  remoteProgress?: StoredProgress;
  onRoundComplete?: (payload: RoundCompletionPayload) => void;
  additionalQuestions?: BankQuestion[];
};

export function useQuizGame({ remoteProgress, onRoundComplete, additionalQuestions = [] }: QuizGameOptions = {}) {
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [progress, setProgress] = useState<StoredProgress>(() => getProgress());
  const [screen, setScreen] = useState<GameScreen>("home");
  const [roundConfig, setRoundConfig] = useState<RoundConfig | null>(null);
  const [roundQuestions, setRoundQuestions] = useState<BankQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});
  const [answered, setAnswered] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_SECONDS);
  const [initialSeconds, setInitialSeconds] = useState(DEFAULT_SECONDS);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isHistoricalReview, setIsHistoricalReview] = useState(false);
  const [historicalReview, setHistoricalReview] = useState<{ completedAt: Date; durationSeconds: number } | null>(null);
  const [historicalFilter, setHistoricalFilter] = useState<"all" | "correct" | "wrong">("all");
  const [historicalSnapshot, setHistoricalSnapshot] = useState<{ questions: BankQuestion[]; answers: Record<string, AnswerRecord>; flaggedIds: string[] } | null>(null);
  const [resumableCbt, setResumableCbt] = useState<ActiveCbtSession | null>(() => getActiveCbtSession());

  const reload = useCallback(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);
    loadQuestionBank(controller.signal)
      .then(setQuestions)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(error instanceof Error ? error.message : "The question bank could not be loaded.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  useEffect(() => reload(), [reload]);

  const playableQuestions = useMemo(() => {
    const seen = new Set<string>();
    return [...questions, ...additionalQuestions].map(normaliseQuestionTopic).filter((question) => {
      if (seen.has(question.id)) return false;
      seen.add(question.id);
      return true;
    });
  }, [additionalQuestions, questions]);

  const remoteProgressKey = useMemo(() => (remoteProgress ? JSON.stringify(remoteProgress) : null), [remoteProgress]);
  useEffect(() => {
    if (remoteProgress) setProgress(remoteProgress);
  }, [remoteProgressKey]);

  const currentQuestion = roundQuestions[currentIndex] ?? null;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const correctCount = Object.values(answers).filter((answer) => answer.correct).length;
  const wrongQuestions = useMemo(
    () => roundQuestions.filter((question) => answers[question.id] && !answers[question.id].correct),
    [answers, roundQuestions],
  );
  const isCbt = roundConfig?.mode === "cbt";
  const isTimedRound = isRoundTimed(roundConfig);

  const persistActiveCbt = useCallback((patch: Partial<Pick<ActiveCbtSession, "answers" | "flaggedIds" | "currentIndex" | "secondsLeft" | "initialSeconds" | "isPaused">> = {}) => {
    if (screen !== "quiz" || !isCbt || !roundConfig || !roundQuestions.length) return;
    const nextPaused = patch.isPaused ?? isPaused;
    const nextSeconds = patch.secondsLeft ?? secondsLeft;
    saveActiveCbtSession({
      config: roundConfig,
      questionIds: roundQuestions.map((question) => question.id),
      answers: patch.answers ?? answers,
      flaggedIds: patch.flaggedIds ?? flaggedIds,
      currentIndex: patch.currentIndex ?? currentIndex,
      secondsLeft: nextSeconds,
      initialSeconds: patch.initialSeconds ?? initialSeconds,
      isPaused: nextPaused,
      deadlineAt: nextPaused ? null : Date.now() + nextSeconds * 1000,
    });
  }, [answers, currentIndex, flaggedIds, initialSeconds, isCbt, isPaused, roundConfig, roundQuestions, screen, secondsLeft]);

  useEffect(() => {
    persistActiveCbt();
  }, [persistActiveCbt]);

  const buildReview = useCallback((finalAnswers: Record<string, AnswerRecord>): ExamReviewRecord[] => roundQuestions.map((question) => ({
    questionId: question.id,
    subject: question.subject,
    topic: question.topic,
    selectedIndex: finalAnswers[question.id]?.selectedIndex ?? null,
    correct: Boolean(finalAnswers[question.id]?.correct),
    timedOut: Boolean(finalAnswers[question.id]?.timedOut),
    flagged: flaggedIds.includes(question.id),
  })), [flaggedIds, roundQuestions]);

  const finishCbt = useCallback(() => {
    if (!roundConfig || roundConfig.mode !== "cbt" || screen !== "quiz") return;
    const finalAnswers = Object.fromEntries(roundQuestions.map((question) => {
      const selected = answers[question.id]?.selectedIndex ?? null;
      return [question.id, { selectedIndex: selected, correct: selected === question.answer_index, timedOut: selected === null } satisfies AnswerRecord];
    }));
    const finalCorrect = Object.values(finalAnswers).filter((answer) => answer.correct).length;
    setAnswers(finalAnswers);
    setScore(finalCorrect * 100 + Math.floor(secondsLeft / 15));
    setScreen("exam-review");
  }, [answers, roundConfig, roundQuestions, screen, secondsLeft]);

  useEffect(() => {
    if (screen !== "quiz" || !isTimedRound || isPaused || (!isCbt && answered)) return;
    const interval = window.setInterval(() => setSecondsLeft((current) => Math.max(current - 1, 0)), 1000);
    return () => window.clearInterval(interval);
  }, [answered, isCbt, isPaused, isTimedRound, screen]);

  useEffect(() => {
    if (screen !== "quiz" || secondsLeft !== 0) return;
    if (isCbt) finishCbt();
    else if (!answered) submitAnswer(true);
  }, [answered, finishCbt, isCbt, screen, secondsLeft]);

  const startRound = useCallback(
    (config: RoundConfig) => {
      if (!playableQuestions.length) return;
      const picked = selectQuestions(playableQuestions, config.subject, config.mode, config.count, progress.wrongIds, { topic: config.topic, topics: config.topics, questionIds: config.questionIds, includeLekki: config.includeLekki });
      if (!picked.length) {
        setLoadError(config.questionIds?.length ? config.recoveryOrigin === "missed-questions" ? "None of the missed questions from that attempt are currently available in the active question bank." : "That saved question is no longer available in the active question bank." : config.topic ? `No playable questions are currently available for ${config.topic}.` : config.topics?.length ? "No playable questions are currently available in that study area." : "No playable questions are available for this round.");
        return;
      }
      const startingSeconds = resolveCbtDurationSeconds(config);
      if (config.mode === "cbt") {
        saveActiveCbtSession({ config, questionIds: picked.map((question) => question.id), answers: {}, flaggedIds: [], currentIndex: 0, secondsLeft: startingSeconds, initialSeconds: startingSeconds, isPaused: false, deadlineAt: Date.now() + startingSeconds * 1000 });
        setResumableCbt(null);
      }
      setRoundConfig(config);
      setIsHistoricalReview(false);
      setHistoricalReview(null);
      setHistoricalSnapshot(null);
      setHistoricalFilter("all");
      setRoundQuestions(picked);
      setCurrentIndex(0);
      setSelectedIndex(null);
      setAnswers({});
      setAnswered(false);
      setSecondsLeft(startingSeconds);
      setInitialSeconds(startingSeconds);
      setStartedAt(Date.now());
      setScore(0);
      setStreak(0);
      setFlaggedIds([]);
      setIsPaused(false);
      setScreen("quiz");
    },
    [playableQuestions, progress.wrongIds],
  );

  const selectAnswer = useCallback((index: number) => {
    if (!currentQuestion || answered) return;
    setSelectedIndex(index);
    if (roundConfig?.mode === "cbt") {
      setAnswers((current) => {
        const next = { ...current, [currentQuestion.id]: { selectedIndex: index, correct: index === currentQuestion.answer_index, timedOut: false } };
        persistActiveCbt({ answers: next });
        return next;
      });
    }
  }, [answered, currentQuestion, roundConfig?.mode]);

  const submitAnswer = useCallback(
    (timedOut = false) => {
      if (!currentQuestion || answered || roundConfig?.mode === "cbt") return;
      const isCorrect = !timedOut && selectedIndex === currentQuestion.answer_index;
      const nextAnswer: AnswerRecord = { selectedIndex: timedOut ? null : selectedIndex, correct: isCorrect, timedOut };
      setAnswers((current) => ({ ...current, [currentQuestion.id]: nextAnswer }));
      setAnswered(true);
      setStreak((current) => (isCorrect ? current + 1 : 0));
      setScore((current) => current + (isCorrect ? 100 + secondsLeft * 2 : 0));
    },
    [answered, currentQuestion, roundConfig?.mode, secondsLeft, selectedIndex],
  );

  const recordFinalRound = useCallback((finalAnswers: Record<string, AnswerRecord>, finalScore: number) => {
    if (!roundConfig) return;
    const nextProgress = recordRound(progress, roundConfig, roundQuestions, finalAnswers, finalScore);
    const completedWrongIds = roundQuestions.filter((question) => !finalAnswers[question.id]?.correct).map((question) => question.id);
    const durationSeconds = roundConfig.mode === "cbt" ? Math.max(0, initialSeconds - secondsLeft) : Math.max(0, Math.round((Date.now() - (startedAt ?? Date.now())) / 1000));
    const answerReview = buildReview(finalAnswers);
    setProgress(nextProgress);
    if (!remoteProgress) saveProgress(nextProgress);
    onRoundComplete?.({ subject: roundConfig.subject, mode: roundConfig.mode, questionCount: roundQuestions.length, correctCount: Object.values(finalAnswers).filter((answer) => answer.correct).length, score: finalScore, wrongIds: completedWrongIds, durationSeconds, flaggedIds, answerReview });
    if (roundConfig.mode === "cbt") {
      clearActiveCbtSession();
      setResumableCbt(null);
    }
    setScreen("result");
  }, [buildReview, flaggedIds, initialSeconds, onRoundComplete, progress, remoteProgress, roundConfig, roundQuestions, secondsLeft, startedAt]);

  const nextQuestion = useCallback(() => {
    if (!answered || !roundConfig) return;
    if (currentIndex >= roundQuestions.length - 1) {
      if (isHistoricalReview) {
        setScreen("home");
        return;
      }
      recordFinalRound(answers, score);
      return;
    }
    setCurrentIndex((current) => current + 1);
    setSelectedIndex(null);
    setAnswered(false);
    setSecondsLeft(DEFAULT_SECONDS);
  }, [answers, answered, currentIndex, isHistoricalReview, recordFinalRound, roundConfig, roundQuestions.length, score]);

  const navigateQuestion = useCallback((index: number) => {
    if (index < 0 || index >= roundQuestions.length) return;
    const storedAnswer = answers[roundQuestions[index].id];
    persistActiveCbt({ currentIndex: index });
    setCurrentIndex(index);
    setSelectedIndex(storedAnswer?.selectedIndex ?? null);
    // CBT answers remain editable until submission; study/review questions preserve their completed correction state.
    setAnswered(isHistoricalReview ? true : (isCbt ? false : Boolean(storedAnswer)));
  }, [answers, isCbt, isHistoricalReview, roundQuestions]);

  const saveAndNextCbt = useCallback(() => {
    if (!isCbt) return;
    navigateQuestion((currentIndex + 1) % roundQuestions.length);
  }, [currentIndex, isCbt, navigateQuestion, roundQuestions.length]);

  const toggleFlag = useCallback(() => {
    if (!isCbt || !currentQuestion) return;
    setFlaggedIds((current) => {
      const next = current.includes(currentQuestion.id) ? current.filter((id) => id !== currentQuestion.id) : [...current, currentQuestion.id];
      persistActiveCbt({ flaggedIds: next });
      return next;
    });
  }, [currentQuestion, isCbt, persistActiveCbt]);

  const togglePause = useCallback(() => {
    if (!isCbt || screen !== "quiz") return;
    setIsPaused((current) => {
      const next = !current;
      persistActiveCbt({ isPaused: next });
      return next;
    });
  }, [isCbt, persistActiveCbt, screen]);

  const submitCbtReview = useCallback(() => {
    if (!isCbt) return;
    recordFinalRound(answers, score);
  }, [answers, isCbt, recordFinalRound, score]);

  const quitRound = useCallback(() => {
    if (isCbt) {
      persistActiveCbt();
      setResumableCbt(getActiveCbtSession());
    }
    setScreen("home");
  }, [isCbt, persistActiveCbt]);
  const resumeCbt = useCallback(() => {
    if (!resumableCbt || !playableQuestions.length) return;
    const byId = new Map(playableQuestions.map((question) => [question.id, question]));
    const restoredQuestions = resumableCbt.questionIds.map((id) => byId.get(id)).filter((question): question is BankQuestion => Boolean(question));
    if (restoredQuestions.length !== resumableCbt.questionIds.length) {
      clearActiveCbtSession();
      setResumableCbt(null);
      setLoadError("The saved CBT contains questions that are no longer available in the active bank. Start a new CBT instead.");
      return;
    }
    const restoredSeconds = resumableCbt.isPaused || resumableCbt.deadlineAt === null ? resumableCbt.secondsLeft : Math.max(0, Math.ceil((resumableCbt.deadlineAt - Date.now()) / 1000));
    const restoredIndex = Math.min(Math.max(0, resumableCbt.currentIndex), restoredQuestions.length - 1);
    setRoundConfig(resumableCbt.config);
    setRoundQuestions(restoredQuestions);
    setAnswers(resumableCbt.answers);
    setFlaggedIds(resumableCbt.flaggedIds);
    setCurrentIndex(restoredIndex);
    setSelectedIndex(resumableCbt.answers[restoredQuestions[restoredIndex].id]?.selectedIndex ?? null);
    setSecondsLeft(restoredSeconds);
    setInitialSeconds(resumableCbt.initialSeconds);
    setStartedAt(Date.now() - Math.max(0, resumableCbt.initialSeconds - restoredSeconds) * 1000);
    setScore(Object.values(resumableCbt.answers).filter((answer) => answer.correct).length * 100);
    setAnswered(false);
    setStreak(0);
    setIsPaused(resumableCbt.isPaused);
    setLoadError(null);
    setScreen("quiz");
  }, [playableQuestions, resumableCbt]);
  const discardResumableCbt = useCallback(() => {
    clearActiveCbtSession();
    setResumableCbt(null);
  }, []);
  const retryRound = useCallback(() => {
    if (roundConfig) startRound(roundConfig);
  }, [roundConfig, startRound]);
  const openHistoricalReview = useCallback((attempt: { subject: RoundSubject; completedAt: Date; durationSeconds: number; answerReview: Array<{ questionId: string | null; selectedIndex: number | null; correct: boolean; timedOut: boolean; flagged: boolean }> }) => {
    const bankById = new Map(playableQuestions.map((question) => [question.id, question]));
    const restored = attempt.answerReview.flatMap((answer) => answer.questionId && bankById.has(answer.questionId) ? [bankById.get(answer.questionId)!] : []);
    if (!restored.length) {
      setLoadError("The questions from that saved CBT attempt are no longer available in the active question bank.");
      return false;
    }
    const answersByQuestion = Object.fromEntries(attempt.answerReview.flatMap((answer) => answer.questionId && bankById.has(answer.questionId) ? [[answer.questionId, { selectedIndex: answer.selectedIndex, correct: answer.correct, timedOut: answer.timedOut } satisfies AnswerRecord] as const] : []));
    const restoredFlags = attempt.answerReview.flatMap((answer) => answer.flagged && answer.questionId ? [answer.questionId] : []);
    setRoundConfig({ subject: attempt.subject, mode: "review", count: restored.length, timing: "study", questionIds: restored.map((question) => question.id), recoveryOrigin: "missed-questions" });
    setRoundQuestions(restored);
    setAnswers(answersByQuestion);
    setFlaggedIds(restoredFlags);
    setCurrentIndex(0);
    setSelectedIndex(answersByQuestion[restored[0]!.id]?.selectedIndex ?? null);
    setAnswered(true);
    setIsHistoricalReview(true);
    setHistoricalReview({ completedAt: attempt.completedAt, durationSeconds: attempt.durationSeconds });
    setHistoricalFilter("all");
    setHistoricalSnapshot({ questions: restored, answers: answersByQuestion, flaggedIds: restoredFlags });
    setScreen("quiz");
    return true;
  }, [playableQuestions]);
  const filterHistoricalReview = useCallback((filter: "all" | "correct" | "wrong") => {
    if (!historicalSnapshot) return;
    const filtered = historicalSnapshot.questions.filter((question) => filter === "all" || (filter === "correct" ? historicalSnapshot.answers[question.id]?.correct : !historicalSnapshot.answers[question.id]?.correct));
    if (!filtered.length) return;
    const filteredAnswers = Object.fromEntries(filtered.flatMap((question) => historicalSnapshot.answers[question.id] ? [[question.id, historicalSnapshot.answers[question.id]] as const] : []));
    setHistoricalFilter(filter);
    setRoundQuestions(filtered);
    setAnswers(filteredAnswers);
    setFlaggedIds(historicalSnapshot.flaggedIds.filter((id) => filtered.some((question) => question.id === id)));
    setCurrentIndex(0);
    setSelectedIndex(filteredAnswers[filtered[0]!.id]?.selectedIndex ?? null);
    setAnswered(true);
  }, [historicalSnapshot]);

  return {
    questions: playableQuestions,
    loading,
    loadError,
    reload,
    progress,
    screen,
    roundConfig,
    roundQuestions,
    currentIndex,
    currentQuestion,
    selectedIndex,
    currentAnswer,
    answers,
    answered,
    secondsLeft,
    score,
    streak,
    correctCount,
    wrongQuestions,
    flaggedIds,
    isCbt,
    isPaused,
    historicalReview,
    historicalFilter,
    canReview: progress.wrongIds.length > 0,
    resumableCbt,
    startRound,
    selectAnswer,
    submitAnswer,
    nextQuestion,
    navigateCbt: navigateQuestion,
    navigateQuestion,
    saveAndNextCbt,
    toggleFlag,
    togglePause,
    finishCbt,
    submitCbtReview,
    quitRound,
    retryRound,
    openHistoricalReview,
    filterHistoricalReview,
    resumeCbt,
    discardResumableCbt,
    persistActiveCbt,
    goHome: quitRound,
  };
}
