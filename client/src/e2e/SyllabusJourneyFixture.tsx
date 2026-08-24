import { SyllabusJourney } from "@/components/SyllabusJourney";
import { confirmSyllabusRead, parseSyllabusJourney, writeSyllabusJourney } from "@/game/syllabusJourney";
import type { BankQuestion } from "@/game/types";

const questions: BankQuestion[] = Array.from({ length: 7 }, (_, index) => ({
  id: `BIO-JOURNEY-${index + 1}`,
  subject: "Biology",
  topic: "Nutrition and digestion",
  subtopic: "Nutrition",
  difficulty: "medium",
  question_type: "multiple_choice",
  question: `Fixture biology nutrition question ${index + 1}: which statement best reflects a sound digestion concept?`,
  options: ["The named process uses the stated organ or substance.", "It has no role in digestion.", "It happens only in plants.", "It is unrelated to nutrients."],
  answer_index: 0,
  answer_text: "The named process uses the stated organ or substance.",
  explanation: "This fixture confirms that the Syllabus Journey can use a readable approved-style explanation after a topic-specific answer.",
  tags: [],
  source: "e2e fixture",
}));

export function SyllabusJourneyFixture() {
  const autoStart = new URLSearchParams(window.location.search).get("autoStart") === "1";
  if (autoStart) writeSyllabusJourney(confirmSyllabusRead(parseSyllabusJourney(null), "Biology", "Nutrition and digestion"));
  return <SyllabusJourney onExit={() => undefined} defaultPlannerOpen={autoStart} />;
}
