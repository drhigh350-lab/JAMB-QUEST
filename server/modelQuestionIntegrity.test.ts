import { describe, expect, it } from "vitest";
import { modelQuestionIntegrityReasons } from "./modelQuestionIntegrity";

describe("model question structural answer-integrity gate", () => {
  it("accepts a complete A-D item whose answer text matches its keyed option", () => {
    expect(modelQuestionIntegrityReasons({ question: "Which option is correct?", options: ["Alpha", "Beta", "Gamma", "Delta"], answer_index: 1, answer_text: "Beta" })).toEqual([]);
  });

  it("rejects mismatched answer text and embedded explanation metadata", () => {
    expect(modelQuestionIntegrityReasons({ question: "Which option is correct?", options: ["Alpha", "Beta\nExplanation: not learner-facing", "Gamma", "Delta"], answer_index: 0, answer_text: "Gamma" })).toEqual(expect.arrayContaining(["embedded answer or explanation metadata in option", "answer text does not match indexed option"]));
  });
});
