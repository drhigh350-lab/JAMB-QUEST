import { useState } from "react";
import { QuestionCard } from "@/components/QuestionCard";
import type { BankQuestion } from "@/game/types";

const question: BankQuestion = {
  id: "english-presentation-fixture",
  subject: "Use of English",
  topic: "Comprehension passages",
  subtopic: "Reading comprehension",
  difficulty: "medium",
  question_type: "multiple_choice",
  tags: ["passage", "comprehension"],
  source: "English presentation fixture",
  question: 'Passage: "Climate change poses serious challenges to agriculture. Rising temperatures alter growing seasons, while flooding and drought increase crop failures. Farmers must adapt through technology and sustainable practices." The main idea of the passage is:',
  options: ["Climate change affects agricultural production and requires adaptation", "Technology has solved every agricultural problem", "Flooding is the only challenge farmers face", "Growing seasons never change"],
  answer_index: 0,
  answer_text: "Climate change affects agricultural production and requires adaptation",
  explanation: "The passage names several effects of climate change on farming. It also says farmers need sustainable practices and technology. The main idea therefore combines the problem and the need to adapt.",
  diagram_url: undefined,
};

export default function EnglishQuestionPresentationFixture() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  return <main className="p-4 md:p-8"><QuestionCard question={question} index={0} total={1} selectedIndex={selectedIndex} answered={false} onSelect={setSelectedIndex} onSubmit={() => undefined} onNext={() => undefined} /></main>;
}
