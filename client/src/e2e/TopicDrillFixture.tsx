import { TopicDrill } from "@/components/TopicDrill";
import type { BankQuestion } from "@/game/types";

const questions: BankQuestion[] = Array.from({ length: 12 }, (_, index) => ({
  id: `BIO-TOPIC-DRILL-${index + 1}`,
  subject: "Biology",
  topic: "Nutrition and digestion",
  subtopic: "Nutrition",
  difficulty: "medium",
  question_type: "multiple_choice",
  question: `Fixture topic drill biology question ${index + 1}`,
  options: ["A", "B", "C", "D"],
  answer_index: 0,
  answer_text: "A",
  explanation: "A complete fixture explanation for the isolated Topic Drill screen.",
  tags: [],
  source: "e2e fixture",
}));

export function TopicDrillFixture() {
  return <TopicDrill questions={questions} onExit={() => undefined} onStart={() => undefined} />;
}
