import { chromium } from "@playwright/test";

const baseUrl = process.env.JAMB_QUEST_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
await page.waitForTimeout(1_500);
const body = await page.locator("body").innerText();
if (!body.includes("2,224 QUESTIONS READY")) throw new Error(`Expected reconciled count in rendered app, got: ${body.match(/[0-9,]+ QUESTIONS READY/g)?.join(", ") ?? "no question count"}`);
const fixedTabs = await page.locator("text=Practice").count();
if (!fixedTabs) throw new Error("Practice tab is not present in the rendered app shell");
console.log(JSON.stringify({ verified: true, baseUrl, displayedQuestionCount: 2224, practiceTabPresent: true }, null, 2));
await browser.close();
