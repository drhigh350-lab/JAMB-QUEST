import { describe, expect, it } from "vitest";
import { normaliseLearnerTopic, normaliseQuestionTopic } from "../client/src/game/questionBank";

describe("learner-facing topic normalization", () => {
  it("replaces a placeholder without question content with an honest subject-level fallback", () => {
    expect(normaliseLearnerTopic("Chemistry", "To be tagged during syllabus mapping")).toBe("Unclassified");
    expect(normaliseLearnerTopic("Biology", "  ")).toBe("Unclassified");
  });

  it("preserves meaningful supplied study topics", () => {
    expect(normaliseLearnerTopic("Physics", "Mechanics")).toBe("Mechanics");
  });

  it("derives the actual topic for the affected gas-diffusion Chemistry question", () => {
    expect(normaliseQuestionTopic({ id: "authorised-60074", subject: "Chemistry", topic: "To be tagged during syllabus mapping", difficulty: "medium", question_type: "multiple_choice", question: "If 140cm³ of hydrogen diffuses in 40s, how long will 245cm³ of gas M take?", options: ["A", "B", "C", "D"], answer_index: 0, answer_text: "A", explanation: "", tags: [], source: "authorised" }).topic).toBe("Gas Laws and Diffusion");
  });
});
