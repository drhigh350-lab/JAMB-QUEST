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

  it("uses type-specific directions for legacy model reading, grammar, lexis, and oral-form prompts", () => {
    expect(withUseOfEnglishInstruction("Comprehension and summary", "Excerpt: 'Rain fell.' What is the main idea?").instruction).toBe("Read the passage or excerpt carefully and choose the option that best answers the question.");
    expect(withUseOfEnglishInstruction("Grammar and sentence structure", "Neither Ada nor Musa _____ ready.").instruction).toBe("Choose the option that correctly completes or improves the sentence.");
    expect(withUseOfEnglishInstruction("Lexis and idioms", "What does the expression mean?").instruction).toBe("Choose the option that best explains the word, expression, or usage in the question.");
    expect(withUseOfEnglishInstruction("Oral forms", "Which word rhymes with sight?").instruction).toBe("Choose the option with the required sound relationship.");
  });

  it("is idempotent for a prompt that already gives a clear instruction", () => {
    const prompt = "Choose the option opposite in meaning to the key word in the sentence.\n\nThe road is accessible to vehicles.";
    expect(withUseOfEnglishInstruction("Antonyms", prompt)).toEqual({ instruction: "", questionText: prompt, changed: false });
  });
});
