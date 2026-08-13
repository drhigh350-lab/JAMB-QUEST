/* Field Notes Arcade: explicit round modes keep timer, answer, feedback, and result transitions deterministic. */

import { useCallback, useEffect, useMemo, useState } from "react";
import { loadQuestionBank, selectQuestions } from "./questionBank";
import { getProgress, recordRound, saveProgress } from "./storage";
import type { AnswerRecord, BankQuestion, ExamReviewRecord, GameScreen, QuizMode, RoundConfig, RoundSubject, StoredProgress } from "./types";

const DEFAULT_SECONDS = 35;
const CBT_MINIMUM_SECONDS = 20 * 60;

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
    return [...questions, ...additionalQuestions].filter((question) => {
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
    if (screen !== "quiz" || (!isCbt && answered)) return;
    const interval = window.setInterval(() => setSecondsLeft((current) => Math.max(current - 1, 0)), 1000);
    return () => window.clearInterval(interval);
  }, [answered, isCbt, screen]);

  useEffect(() => {
    if (screen !== "quiz" || secondsLeft !== 0) return;
    if (isCbt) finishCbt();
    else if (!answered) submitAnswer(true);
  }, [answered, finishCbt, isCbt, screen, secondsLeft]);

  const startRound = useCallback(
    (config: RoundConfig) => {
      if (!playableQuestions.length) return;
      const picked = selectQuestions(playableQuestions, config.subject, config.mode, config.count, progress.wrongIds);
      if (!picked.length) return;
      const startingSeconds = config.mode === "cbt" ? Math.max(CBT_MINIMUM_SECONDS, config.count * 75) : DEFAULT_SECONDS;
      setRoundConfig(config);
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
      setScreen("quiz");
    },
    [playableQuestions, progress.wrongIds],
  );

  const selectAnswer = useCallback((index: number) => {
    if (!currentQuestion || answered) return;
    setSelectedIndex(index);
    if (roundConfig?.mode === "cbt") {
      setAnswers((current) => ({ ...current, [currentQuestion.id]: { selectedIndex: index, correct: index === currentQuestion.answer_index, timedOut: false } }));
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
    setScreen("result");
  }, [buildReview, flaggedIds, initialSeconds, onRoundComplete, progress, remoteProgress, roundConfig, roundQuestions, secondsLeft, startedAt]);

  const nextQuestion = useCallback(() => {
    if (!answered || !roundConfig) return;
    if (currentIndex >= roundQuestions.length - 1) {
      recordFinalRound(answers, score);
      return;
    }
    setCurrentIndex((current) => current + 1);
    setSelectedIndex(null);
    setAnswered(false);
    setSecondsLeft(DEFAULT_SECONDS);
  }, [answers, answered, currentIndex, recordFinalRound, roundConfig, roundQuestions.length, score]);

  const navigateCbt = useCallback((index: number) => {
    if (!isCbt || index < 0 || index >= roundQuestions.length) return;
    setCurrentIndex(index);
    setSelectedIndex(answers[roundQuestions[index].id]?.selectedIndex ?? null);
  }, [answers, isCbt, roundQuestions]);

  const saveAndNextCbt = useCallback(() => {
    if (!isCbt) return;
    navigateCbt((currentIndex + 1) % roundQuestions.length);
  }, [currentIndex, isCbt, navigateCbt, roundQuestions.length]);

  const toggleFlag = useCallback(() => {
    if (!isCbt || !currentQuestion) return;
    setFlaggedIds((current) => current.includes(currentQuestion.id) ? current.filter((id) => id !== currentQuestion.id) : [...current, currentQuestion.id]);
  }, [currentQuestion, isCbt]);

  const submitCbtReview = useCallback(() => {
    if (!isCbt) return;
    recordFinalRound(answers, score);
  }, [answers, isCbt, recordFinalRound, score]);

  const quitRound = useCallback(() => setScreen("home"), []);
  const retryRound = useCallback(() => {
    if (roundConfig) startRound(roundConfig);
  }, [roundConfig, startRound]);

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
    canReview: progress.wrongIds.length > 0,
    startRound,
    selectAnswer,
    submitAnswer,
    nextQuestion,
    navigateCbt,
    saveAndNextCbt,
    toggleFlag,
    finishCbt,
    submitCbtReview,
    quitRound,
    retryRound,
    goHome: quitRound,
  };
}
