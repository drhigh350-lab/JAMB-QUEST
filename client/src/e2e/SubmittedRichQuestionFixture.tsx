import { QuestionCard } from "@/components/QuestionCard";
import type { BankQuestion } from "@/game/types";

const submittedQuestion: BankQuestion = {
  id: "chem-part1-md-Chemistry-1",
  subject: "Chemistry",
  topic: "General Chemistry",
  subtopic: "",
  difficulty: "medium",
  question_type: "multiple_choice",
  question: "The non-volatile residue from the destructive distillation of coal is:",
  options: ["Coal tar", "Lamp black", "Coke", "Coal gas"],
  answer_index: 2,
  answer_text: "Coke",
  explanation: "Destructive distillation means heating coal strongly in the absence of air, which breaks it down into several products. The volatile fractions — coal gas, ammoniacal liquor, and coal tar — all boil/distil off and are collected separately. What's left behind in the retort is a solid, carbon-rich residue that does not volatilise further: coke. This is the same coke used as a reducing agent and fuel in the blast furnace during iron extraction, which is why the two topics are often tested together.",
  tags: [],
  source: "internal",
};

export default function SubmittedRichQuestionFixture() {
  return (
    <main data-e2e="submitted-rich-question" className="min-h-screen p-4 md:p-8">
      <QuestionCard
        question={submittedQuestion}
        index={0}
        total={1}
        selectedIndex={2}
        answered
        answer={{ selectedIndex: 2, correct: true, timedOut: false }}
        onSelect={() => undefined}
        onSubmit={() => undefined}
        onNext={() => undefined}
      />
    </main>
  );
}
