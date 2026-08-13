import React from "react";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "@playwright/test";
import { QuestionCard } from "../client/src/components/QuestionCard";
import type { BankQuestion, QuestionBankPayload } from "../client/src/game/types";

const bank = JSON.parse(await readFile("/home/ubuntu/jamb_question_bank/jamb_high_yield_practice_bank_1000_biology_batches_1_4.json", "utf8")) as QuestionBankPayload;
const question = bank.questions.find((record) => record.id === "BIO-076") as BankQuestion | undefined;
if (!question) throw new Error("BIO-076 is missing from the combined enriched Biology asset");

const cssDirectory = "/home/ubuntu/jamb-quiz-game/dist/public/assets";
const cssFile = (await readdir(cssDirectory)).find((name) => name.endsWith(".css"));
if (!cssFile) throw new Error("Production CSS bundle missing; run pnpm build first");
const css = await readFile(join(cssDirectory, cssFile), "utf8");
const markup = renderToStaticMarkup(React.createElement(QuestionCard, {
  question,
  index: 0,
  total: 10,
  selectedIndex: 0,
  answered: true,
  answer: { selectedIndex: 0, correct: true, timedOut: false },
  onSelect: () => {},
  onSubmit: () => {},
  onNext: () => {},
}));

const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const results: Array<{ viewport: string; width: number; overflow: number; explanationLines: number; topicLabels: number }> = [];
try {
  for (const viewport of [{ width: 1280, height: 720 }, { width: 375, height: 812 }]) {
    const page = await browser.newPage({ viewport });
    await page.setContent(`<!doctype html><html><head><style>${css}</style></head><body><main class="quiz-layout">${markup}</main></body></html>`, { waitUntil: "domcontentloaded" });
    const result = await page.evaluate(() => {
      const root = document.documentElement;
      const card = document.querySelector<HTMLElement>(".question-card");
      const explanationLines = document.querySelectorAll(".explanation-block p").length;
      const topicLabels = document.querySelectorAll(".question-topic-label").length;
      if (!card) throw new Error("Question card is absent");
      return { width: card.getBoundingClientRect().width, overflow: root.scrollWidth - root.clientWidth, explanationLines, topicLabels };
    });
    if (result.overflow > 1) throw new Error(`Horizontal overflow at ${viewport.width}px: ${result.overflow}px`);
    if (result.explanationLines !== 6) throw new Error(`Expected six explanation lines at ${viewport.width}px`);
    if (result.topicLabels !== 1) throw new Error(`Expected exactly one topic label at ${viewport.width}px`);
    results.push({ viewport: `${viewport.width}x${viewport.height}`, ...result });
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify({ verified: true, questionId: question.id, results }, null, 2));
