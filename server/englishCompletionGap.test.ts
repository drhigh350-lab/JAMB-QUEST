import { describe, expect, it } from "vitest";
import { preserveEnglishCompletionGap, splitQuestionPresentation } from "../client/src/game/questionPresentation";

describe("English completion prompt gaps", () => {
  it("renders a preserved double-space English blank as a visible gap", () => {
    const prompt = preserveEnglishCompletionGap("It is imperative that the government  swift measures.", "Use of English");
    expect(splitQuestionPresentation(prompt).prompt).toBe("It is imperative that the government _____ swift measures.");
  });

  it("renders a retained short underscore English blank as a visible gap", () => {
    const prompt = preserveEnglishCompletionGap("Neither Ade nor Bisi _ ready.", "Use of English");
    expect(splitQuestionPresentation(prompt).prompt).toBe("Neither Ade nor Bisi _____ ready.");
  });

  it("does not alter ordinary spacing in another subject", () => {
    expect(preserveEnglishCompletionGap("A force  acts on the body.", "Physics")).toBe("A force  acts on the body.");
  });

  it("keeps the question-card fallback safe when a legacy fixture has no prompt text", () => {
    expect(preserveEnglishCompletionGap(undefined, "Use of English")).toBe("");
  });
});
