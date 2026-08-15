import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { QuestionCard } from "../client/src/components/QuestionCard";
import type { BankQuestion } from "../client/src/game/types";

type ChemistryRecord = { subject: "Chemistry"; question: string; options: string[]; answerIndex: number; explanation?: string };
const partThree = JSON.parse(readFileSync("/home/ubuntu/jamb-import-staging/chemistry_past_questions_aug15_part3_51_75.validated.json", "utf8")) as ChemistryRecord[];
const partFour = JSON.parse(readFileSync("/home/ubuntu/jamb-import-staging/chemistry_past_questions_aug15_part4_76_100.validated.json", "utf8")) as ChemistryRecord[];

describe("trusted Chemistry questions 51–100", () => {
  it("contains 50 structurally playable owner-approved Chemistry questions", () => {
    expect(partThree).toHaveLength(25);
    expect(partFour).toHaveLength(25);
    for (const record of [...partThree, ...partFour]) {
      expect(record.subject).toBe("Chemistry");
      expect(record.options).toHaveLength(4);
      expect(record.answerIndex).toBeGreaterThanOrEqual(0);
      expect(record.answerIndex).toBeLessThan(4);
      expect(record.explanation?.trim().length).toBeGreaterThan(0);
    }
  });

  it("renders a supplied Chemistry 51–100 explanation without source-package labels", () => {
    const source = partFour.find((record) => record.question === "Which gas is the most abundant noble gas in dry air by volume?");
    expect(source).toBeDefined();
    const question: BankQuestion = {
      id: "trusted-chemistry-78",
      subject: "Chemistry",
      topic: "Air and Atmospheric Chemistry",
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
    expect(html).toContain("Argon is the most abundant noble gas");
    expect(html).toContain("Air and Atmospheric Chemistry");
    expect(html).not.toContain("Trusted owner batch");
  });
});
