import { useMemo, useState } from "react";
import { QuizShell } from "@/components/QuizShell";
import type { AnswerRecord, BankQuestion } from "@/game/types";

const fiveOptionQuestion: BankQuestion = {
  id: "e2e-five-option-physics",
  subject: "Physics",
  topic: "Mechanics",
  subtopic: "Owner-provided source",
  difficulty: "medium",
  question_type: "multiple_choice",
  question: "Which label identifies the fifth legitimate answer choice?",
  options: ["A choice", "B choice", "C choice", "D choice", "E choice"],
  answer_index: 4,
  answer_text: "E choice",
  explanation: "This fixture confirms that the learner card renders a fifth option. The correct answer is E. Keyboard shortcut E must select the fifth choice during CBT. Four-option cards remain supported alongside this format.",
  tags: ["fixture"],
  source: "Five-option browser fixture",
};

export default function FiveOptionCbtFixture() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});
  const answerMap = useMemo(() => answers, [answers]);
  const select = (index: number) => {
    setSelectedIndex(index);
    setAnswers({ [fiveOptionQuestion.id]: { selectedIndex: index, correct: index === fiveOptionQuestion.answer_index, timedOut: false } });
  };
  return <main data-e2e="five-option-cbt" data-selected={selectedIndex ?? ""}><QuizShell config={{ subject: "Physics", mode: "cbt", count: 1 }} questions={[fiveOptionQuestion]} currentIndex={0} currentQuestion={fiveOptionQuestion} selectedIndex={selectedIndex} answered={false} currentAnswer={answers[fiveOptionQuestion.id]} secondsLeft={600} streak={0} answers={answerMap} onSelect={select} onSubmit={() => undefined} onNext={() => undefined} onQuit={() => undefined} onNavigate={() => undefined} onToggleFlag={() => undefined} onFinishCbt={() => undefined} onTogglePause={() => undefined} /></main>;
}
