import { useEffect, useMemo, useState } from "react";
import { ExamReview } from "@/components/ExamReview";
import { QuizShell } from "@/components/QuizShell";
import { loadQuestionBank } from "@/game/questionBank";
import type { AnswerRecord, BankQuestion } from "@/game/types";

export default function CbtFlowFixture() {
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [screen, setScreen] = useState<"quiz" | "review" | "logged">("quiz");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    void loadQuestionBank().then((bank) => {
      const needed = ["Use of English", "Biology", "Chemistry", "Physics"] as const;
      const selected = needed.map((subject) => bank.find((question) => question.subject === subject)).filter((question): question is BankQuestion => Boolean(question));
      if (selected.length !== 4) throw new Error("CBT fixture could not load all four subjects");
      setQuestions(selected);
    }).catch((error) => setLoadError(error instanceof Error ? error.message : "Unable to load CBT fixture"));
  }, []);

  const question = questions[currentIndex];
  const goTo = (index: number) => {
    setCurrentIndex(index);
    setSelectedIndex(answers[questions[index]?.id]?.selectedIndex ?? null);
  };
  const select = (index: number) => {
    if (!question) return;
    setSelectedIndex(index);
    setAnswers((current) => ({ ...current, [question.id]: { selectedIndex: index, correct: index === question.answer_index, timedOut: false } }));
  };
  const toggleFlag = () => {
    if (!question) return;
    setFlaggedIds((current) => current.includes(question.id) ? current.filter((id) => id !== question.id) : [...current, question.id]);
  };
  const currentAnswer = question ? answers[question.id] : undefined;
  const answerMap = useMemo(() => answers, [answers]);
  if (loadError) return <main data-e2e="cbt-error">{loadError}</main>;
  if (!question) return <main data-e2e="cbt-loading">Loading four-subject CBT fixture…</main>;
  if (screen === "logged") return <main data-e2e="cbt-logged">CBT exam log saved.</main>;
  if (screen === "review") return <ExamReview config={{ subject: "Full JAMB Mock", mode: "cbt", count: 4 }} questions={questions} answers={answerMap} flaggedIds={flaggedIds} onFinalize={() => setScreen("logged")} onHome={() => setScreen("quiz")} />;
  return <QuizShell config={{ subject: "Full JAMB Mock", mode: "cbt", count: 4 }} questions={questions} currentIndex={currentIndex} currentQuestion={question} selectedIndex={selectedIndex} answered={false} currentAnswer={currentAnswer} secondsLeft={1200} streak={0} answers={answerMap} onSelect={select} onSubmit={() => undefined} onNext={() => goTo((currentIndex + 1) % questions.length)} onQuit={() => undefined} flaggedIds={flaggedIds} onNavigate={goTo} onToggleFlag={toggleFlag} onFinishCbt={() => setScreen("review")} />;
}
