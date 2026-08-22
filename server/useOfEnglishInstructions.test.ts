import { describe, expect, it } from "vitest";
import { withUseOfEnglishInstruction } from "../shared/useOfEnglishInstructions";

describe("Use of English instruction policy", () => {
  it("adds specific instructions without changing the tested prompt", () => {
    expect(withUseOfEnglishInstruction("Antonyms", "The road is accessible to vehicles.").questionText)
      .toBe("Choose the option opposite in meaning to the key word or expression in the sentence.\n\nThe road is accessible to vehicles.");
    expect(withUseOfEnglishInstruction("Synonyms", "The politician’s speech was persuasive.").questionText)
      .toContain("Choose the option nearest in meaning");
    expect(withUseOfEnglishInstruction("Tense, aspect, number and agreement", "The news about the accident ______ disturbing.").questionText)
      .toContain("Choose the option that best completes the gap");
    expect(withUseOfEnglishInstruction("Vowels", "Choose the word that has the same vowel sound as rain.")).toEqual({
      instruction: "",
      questionText: "Choose the word that has the same vowel sound as rain.",
      changed: false,
    });
  });

  it("does not prefix a complete passage instruction a second time", () => {
    const prompt = "Read the passage and answer the question. The writer argues that practice is useful.";
    expect(withUseOfEnglishInstruction("Comprehension passages", prompt)).toEqual({ instruction: "", questionText: prompt, changed: false });
  });

  it("is idempotent for a prompt that already gives a clear instruction", () => {
    const prompt = "Choose the option opposite in meaning to the key word in the sentence.\n\nThe road is accessible to vehicles.";
    expect(withUseOfEnglishInstruction("Antonyms", prompt)).toEqual({ instruction: "", questionText: prompt, changed: false });
  });
});
