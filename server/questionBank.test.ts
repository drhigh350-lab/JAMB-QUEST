import { describe, expect, it } from "vitest";
import { normaliseLearnerTopic } from "../client/src/game/questionBank";

describe("learner-facing topic normalization", () => {
  it("replaces the internal syllabus-mapping placeholder with a neutral subject study label", () => {
    expect(normaliseLearnerTopic("Chemistry", "To be tagged during syllabus mapping")).toBe("Chemistry practice");
    expect(normaliseLearnerTopic("Biology", "  ")).toBe("Biology practice");
  });

  it("preserves meaningful supplied study topics", () => {
    expect(normaliseLearnerTopic("Physics", "Mechanics")).toBe("Mechanics");
  });
});
