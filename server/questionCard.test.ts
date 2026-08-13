import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { QuestionCard } from "../client/src/components/QuestionCard";
import type { BankQuestion, QuestionBankPayload } from "../client/src/game/types";

const pilotBank = JSON.parse(readFileSync("/home/ubuntu/jamb_question_bank/jamb_high_yield_practice_bank_1000_biology_pilot.json", "utf8")) as QuestionBankPayload;
const biologyPilot = pilotBank.questions.find((question) => question.id === "BIO-002") as BankQuestion | undefined;

if (!biologyPilot) throw new Error("BIO-002 is missing from the generated Biology pilot asset");

describe("uniform Biology question card", () => {
  it("renders the real pilot asset with topic-only context and six enriched explanation lines", () => {
    const element = React.createElement(QuestionCard, { question: biologyPilot, index: 0, total: 10, selectedIndex: 2, answered: true, answer: { selectedIndex: 2, correct: true, timedOut: false }, onSelect: vi.fn(), onSubmit: vi.fn(), onNext: vi.fn() });
    const html = renderToStaticMarkup(element);
    expect(html).toContain("Topic: Variety of organisms");
    expect(html).not.toContain("OWNER-PROVIDED");
    expect(html).not.toContain("difficulty-medium");
    expect((html.match(/class=\"explanation-block\"/g) ?? []).length).toBe(1);
    expect((html.match(/class=\"explanation-block\"[^>]*>[\s\S]*?<\/div>/)?.[0].match(/<p>/g) ?? []).length).toBe(6);
    expect(html).toContain("citric acid cycle");
  });
});
