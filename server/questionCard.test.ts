import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { QuestionCard } from "../client/src/components/QuestionCard";
import type { BankQuestion, QuestionBankPayload } from "../client/src/game/types";

const pilotBank = JSON.parse(readFileSync("/home/ubuntu/jamb_question_bank/jamb_high_yield_practice_bank_1000_biology_batches_1_5.json", "utf8")) as QuestionBankPayload;
const biologyPilot = pilotBank.questions.find((question) => question.id === "BIO-101") as BankQuestion | undefined;

if (!biologyPilot) throw new Error("BIO-101 is missing from the combined Biology batches-1-to-5 asset");

describe("uniform Biology question card", () => {
  it("renders the real pilot asset with topic-only context and a preserved enriched explanation paragraph", () => {
    const element = React.createElement(QuestionCard, { question: biologyPilot, index: 0, total: 10, selectedIndex: 2, answered: true, answer: { selectedIndex: 2, correct: true, timedOut: false }, onSelect: vi.fn(), onSubmit: vi.fn(), onNext: vi.fn() });
    const html = renderToStaticMarkup(element);
    expect(html).toContain("Topic: Form and functions");
    expect(html).not.toContain("OWNER-PROVIDED");
    expect(html).not.toContain("difficulty-medium");
    expect((html.match(/class=\"explanation-block\"/g) ?? []).length).toBe(1);
    expect((html.match(/class=\"explanation-block\"[^>]*>[\s\S]*?<\/div>/)?.[0].match(/<p>/g) ?? []).length).toBe(1);
    expect(html).toContain("lignified conduits");
  });

  it("renders a fifth E option and can mark it correct", () => {
    const fiveOptionQuestion: BankQuestion = { ...biologyPilot, id: "BIO-FIVE-OPTION", options: [...biologyPilot.options, "A fifth legitimate choice"], answer_index: 4, answer_text: "A fifth legitimate choice" };
    const html = renderToStaticMarkup(React.createElement(QuestionCard, { question: fiveOptionQuestion, index: 0, total: 10, selectedIndex: 4, answered: true, answer: { selectedIndex: 4, correct: true, timedOut: false }, onSelect: vi.fn(), onSubmit: vi.fn(), onNext: vi.fn() }));
    expect(html).toContain('class="option-letter">E</span>');
    expect(html).toContain("A fifth legitimate choice");
    expect(html).toContain("option-correct");
  });

  it("renders a deployed black-and-white instructional diagram with learner-facing context instead of treating it as an answer option", () => {
    const diagramQuestion: BankQuestion = { ...biologyPilot, id: "PHY-INTERNAL-RESISTANCE", diagram_url: "/manus-storage/jamb-quest-internal-resistance_15a18ace.svg" };
    const html = renderToStaticMarkup(React.createElement(QuestionCard, { question: diagramQuestion, index: 0, total: 10, selectedIndex: null, answered: false, onSelect: vi.fn(), onSubmit: vi.fn(), onNext: vi.fn() }));
    expect(html).toContain("question-diagram");
    expect(html).toContain("jamb-quest-internal-resistance_15a18ace.svg");
    expect(html).toContain("Black-and-white instructional diagram for this question");
    expect(html).toContain("Use the diagram with the question stem before choosing an answer.");
  });

  it("renders SVG, original crop, wide graph, and portrait diagram URLs while omitting the figure for a held/no-diagram fallback", () => {
    const diagramUrls = [
      "/manus-storage/jamb-quest-potometer_0ff84706.svg",
      "/manus-storage/owner-phy-diagram-2026-008-source-panel_acaa185f.png",
      "/manus-storage/chemistry-energy-profile-original_3e1f7670.png",
      "/manus-storage/jamb-quest-biology-digestive-system_e222260a.png",
    ];
    for (const [index, diagram_url] of diagramUrls.entries()) {
      const question: BankQuestion = { ...biologyPilot, id: `DIAGRAM-SHAPE-${index}`, diagram_url };
      const html = renderToStaticMarkup(React.createElement(QuestionCard, { question, index: 0, total: 1, selectedIndex: null, answered: false, onSelect: vi.fn(), onSubmit: vi.fn(), onNext: vi.fn() }));
      expect(html).toContain("question-diagram");
      expect(html).toContain(diagram_url);
      expect(html).toContain("Use the diagram with the question stem before choosing an answer.");
    }
    const noDiagramQuestion: BankQuestion = { ...biologyPilot, id: "DIAGRAM-NONE", diagram_url: undefined };
    const noDiagramHtml = renderToStaticMarkup(React.createElement(QuestionCard, { question: noDiagramQuestion, index: 0, total: 1, selectedIndex: null, answered: false, onSelect: vi.fn(), onSubmit: vi.fn(), onNext: vi.fn() }));
    expect(noDiagramHtml).not.toContain("question-diagram");
    expect(noDiagramHtml).not.toContain("Use the diagram with the question stem before choosing an answer.");
  });
});
