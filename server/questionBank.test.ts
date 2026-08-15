import { describe, expect, it } from "vitest";
import { normaliseLearnerTopic, normaliseQuestionTopic, selectQuestions } from "../client/src/game/questionBank";

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

  it("creates an exact 20-question topic drill without leaking another topic or subject", () => {
    const gasQuestions = Array.from({ length: 24 }, (_, index) => ({ id: `gas-${index}`, subject: "Chemistry" as const, topic: "Gas Laws and Diffusion", difficulty: "medium" as const, question_type: "multiple_choice" as const, question: `Gas question ${index}`, options: ["A", "B", "C", "D"], answer_index: 0, answer_text: "A", explanation: "", tags: [], source: "authorised" as const }));
    const distractors = [{ ...gasQuestions[0], id: "chemistry-other", topic: "Atomic Structure and Bonding" }, { ...gasQuestions[0], id: "biology-gas", subject: "Biology" as const }];
    const selected = selectQuestions([...gasQuestions, ...distractors], "Chemistry", "sprint", 20, [], { topic: "Gas Laws and Diffusion" });
    expect(selected).toHaveLength(20);
    expect(selected.every((question) => question.subject === "Chemistry" && question.topic === "Gas Laws and Diffusion")).toBe(true);
  });

  it("launches a mixed 20-question Lekki drill across chapter-labelled novel topics only", () => {
    const chapterOne = Array.from({ length: 12 }, (_, index) => ({ id: `lekki-one-${index}`, subject: "Use of English" as const, topic: "The Lekki Headmaster · Chapter 1: Dusk", difficulty: "medium" as const, question_type: "multiple_choice" as const, question: `Chapter one question ${index}`, options: ["A", "B", "C", "D"], answer_index: 0, answer_text: "A", explanation: "", tags: [], source: "authorised" as const }));
    const chapterTwo = Array.from({ length: 12 }, (_, index) => ({ ...chapterOne[index], id: `lekki-two-${index}`, topic: "The Lekki Headmaster · Chapter 2: The Enticement", question: `Chapter two question ${index}` }));
    const distractor = { ...chapterOne[0], id: "english-other", topic: "African Prose" };
    const selected = selectQuestions([...chapterOne, ...chapterTwo, distractor], "Use of English", "sprint", 20, [], { topic: "The Lekki Headmaster" });
    expect(selected).toHaveLength(20);
    expect(selected.every((question) => question.subject === "Use of English" && question.topic.startsWith("The Lekki Headmaster · Chapter"))).toBe(true);
  });
});
