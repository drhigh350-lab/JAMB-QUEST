import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { QuestionCard } from "../client/src/components/QuestionCard";
import type { BankQuestion } from "../client/src/game/types";

type BiologyRecord = { subject: "Biology"; question: string; options: string[]; answerIndex: number; explanation?: string };
const parts = [
  "biology_past_questions_aug15_part1_1_25.validated.json",
  "biology_past_questions_aug15_part2_26_50.validated.json",
  "biology_past_questions_aug15_part3_51_75.validated.json",
  "biology_past_questions_aug15_part4_76_100.validated.json",
].flatMap((file) => JSON.parse(readFileSync(`/home/ubuntu/jamb-import-staging/${file}`, "utf8")) as BiologyRecord[]);

describe("trusted Biology questions 1–100", () => {
  it("contains 100 structurally playable owner-approved Biology questions", () => {
    expect(parts).toHaveLength(100);
    for (const record of parts) {
      expect(record.subject).toBe("Biology");
      expect(record.options).toHaveLength(4);
      expect(record.answerIndex).toBeGreaterThanOrEqual(0);
      expect(record.answerIndex).toBeLessThan(4);
      expect(record.explanation?.trim().length).toBeGreaterThan(0);
    }
  });

  it("renders a supplied Biology explanation without source-package labels", () => {
    const source = parts.find((record) => record.question === "Which of the following organelles is responsible for cellular respiration and energy production in eukaryotic cells?");
    expect(source).toBeDefined();
    const question: BankQuestion = {
      id: "trusted-biology-1",
      subject: "Biology",
      topic: "Living Organisms and Cell Structure",
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
    expect(html).toContain("Mitochondria are double-membrane-bound organelles");
    expect(html).toContain("Living Organisms and Cell Structure");
    expect(html).not.toContain("Trusted owner batch");
  });
});
