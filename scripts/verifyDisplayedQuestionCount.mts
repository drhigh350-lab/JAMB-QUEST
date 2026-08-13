import { chromium } from "@playwright/test";
import { sql } from "drizzle-orm";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";

const baseUrl = process.env.JAMB_QUEST_URL ?? "http://127.0.0.1:3000";
const db = await getDb();
if (!db) throw new Error("Managed database is unavailable");
const [{ importedCount }] = await db.select({ importedCount: sql<number>`count(*)` }).from(questionItems);
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
await page.waitForTimeout(1_500);
const modelCount = await page.evaluate(async () => {
  const response = await fetch("/manus-storage/jamb_high_yield_practice_bank_1000_e93a7fa1.json");
  if (!response.ok) throw new Error(`Model bank fetch failed: ${response.status}`);
  const payload = await response.json() as { questions?: unknown[] };
  return Array.isArray(payload.questions) ? payload.questions.length : 0;
});
const expectedCount = modelCount + Number(importedCount);
const body = await page.locator("body").innerText();
const renderedCount = body.match(/([0-9,]+) questions ready/i)?.[1];
if (!renderedCount || Number(renderedCount.replaceAll(",", "")) !== expectedCount) throw new Error(`Rendered count ${renderedCount ?? "missing"} does not match model ${modelCount} + imported ${importedCount} = ${expectedCount}`);
const fixedTabs = await page.getByRole("button", { name: "Practice" }).count();
if (!fixedTabs) throw new Error("Practice tab is not present in the rendered app shell");
console.log(JSON.stringify({ verified: true, baseUrl, modelCount, importedCount: Number(importedCount), expectedDisplayedQuestionCount: expectedCount, renderedCount: Number(renderedCount.replaceAll(",", "")), practiceTabPresent: true }, null, 2));
await browser.close();
process.exit(0);
