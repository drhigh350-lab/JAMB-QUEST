import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { QuestionCard } from "../client/src/components/QuestionCard";
import type { BankQuestion, Subject } from "../client/src/game/types";

const input = JSON.parse(readFileSync("/home/ubuntu/jamb-quiz-game/authorised-accelerated-500.input.json", "utf8")) as Array<{ id: string; subject: Subject; topic: string; question: string; options: string[]; answer_index: number }>;
const output = JSON.parse(readFileSync("/home/ubuntu/jamb-quiz-game/authorised-accelerated-500.output.json", "utf8")) as Array<{ id: string; lines: string[]; needs_review: boolean; quality_gate: boolean }>;
const approvedOutput = output.find((record) => record.quality_gate && !record.needs_review);
const sourceQuestion = input.find((record) => record.id === approvedOutput?.id);

if (!approvedOutput || !sourceQuestion) throw new Error("A quality-approved owner-provided explanation sample is required for this test");

describe("quality-approved owner-provided question card", () => {
  it("renders an authentic question with a preserved substantial explanation paragraph and no provenance leak", () => {
    const question: BankQuestion = { ...sourceQuestion, subtopic: "Owner-provided source", difficulty: "medium", question_type: "multiple_choice", answer_text: sourceQuestion.options[sourceQuestion.answer_index], explanation: approvedOutput.lines.join("\n"), tags: ["owner-provided", "verification-pending"], source: "Owner-provided source" };
    const html = renderToStaticMarkup(React.createElement(QuestionCard, { question, index: 0, total: 10, selectedIndex: sourceQuestion.answer_index, answered: true, answer: { selectedIndex: sourceQuestion.answer_index, correct: true, timedOut: false }, onSelect: vi.fn(), onSubmit: vi.fn(), onNext: vi.fn() }));
    const explanation = approvedOutput.lines.join(" ").toLowerCase();
    const answerTerms = sourceQuestion.options[sourceQuestion.answer_index].toLowerCase().match(/[a-z]{4,}/g) ?? [];
    const questionTerms = sourceQuestion.question.toLowerCase().match(/[a-z]{6,}/g) ?? [];
    expect((html.match(/class="explanation-block"[^>]*>[\s\S]*?<\/div>/)?.[0].match(/<p>/g) ?? []).length).toBe(1);
    expect(html).not.toContain("OWNER-PROVIDED");
    expect(html).not.toContain("Verification Pending");
    expect(approvedOutput.lines.join(" ").split(/\s+/).length).toBeGreaterThanOrEqual(75);
    expect(answerTerms.some((term) => explanation.includes(term))).toBe(true);
    expect(questionTerms.some((term) => explanation.includes(term))).toBe(true);
    expect(explanation).not.toMatch(/revisit|before moving to the next question|read the key wording|study harder/);
  });
});
