import { describe, expect, it } from "vitest";
import { splitQuestionPresentation } from "../client/src/game/questionPresentation";

describe("English question presentation", () => {
  it("separates a source-supplied passage from its prompt without rewriting either", () => {
    const presentation = splitQuestionPresentation('Passage: "Climate change alters growing seasons and threatens food security." The main idea of the passage is:');
    expect(presentation).toEqual({ contextLabel: "PASSAGE", context: "Climate change alters growing seasons and threatens food security.", prompt: "The main idea of the passage is:" });
  });

  it("makes an instruction-led sentence readable while preserving the exact source text", () => {
    const presentation = splitQuestionPresentation("Read the sentence: 'Despite the torrential rain, the farmer ploughed on.' The underlined phrase means:");
    expect(presentation.contextLabel).toBe("READ THE SENTENCE:");
    expect(presentation.context).toBe("Despite the torrential rain, the farmer ploughed on.");
    expect(presentation.prompt).toBe("The underlined phrase means:");
  });

  it("keeps ordinary questions and intentional line breaks unchanged", () => {
    const presentation = splitQuestionPresentation("Choose the best answer.\n\nThe committee met yesterday.");
    expect(presentation).toEqual({ contextLabel: null, context: null, prompt: "Choose the best answer.\n\nThe committee met yesterday." });
  });
});
