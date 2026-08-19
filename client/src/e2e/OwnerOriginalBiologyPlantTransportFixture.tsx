import { useState } from "react";
import { QuestionCard } from "@/components/QuestionCard";
import type { BankQuestion } from "@/game/types";

const sharedDiagramUrl = "/manus-storage/biology-plant-transport-original_1e2a8b38.png";

const plantTransportQuestion: BankQuestion = {
  id: "biology-dr-high-0012",
  subject: "Biology",
  topic: "Plant and mammal structure",
  subtopic: "Transport in plants",
  difficulty: "medium",
  question_type: "multiple_choice",
  tags: ["xylem", "phloem", "owner original"],
  source: "Owner-provided Biology past questions",
  question: "The movement of material in the xylem and phloem tissues of the plant are represented by the arrows labelled",
  options: ["III and IV respectively", "II and I respectively", "I and II respectively", "I and III respectively"],
  answer_index: 0,
  answer_text: "III and IV respectively",
  explanation: "Xylem transports water and mineral salts upward from the roots. Phloem transports manufactured food from the leaves to other parts of the plant. The arrows marked III and IV show these two movements respectively.",
  diagram_url: sharedDiagramUrl,
};

export default function OwnerOriginalBiologyPlantTransportFixture() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  return <main className="p-4 md:p-8"><QuestionCard question={plantTransportQuestion} index={0} total={1} selectedIndex={selectedIndex} answered={false} onSelect={setSelectedIndex} onSubmit={() => undefined} onNext={() => undefined} /></main>;
}
