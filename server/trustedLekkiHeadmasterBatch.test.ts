import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { QuestionCard } from "../client/src/components/QuestionCard";
import type { BankQuestion } from "../client/src/game/types";

type LekkiRecord = { externalId: string; subject: "Use of English"; topic: "The Lekki Headmaster"; question: string; options: string[]; answerIndex: number; explanation?: string };
const payload = JSON.parse(readFileSync("/home/ubuntu/jamb-import-staging/lekki-headmaster-120-keyed-staging.json", "utf8")) as { questions: LekkiRecord[] };

describe("owner-confirmed Lekki Headmaster direct batch", () => {
  it("contains 109 structurally playable keyed novel questions without requiring explanations", () => {
    expect(payload.questions).toHaveLength(109);
    expect(payload.questions.some((record) => record.question.includes("morning assembly at Stardom"))).toBe(true);
    for (const record of payload.questions) {
      expect(record.subject).toBe("Use of English");
      expect(record.topic).toBe("The Lekki Headmaster");
      expect(record.question.trim().length).toBeGreaterThan(7);
      expect(record.options).toHaveLength(4);
      expect(record.answerIndex).toBeGreaterThanOrEqual(0);
      expect(record.answerIndex).toBeLessThan(4);
    }
  });

  it("renders a keyed novel question in the normal learner card without a source-package or verification-pending label", () => {
    const source = payload.questions[0]!;
    const question: BankQuestion = {
      id: source.externalId,
      subject: source.subject,
      topic: source.topic,
      subtopic: "",
      difficulty: "medium",
      question_type: "multiple_choice",
      question: source.question,
      options: source.options,
      answer_index: source.answerIndex,
      answer_text: source.options[source.answerIndex]!,
      explanation: "",
      tags: [],
      source: "internal",
    };
    const html = renderToStaticMarkup(React.createElement(QuestionCard, { question, index: 0, total: 20, selectedIndex: source.answerIndex, answered: true, answer: { selectedIndex: source.answerIndex, correct: true, timedOut: false }, onSelect: vi.fn(), onSubmit: vi.fn(), onNext: vi.fn() }));
    expect(html).toContain("morning assembly at Stardom");
    expect(html).toContain("The Lekki Headmaster");
    expect(html).not.toContain("Verification pending");
    expect(html).not.toContain("Owner-confirmed curated question batch");
  });
});
