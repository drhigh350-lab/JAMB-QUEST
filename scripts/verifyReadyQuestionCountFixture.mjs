import { chromium } from "@playwright/test";

const baseUrl = process.env.JAMB_QUEST_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--disable-service-worker"] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.route("**/sw.js*", (route) => route.abort());
  await page.goto(`${baseUrl}/?e2eReadyQuestionCountFixture=1`, { waitUntil: "commit", timeout: 30_000 });
  const count = page.locator('[data-testid="ready-question-count"]');
  await count.waitFor({ state: "visible", timeout: 30_000 });
  await page.waitForFunction(() => document.querySelector('[data-testid="ready-question-count"]')?.getAttribute("data-ready") === "true", undefined, { timeout: 10_000 });
  const text = (await count.innerText()).trim();
  if (text.toLowerCase() !== "1,975 questions ready") throw new Error(`Expected settled 1,975-question label; got "${text}".`);
  console.log(JSON.stringify({ verified: true, settled: true, text }, null, 2));
} finally {
  await browser.close();
}
