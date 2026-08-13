import { describe, expect, it } from "vitest";
import { normalisedTopic, questionExplanationLines } from "../client/src/game/explanation";
import type { BankQuestion } from "../client/src/game/types";

const question: BankQuestion = {
  id: "test-1",
  subject: "Biology",
  topic: "  Cell structure  ",
  subtopic: "",
  difficulty: "medium",
  question_type: "multiple_choice",
  question: "Which structure controls cell activities?",
  options: ["Nucleus", "Cell wall", "Ribosome", "Vacuole"],
  answer_index: 0,
  answer_text: "Nucleus",
  explanation: "The nucleus contains genetic material and coordinates cell activities.",
  tags: [],
  source: "internal",
};

describe("uniform question explanation", () => {
  it("normalises the topic and returns six learning lines", () => {
    expect(normalisedTopic(question.topic)).toBe("Cell structure");
    const lines = questionExplanationLines(question);
    expect(lines).toHaveLength(6);
    expect(lines[0]).toContain("Nucleus");
    expect(lines[1]).toContain("contains genetic material");
    expect(lines[2]).toContain("Cell structure");
  });

  it("uses a safe topic and answer fallback when source text is short", () => {
    const lines = questionExplanationLines({ ...question, topic: "", explanation: "", answer_text: "Nucleus" });
    expect(normalisedTopic("")).toBe("General revision");
    expect(lines).toHaveLength(6);
    expect(lines[0]).toContain("Nucleus");
    expect(lines[1]).toContain("The correct answer is Nucleus");
  });
});
