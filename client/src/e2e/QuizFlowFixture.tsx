import { useEffect, useMemo, useState } from "react";
import { QuizShell } from "@/components/QuizShell";
import { loadQuestionBank } from "@/game/questionBank";
import type { AnswerRecord, BankQuestion } from "@/game/types";

export default function QuizFlowFixture() {
  const [question, setQuestion] = useState<BankQuestion | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answer, setAnswer] = useState<AnswerRecord | undefined>();
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    void loadQuestionBank().then((bank) => {
      const fixtureQuestion = bank.find((item) => item.id === "BIO-076");
      if (!fixtureQuestion) throw new Error("BIO-076 is missing from the loaded question bank");
      setQuestion(fixtureQuestion);
    }).catch((error) => setLoadError(error instanceof Error ? error.message : "Unable to load fixture question"));
  }, []);

  const answers = useMemo(() => question && answer ? { [question.id]: answer } : {}, [answer, question]);
  if (loadError) return <main data-e2e="quiz-error">{loadError}</main>;
  if (!question) return <main data-e2e="quiz-loading">Loading real question asset…</main>;
  return (
    <QuizShell
      config={{ subject: "Biology", mode: "sprint", count: 1, timing: "study" }}
      questions={[question]}
      currentIndex={0}
      currentQuestion={question}
      selectedIndex={selectedIndex}
      answered={Boolean(answer)}
      currentAnswer={answer}
      secondsLeft={60}
      streak={0}
      answers={answers}
      onSelect={setSelectedIndex}
      onSubmit={() => selectedIndex !== null && setAnswer({ selectedIndex, correct: selectedIndex === question.answer_index, timedOut: false })}
      onNext={() => undefined}
      onQuit={() => undefined}
    />
  );
}
