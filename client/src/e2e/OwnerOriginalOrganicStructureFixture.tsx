import { useState } from "react";
import { QuestionCard } from "@/components/QuestionCard";
import type { BankQuestion } from "@/game/types";

const organicStructureQuestion: BankQuestion = {
  id: "kairo-csv-chemistry_30bd42",
  subject: "Chemistry",
  topic: "Organic compounds",
  subtopic: "IUPAC nomenclature",
  difficulty: "medium",
  question_type: "multiple_choice",
  tags: ["organic chemistry", "IUPAC", "owner original"],
  source: "Owner-provided Chemistry past questions",
  question: "The IUPAC nomenclature for the compound above is:",
  options: ["4-methylpent-1-ene.", "3-methylpent-2-ene.", "2-methylpent-1-ene.", "2-methylpent-4-ene."],
  answer_index: 0,
  answer_text: "4-methylpent-1-ene.",
  explanation: "Choose the longest chain that contains the double bond. Number from the end nearest the double bond, making it pent-1-ene. The remaining methyl branch is on carbon 4, so the name is 4-methylpent-1-ene.",
  diagram_url: "/manus-storage/chemistry-organic-structure-original_fa400ff1.png",
};

export default function OwnerOriginalOrganicStructureFixture() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  return <main className="p-4 md:p-8"><QuestionCard question={organicStructureQuestion} index={0} total={1} selectedIndex={selectedIndex} answered={false} onSelect={setSelectedIndex} onSubmit={() => undefined} onNext={() => undefined} /></main>;
}
