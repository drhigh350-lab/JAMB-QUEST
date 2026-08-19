import { describe, expect, it } from "vitest";
import { evaluateQuestionFormatting } from "../shared/questionFormattingGate";

describe("question formatting intake gate", () => {
  it("holds an English question whose retained source explicitly says the passage stem is incomplete", () => {
    const result = evaluateQuestionFormatting({
      subject: "Use of English",
      topic: "Comprehension passages",
      question: "[Continues Passage I - question stem partially cut off in source scan; answer options below are complete]",
      options: ["A", "B", "C", "D"],
    });

    expect(result).toMatchObject({ status: "needs_review", reasons: ["source context, question stem, or required visual is explicitly incomplete"] });
  });

  it("accepts a self-contained English completion prompt and reports its display-safe gap", () => {
    const result = evaluateQuestionFormatting({
      subject: "Use of English",
      question: "Neither Ade nor Bisi _ ready.",
      options: ["is", "are", "was", "were"],
    });

    expect(result).toMatchObject({ status: "ready", hasLegacyEnglishGap: true });
  });

  it("records ASCII exponent presentation needs without rewriting the source record", () => {
    const result = evaluateQuestionFormatting({
      subject: "Physics",
      question: "A force F^6 acts on a body.",
      options: ["A", "B", "C", "D"],
    });

    expect(result).toMatchObject({ status: "ready", hasAsciiExponent: true });
  });

  it("holds a science question that references a visual but has no linked asset", () => {
    const result = evaluateQuestionFormatting({
      subject: "Chemistry",
      question: "Choose the correct option from the graph above.",
      options: ["A", "B", "C", "D"],
      diagramUrl: null,
    });

    expect(result).toMatchObject({ status: "needs_review", reasons: ["question references a visual but no linked visual asset is supplied"] });
  });
});
