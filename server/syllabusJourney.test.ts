import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { confirmSyllabusRead, entryFor, parseSyllabusJourney, recordSyllabusQuiz, selectSyllabusJourneyQuiz, syllabusJourneyKey } from "../client/src/game/syllabusJourney";
import type { BankQuestion } from "../client/src/game/types";

const question = (id: string): BankQuestion => ({ id, subject: "Biology", topic: "Nutrition and digestion", difficulty: "medium", question_type: "multiple_choice", question: `Question ${id}`, options: ["A", "B", "C", "D"], answer_index: 0, answer_text: "A", explanation: "A complete fixture explanation.", tags: [], source: "fixture" });

describe("Syllabus Journey", () => {
  it("records study confirmation separately from quiz evidence and preserves the best diagnostic score", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_725_000_000_000);
    const read = confirmSyllabusRead(parseSyllabusJourney(null), "Biology", "Nutrition and digestion");
    const completed = recordSyllabusQuiz(read, "Biology", "Nutrition and digestion", 60, ["BIO-1", "BIO-2"]);
    const retried = recordSyllabusQuiz(completed, "Biology", "Nutrition and digestion", 40, ["BIO-3"]);
    vi.restoreAllMocks();
    expect(entryFor(retried, "Biology", "Nutrition and digestion")).toMatchObject({ readAt: 1_725_000_000_000, quizAttempts: 2, bestScore: 60, lastScore: 40, recentQuestionIds: ["BIO-1", "BIO-2", "BIO-3"] });
    expect(syllabusJourneyKey("Biology", "Nutrition and digestion")).toContain("Biology::");
  });

  it("selects only the exact official topic and avoids immediate repeat cards where possible", () => {
    const cards = [question("BIO-1"), question("BIO-2"), question("BIO-3"), question("BIO-4"), { ...question("BIO-other"), topic: "Respiration" }];
    const selected = selectSyllabusJourneyQuiz(cards, "Biology", "Nutrition and digestion", 2, ["BIO-1", "BIO-2"]);
    expect(selected).toHaveLength(2);
    expect(selected.every((item) => item.topic === "Nutrition and digestion" && !["BIO-1", "BIO-2"].includes(item.id))).toBe(true);
  });

  it("keeps the planner honest, exposes official-area subtopics, and hands off only to the separate Topic Drill", () => {
    const source = readFileSync("client/src/components/SyllabusJourney.tsx", "utf8");
    expect(source).toContain("Marking a section studied is a planning reminder, not a mastery claim.");
    expect(source).toContain("PLAN → PRACTISE");
    expect(source).toContain("LEARNING OBJECTIVE");
    expect(source).toContain("SUBTOPICS");
    expect(source).toContain("Suggested next step");
    expect(source).toContain("Open Topic Drill");
    expect(source).not.toContain("selectSyllabusJourneyQuiz");
    expect(source).not.toContain('setPhase("quiz")');
    expect(source).not.toContain("recordRound");
  });
});
