import { useState } from "react";
import { QuestionCard } from "@/components/QuestionCard";
import type { BankQuestion } from "@/game/types";

const energyProfileQuestion: BankQuestion = {
  id: "kairo-csv-chemistry_20650b",
  subject: "Chemistry",
  topic: "Energy changes",
  subtopic: "Energy profiles",
  difficulty: "medium",
  question_type: "multiple_choice",
  tags: ["energy profile", "activation energy", "owner original"],
  source: "Owner-provided Chemistry past questions",
  question: "In the energy profile diagram above, X represents the:",
  options: ["enthalpy.", "enthalpy change.", "activation energy.", "activated complex."],
  answer_index: 2,
  answer_text: "activation energy.",
  explanation: "The point marked X is at the top of the energy barrier. Reacting particles must reach this peak before products can form. The energy needed to reach the peak is the activation energy.",
  diagram_url: "/manus-storage/chemistry-energy-profile-original_3e1f7670.png",
};

export default function OwnerOriginalEnergyProfileFixture() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  return <main className="p-4 md:p-8"><QuestionCard question={energyProfileQuestion} index={0} total={1} selectedIndex={selectedIndex} answered={false} onSelect={setSelectedIndex} onSubmit={() => undefined} onNext={() => undefined} /></main>;
}
