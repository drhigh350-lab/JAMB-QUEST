import { QuestRush } from "@/components/QuestRush";
import type { BankQuestion } from "@/game/types";

const fixtureSubjects = ["Use of English", "Biology", "Chemistry", "Physics"] as const;
const fixtureQuestions: BankQuestion[] = fixtureSubjects.flatMap((subject) => Array.from({ length: 12 }, (_, index) => ({ id: `rush-${subject}-${index + 1}`, subject, topic: subject === "Biology" ? "Nutrition" : "Quest fixture", subtopic: "Quest fixture", difficulty: "medium", question_type: "multiple_choice", question: `Quest Rush fixture question ${index + 1}: which option is correct?`, options: ["Option A", "Option B", "Option C", "Option D"], answer_index: 0, answer_text: "Option A", explanation: "This fixture confirms the Quest Rush question card and correction flow.", tags: [], source: "fixture" })));
export function QuestRushFixture() { const autoStart = new URLSearchParams(window.location.search).get("autostart") === "1"; return <QuestRush questions={fixtureQuestions} defaultSubject="Biology" autoStart={autoStart} onExit={() => undefined} onOpenCorrection={() => undefined} />; }
