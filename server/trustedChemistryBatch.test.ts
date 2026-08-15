import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { QuestionCard } from "../client/src/components/QuestionCard";
import type { BankQuestion } from "../client/src/game/types";

type ChemistryRecord = { subject: "Chemistry"; question: string; options: string[]; answerIndex: number; explanation?: string };
const partOne = JSON.parse(readFileSync("/home/ubuntu/jamb-import-staging/chemistry_past_questions_aug15_2026.validated.json", "utf8")) as ChemistryRecord[];
const partTwo = JSON.parse(readFileSync("/home/ubuntu/jamb-import-staging/chemistry_past_questions_aug15_part2_25_50.validated.json", "utf8")) as ChemistryRecord[];
const uniqueByQuestion = new Map<string, ChemistryRecord>();
for (const record of [...partOne, ...partTwo]) uniqueByQuestion.set(record.question, record);

describe("trusted Chemistry batch", () => {
  it("contains 50 unique, structurally playable questions after the supplied overlap is removed", () => {
    expect(partOne).toHaveLength(27);
    expect(partTwo).toHaveLength(26);
    expect(uniqueByQuestion.size).toBe(50);
    for (const record of uniqueByQuestion.values()) {
      expect(record.subject).toBe("Chemistry");
      expect(record.options).toHaveLength(4);
      expect(record.answerIndex).toBeGreaterThanOrEqual(0);
      expect(record.answerIndex).toBeLessThan(4);
      expect(record.explanation?.trim().length).toBeGreaterThan(0);
    }
  });

  it("renders a supplied Chemistry explanation without exposing internal source labels", () => {
    const source = uniqueByQuestion.get("What is the pH of a 0.01 mol/dm3 solution of hydrochloric acid (HCl)?");
    expect(source).toBeDefined();
    const question: BankQuestion = {
      id: "trusted-chemistry-25",
      subject: "Chemistry",
      topic: "pH Calculations",
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
    expect(html).toContain("Hydrochloric acid (HCl) is a strong monobasic acid");
    expect(html).toContain("pH Calculations");
    expect(html).not.toContain("Trusted owner batch");
  });
});
