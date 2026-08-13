/* Field Notes Arcade: explicit round modes keep timer, answer, feedback, and result transitions deterministic. */

import { useCallback, useEffect, useMemo, useState } from "react";
import { loadQuestionBank, selectQuestions } from "./questionBank";
import { getProgress, recordRound, saveProgress } from "./storage";
import type { AnswerRecord, BankQuestion, GameScreen, QuizMode, RoundConfig, StoredProgress, Subject } from "./types";

const DEFAULT_SECONDS = 35;
const CBT_SECONDS = 50;

export function useQuizGame() {
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
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

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

  const currentQuestion = roundQuestions[currentIndex] ?? null;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const correctCount = Object.values(answers).filter((answer) => answer.correct).length;
  const wrongQuestions = useMemo(
    () => roundQuestions.filter((question) => answers[question.id] && !answers[question.id].correct),
    [answers, roundQuestions],
  );

  useEffect(() => {
    if (screen !== "quiz" || answered) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [answered, currentIndex, screen]);

  useEffect(() => {
    if (screen === "quiz" && secondsLeft === 0 && !answered) submitAnswer(true);
  }, [answered, screen, secondsLeft]);

  const startRound = useCallback(
    (config: RoundConfig) => {
      if (!questions.length) return;
      const picked = selectQuestions(questions, config.subject, config.mode, config.count, progress.wrongIds);
      if (!picked.length) return;
      setRoundConfig(config);
      setRoundQuestions(picked);
      setCurrentIndex(0);
      setSelectedIndex(null);
      setAnswers({});
      setAnswered(false);
      setSecondsLeft(config.mode === "cbt" ? CBT_SECONDS : DEFAULT_SECONDS);
      setScore(0);
      setStreak(0);
      setScreen("quiz");
    },
    [progress.wrongIds, questions],
  );

  const submitAnswer = useCallback(
    (timedOut = false) => {
      if (!currentQuestion || answered) return;
      const isCorrect = !timedOut && selectedIndex === currentQuestion.answer_index;
      const nextAnswer: AnswerRecord = { selectedIndex: timedOut ? null : selectedIndex, correct: isCorrect, timedOut };
      setAnswers((current) => ({ ...current, [currentQuestion.id]: nextAnswer }));
      setAnswered(true);
      setStreak((current) => (isCorrect ? current + 1 : 0));
      setScore((current) => current + (isCorrect ? 100 + secondsLeft * 2 : 0));
    },
    [answered, currentQuestion, secondsLeft, selectedIndex],
  );

  const nextQuestion = useCallback(() => {
    if (!answered || !roundConfig) return;
    if (currentIndex >= roundQuestions.length - 1) {
      const nextProgress = recordRound(progress, roundConfig, roundQuestions, answers, score);
      setProgress(nextProgress);
      saveProgress(nextProgress);
      setScreen("result");
      return;
    }
    setCurrentIndex((current) => current + 1);
    setSelectedIndex(null);
    setAnswered(false);
    setSecondsLeft(roundConfig.mode === "cbt" ? CBT_SECONDS : DEFAULT_SECONDS);
  }, [answers, answered, currentIndex, progress, roundConfig, roundQuestions, score]);

  const quitRound = useCallback(() => setScreen("home"), []);
  const retryRound = useCallback(() => {
    if (roundConfig) startRound(roundConfig);
  }, [roundConfig, startRound]);

  return {
    questions,
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
    canReview: progress.wrongIds.length > 0,
    startRound,
    selectAnswer: setSelectedIndex,
    submitAnswer,
    nextQuestion,
    quitRound,
    retryRound,
    goHome: quitRound,
  };
}
