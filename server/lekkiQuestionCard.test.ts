import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { QuestionCard } from "../client/src/components/QuestionCard";
import type { BankQuestion } from "../client/src/game/types";

const staging = JSON.parse(readFileSync("/home/ubuntu/jamb_question_bank/lekki_headmaster/lekki-headmaster-canonical-staging.json", "utf8"));
const record = staging.questions[0];
const question: BankQuestion = {
  id: record.externalId,
  subject: record.subject,
  topic: record.topic,
  question: record.question,
  options: record.options,
  answer_index: record.answerIndex,
  explanation: record.explanation,
};

describe("uniform Lekki Headmaster question card", () => {
  it("keeps provenance internal and renders the shared topic-only card", () => {
    const html = renderToStaticMarkup(React.createElement(QuestionCard, { question, index: 0, total: 10, selectedIndex: 0, answered: true, answer: { selectedIndex: 0, correct: true, timedOut: false }, onSelect: vi.fn(), onSubmit: vi.fn(), onNext: vi.fn() }));
    expect(html).toContain("Topic: The Lekki Headmaster");
    expect(html).not.toContain("DailyEd");
    expect(html).not.toContain("Verification Pending");
    expect(html).not.toContain("sourceLabel");
    expect((html.match(/class=\"explanation-block\"/g) ?? []).length).toBe(1);
  });
});
