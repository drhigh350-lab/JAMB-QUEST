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

  it("preserves rich paragraph-style author explanations by wrapping their own words rather than replacing them with generic notes", () => {
    const richExplanation = "Meiosis is a specialised cell division that produces haploid gametes for sexual reproduction. It reduces the chromosome number from the diploid parent state to a haploid daughter state. Two successive divisions follow one DNA replication event, so four daughter cells are usually formed. Crossing over and independent assortment during meiosis increase genetic variation among gametes. Mitosis instead preserves chromosome number for growth, repair, and replacement of body cells. The exam cue is that a question about gametes and chromosome-number reduction points to meiosis.";
    const lines = questionExplanationLines({ ...question, explanation: richExplanation });
    expect(lines).toHaveLength(6);
    expect(lines.join(" ")).toContain("independent assortment");
    expect(lines.join(" ")).not.toContain("Reasoning step:");
  });
});
