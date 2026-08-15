import { describe, expect, it } from "vitest";
import { toPlayableAuthorisedQuestion } from "./db";

describe("authorised five-option mapping", () => {
  it("preserves option E and its answer mapping in the playable bank", () => {
    const playable = toPlayableAuthorisedQuestion({
      id: 91001,
      subject: "Physics",
      topic: "Mechanics",
      difficulty: "medium",
      questionText: "Which of these is a valid fifth option?",
      optionsJson: JSON.stringify(["A", "B", "C", "D", "E" ]),
      answerIndex: 4,
      explanation: "The owner-supplied answer key selects option E.",
      explanationStatus: "approved",
      sourceLabel: "Five-option test source",
    });
    expect(playable?.options).toHaveLength(5);
    expect(playable?.answer_index).toBe(4);
    expect(playable?.answer_text).toBe("E");
  });
});
