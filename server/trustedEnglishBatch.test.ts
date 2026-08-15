import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { QuestionCard } from "../client/src/components/QuestionCard";
import type { BankQuestion } from "../client/src/game/types";

type EnglishRecord = { subject: "Use of English"; question: string; options: string[]; answerIndex: number; explanation?: string };
const parts = [
  "english_past_questions_aug15_part1_1_25.validated.json",
  "english_past_questions_aug15_part2_26_50.validated.json",
  "english_past_questions_aug15_part3_51_75.validated.json",
  "english_past_questions_aug15_part4_76_100.validated.json",
].flatMap((file) => JSON.parse(readFileSync(`/home/ubuntu/jamb-import-staging/${file}`, "utf8")) as EnglishRecord[]);

describe("trusted Use of English questions 1–100", () => {
  it("contains all 100 structurally playable owner-approved English questions, including wrapped-option items", () => {
    expect(parts).toHaveLength(100);
    expect(parts.find((record) => record.question.startsWith("Statement: Janet bought a RED car"))?.options).toHaveLength(4);
    expect(parts.find((record) => record.question.startsWith('"The engineers built the bridge'))?.options).toHaveLength(4);
    for (const record of parts) {
      expect(record.subject).toBe("Use of English");
      expect(record.options).toHaveLength(4);
      expect(record.answerIndex).toBeGreaterThanOrEqual(0);
      expect(record.answerIndex).toBeLessThan(4);
      expect(record.explanation?.trim().length).toBeGreaterThan(0);
    }
  });

  it("renders a supplied Use of English explanation without source-package labels", () => {
    const source = parts.find((record) => record.question === "The manager was adamant that the project deadline must be met despite the technical difficulties.");
    expect(source).toBeDefined();
    const question: BankQuestion = {
      id: "trusted-english-1",
      subject: "Use of English",
      topic: "Lexis and Structure",
      subtopic: "",
      difficulty: "medium",
      question_type: "multiple_choice",
      question: source!.question,
      options: source!.options,
      answer_index: source!.answerIndex,
      answer_text: source!.options[source!.answerIndex],
      explanation: source!.explanation ?? "",
      tags: [],
      source: "internal",
    };
    const html = renderToStaticMarkup(React.createElement(QuestionCard, { question, index: 0, total: 20, selectedIndex: source!.answerIndex, answered: true, answer: { selectedIndex: source!.answerIndex, correct: true, timedOut: false }, onSelect: vi.fn(), onSubmit: vi.fn(), onNext: vi.fn() }));
    expect(html).toContain('The word &quot;adamant&quot; means refusing to be persuaded');
    expect(html).toContain("Lexis and Structure");
    expect(html).not.toContain("Trusted owner batch");
  });
});
