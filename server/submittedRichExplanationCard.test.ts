import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { QuestionCard } from "../client/src/components/QuestionCard";
import type { BankQuestion } from "../client/src/game/types";

const submitted = JSON.parse(readFileSync("/home/ubuntu/jamb-import-staging/submitted_rich_questions.ready.json", "utf8")) as Array<{ externalId: string; subject: "Chemistry"; topic: string; question: string; options: string[]; answerIndex: number; explanation: string }>;
const sourceQuestion = submitted.find((record) => record.externalId === "chem-part1-md-Chemistry-1");
if (!sourceQuestion) throw new Error("Submitted rich Chemistry sample is required for this test");

describe("submitted rich-question card", () => {
  it("renders the supplied explanation as one preserved natural paragraph without generic fallback or source labels", () => {
    const question: BankQuestion = {
      id: sourceQuestion.externalId,
      subject: sourceQuestion.subject,
      topic: sourceQuestion.topic,
      subtopic: "",
      difficulty: "medium",
      question_type: "multiple_choice",
      question: sourceQuestion.question,
      options: sourceQuestion.options,
      answer_index: sourceQuestion.answerIndex,
      answer_text: sourceQuestion.options[sourceQuestion.answerIndex],
      explanation: sourceQuestion.explanation,
      tags: [],
      source: "internal",
    };
    const html = renderToStaticMarkup(React.createElement(QuestionCard, { question, index: 0, total: 10, selectedIndex: sourceQuestion.answerIndex, answered: true, answer: { selectedIndex: sourceQuestion.answerIndex, correct: true, timedOut: false }, onSelect: vi.fn(), onSubmit: vi.fn(), onNext: vi.fn() }));
    const explanationBlock = html.match(/class="explanation-block"[^>]*>[\s\S]*?<\/div>/)?.[0] ?? "";
    expect((explanationBlock.match(/<p>/g) ?? [])).toHaveLength(1);
    expect(explanationBlock).toContain("Destructive distillation");
    expect(explanationBlock).toContain("blast furnace");
    expect(explanationBlock).not.toContain("Reasoning step:");
    expect(html).not.toContain("Owner-provided Markdown");
    expect(html).not.toContain("Verification Pending");
  });

  it("preserves multiple authentic paragraph boundaries in the rendered learner card", () => {
    const multiParagraphExplanation = "Glucose is fermented by yeast without oxygen, producing ethanol and carbon dioxide.\n\nThat reaction identifies glucose rather than a mineral salt or another simple organic compound.";
    const question: BankQuestion = {
      id: sourceQuestion.externalId,
      subject: sourceQuestion.subject,
      topic: sourceQuestion.topic,
      subtopic: "",
      difficulty: "medium",
      question_type: "multiple_choice",
      question: sourceQuestion.question,
      options: sourceQuestion.options,
      answer_index: sourceQuestion.answerIndex,
      answer_text: sourceQuestion.options[sourceQuestion.answerIndex],
      explanation: multiParagraphExplanation,
      tags: [],
      source: "internal",
    };
    const html = renderToStaticMarkup(React.createElement(QuestionCard, { question, index: 0, total: 10, selectedIndex: sourceQuestion.answerIndex, answered: true, answer: { selectedIndex: sourceQuestion.answerIndex, correct: true, timedOut: false }, onSelect: vi.fn(), onSubmit: vi.fn(), onNext: vi.fn() }));
    const explanationBlock = html.match(/class="explanation-block"[^>]*>[\s\S]*?<\/div>/)?.[0] ?? "";
    expect((explanationBlock.match(/<p>/g) ?? [])).toHaveLength(2);
    expect(explanationBlock).toContain("Glucose is fermented by yeast without oxygen");
    expect(explanationBlock).toContain("That reaction identifies glucose");
  });
});
