import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { QuizShell } from "../client/src/components/QuizShell";
import type { BankQuestion, RoundConfig } from "../client/src/game/types";

vi.mock("../client/src/components/QuestionCard", () => ({ QuestionCard: () => null }));
vi.mock("../client/src/components/QuestionLedger", () => ({ QuestionLedger: () => null }));

const question: BankQuestion = { id: "calc-question", subject: "Physics", topic: "Motion", subtopic: "", difficulty: "medium", question_type: "multiple_choice", question: "A body moves at a constant speed. Which quantity is zero?", options: ["Velocity", "Acceleration", "Distance", "Time"], answer_index: 1, answer_text: "Acceleration", explanation: "A constant velocity has zero acceleration because neither speed nor direction changes.", tags: [], source: "internal" };
const baseProps = { questions: [question], currentIndex: 0, currentQuestion: question, selectedIndex: null, answered: false, secondsLeft: 60, streak: 0, answers: {}, onSelect: vi.fn(), onSubmit: vi.fn(), onNext: vi.fn(), onQuit: vi.fn() };

describe("calculator availability in quiz workspace", () => {
  it.each<RoundConfig>([{ subject: "Physics", mode: "sprint", count: 1 }, { subject: "Physics", mode: "cbt", count: 40, durationSeconds: 3600 }])("renders the calculator trigger in $mode mode", (config) => {
    const html = renderToStaticMarkup(React.createElement(QuizShell, { ...baseProps, config }));
    expect(html).toContain('aria-label="Open JAMB calculator"');
  });
});
