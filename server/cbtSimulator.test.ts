import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ExamReview } from "../client/src/components/ExamReview";
import { QuestionLedger } from "../client/src/components/QuestionLedger";
import { selectQuestions } from "../client/src/game/questionBank";
import { buildExamComparison } from "./db";
import type { BankQuestion, Subject } from "../client/src/game/types";

const subjects: Subject[] = ["Use of English", "Biology", "Chemistry", "Physics"];
const questions: BankQuestion[] = subjects.flatMap((subject) => Array.from({ length: 3 }, (_, index) => ({
  id: `${subject}-${index}`,
  subject,
  topic: `${subject} topic`,
  subtopic: "CBT fixture",
  difficulty: "medium",
  question_type: "multiple_choice",
  question: `${subject} question ${index + 1}`,
  options: ["A", "B", "C", "D"],
  answer_index: 1,
  answer_text: "B",
  explanation: "Answer: B.\nCore idea: The correct option follows the named concept.\nTopic focus: Review the concept before the next question.\nReasoning step: Match the condition to the rule.\nCheck the alternatives: The other choices do not meet the condition.\nExam takeaway: Recall the relevant rule.",
  tags: [],
  source: "Test",
})));

describe("CBT simulator", () => {
  it("builds a balanced mixed-subject mock from all four JAMB subjects", () => {
    const selected = selectQuestions(questions, "Full JAMB Mock", "cbt", 8, []);
    expect(selected).toHaveLength(8);
    expect(Object.fromEntries(subjects.map((subject) => [subject, selected.filter((question) => question.subject === subject).length]))).toEqual({
      "Use of English": 2,
      Biology: 2,
      Chemistry: 2,
      Physics: 2,
    });
  });

  it("builds the diagnostic baseline with five questions from each study subject", () => {
    const diagnosticPool = subjects.flatMap((subject) => Array.from({ length: 5 }, (_, index) => ({ ...questions.find((question) => question.subject === subject)!, id: `diagnostic-${subject}-${index}` })));
    const selected = selectQuestions(diagnosticPool, "Full JAMB Mock", "sprint", 20, []);
    expect(selected).toHaveLength(20);
    expect(Object.fromEntries(subjects.map((subject) => [subject, selected.filter((question) => question.subject === subject).length]))).toEqual({
      "Use of English": 5,
      Biology: 5,
      Chemistry: 5,
      Physics: 5,
    });
  });

  it("uses the standard 180-question allocation for the full JAMB mock", () => {
    const standardPool = subjects.flatMap((subject) => Array.from({ length: subject === "Use of English" ? 60 : 40 }, (_, index) => ({ ...questions.find((question) => question.subject === subject)!, id: `standard-${subject}-${index}` })));
    const selected = selectQuestions(standardPool, "Full JAMB Mock", "cbt", 180, []);
    expect(selected).toHaveLength(180);
    expect(Object.fromEntries(subjects.map((subject) => [subject, selected.filter((question) => question.subject === subject).length]))).toEqual({
      "Use of English": 60,
      Biology: 40,
      Chemistry: 40,
      Physics: 40,
    });
  });

  it("keeps the standard full CBT distinct from optional Lekki novel questions", () => {
    const standardPool = subjects.flatMap((subject) => Array.from({ length: subject === "Use of English" ? 60 : 40 }, (_, index) => ({ ...questions.find((question) => question.subject === subject)!, id: `standard-excluding-lekki-${subject}-${index}` })));
    const lekkiQuestions = Array.from({ length: 20 }, (_, index) => ({ ...questions[0], id: `lekki-full-mock-${index}`, subject: "Use of English" as const, topic: "The Lekki Headmaster · Chapter 1: Dusk" }));
    const selected = selectQuestions([...standardPool, ...lekkiQuestions], "Full JAMB Mock", "cbt", 180, []);

    expect(selected).toHaveLength(180);
    expect(selected.every((question) => !question.topic.startsWith("The Lekki Headmaster"))).toBe(true);
  });

  it("renders a full-mock navigator with local subject numbering, per-subject progress, and accessible palette states", () => {
    const html = renderToStaticMarkup(React.createElement(QuestionLedger, {
      questions,
      currentIndex: 3,
      answers: { [questions[3].id]: { selectedIndex: 1, correct: true, timedOut: false } },
      cbtMode: true,
      fullMock: true,
      flaggedIds: [questions[4].id],
      onNavigate: vi.fn(),
    }));
    expect(html).toContain("Biology palette");
    expect(html).toContain("Biology, question 1: current");
    expect(html).toContain("Biology, question 2: flagged, unanswered");
    expect(html).toContain("English");
    expect(html).toContain("0/3");
  });

  it("selects only the requested topic or saved question IDs for focused revision without changing full-mock rules", () => {
    const biology = questions.filter((question) => question.subject === "Biology");
    const byTopic = selectQuestions(questions, "Biology", "sprint", 10, [], { topic: "Biology topic" });
    const byBookmark = selectQuestions(questions, "Biology", "sprint", 10, [], { questionIds: [biology[1].id] });
    const unavailableTopic = selectQuestions(questions, "Biology", "sprint", 10, [], { topic: "Unavailable topic" });
    const unavailableBookmark = selectQuestions(questions, "Biology", "sprint", 10, [], { questionIds: ["missing-question"] });
    expect(byTopic).toHaveLength(biology.length);
    expect(byTopic.every((question) => question.topic === "Biology topic")).toBe(true);
    expect(byBookmark.map((question) => question.id)).toEqual([biology[1].id]);
    expect(unavailableTopic).toEqual([]);
    expect(unavailableBookmark).toEqual([]);
  });

  it("opens only the exact missed questions from a Progress log and never substitutes a normal subject set", () => {
    const exactMisses = [questions.find((question) => question.subject === "Biology")!.id, questions.find((question) => question.subject === "Physics")!.id];
    const selected = selectQuestions(questions, "Full JAMB Mock", "review", 10, [], { questionIds: exactMisses });
    const emptyReview = selectQuestions(questions, "Biology", "review", 10, []);
    expect(selected.map((question) => question.id).sort()).toEqual([...exactMisses].sort());
    expect(emptyReview).toEqual([]);
  });

  it("compares the two latest CBT logs and recommends the balanced core subject rather than claiming a score prediction", () => {
    const comparison = buildExamComparison([
      { id: 2, mode: "cbt", questionCount: 40, correctCount: 30, durationSeconds: 1800, flaggedCount: 2, completedAt: new Date("2026-08-14T11:00:00Z") },
      { id: 1, mode: "cbt", questionCount: 40, correctCount: 25, durationSeconds: 1900, flaggedCount: 5, completedAt: new Date("2026-08-13T11:00:00Z") },
    ], { subject: "Physics", attempts: 30, accuracy: 70 });
    expect(comparison.latest?.accuracy).toBe(75);
    expect(comparison.previous?.accuracy).toBe(63);
    expect(comparison.accuracyChange).toBe(12);
    expect(comparison.recommendation).toContain("Physics");
  });

  it("renders a full marked answer review with the learner answer, correction, and explanation", () => {
    const html = renderToStaticMarkup(React.createElement(ExamReview, {
      config: { subject: "Full JAMB Mock", mode: "cbt", count: 8 },
      questions: questions.slice(0, 2),
      answers: {
        [questions[0].id]: { selectedIndex: 1, correct: true, timedOut: false },
        [questions[1].id]: { selectedIndex: 0, correct: false, timedOut: false },
      },
      flaggedIds: [questions[1].id],
      onFinalize: vi.fn(),
      onHome: vi.fn(),
    }));
    expect(html).toContain("CBT EXAM REVIEW");
    expect(html).toContain("Your answer:");
    expect(html).toContain("Correct answer:");
    expect(html).toContain("Save exam log");
    expect((html.match(/class="explanation-block"/g) ?? []).length).toBe(2);
  });
});
