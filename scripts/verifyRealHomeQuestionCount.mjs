import { chromium } from "@playwright/test";

const baseUrl = process.env.JAMB_QUEST_URL;
if (!baseUrl) throw new Error("Set JAMB_QUEST_URL to the running development-preview URL for the real Home count verification.");
const expected = Number(process.env.JAMB_EXPECTED_READY_COUNT ?? 1975);
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--disable-service-worker"] });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, serviceWorkers: "block" });
  const page = await context.newPage();
  await page.route("**/sw.js*", (route) => route.abort());
  await page.goto(`${baseUrl.replace(/\/$/, "")}/?e2eRealCountProbe=1`, { waitUntil: "commit", timeout: 30_000 });
  const count = page.locator('[data-testid="ready-question-count"]');
  await count.waitFor({ state: "visible", timeout: 30_000 });
  await page.waitForFunction(() => document.querySelector('[data-testid="ready-question-count"]')?.getAttribute("data-ready") === "true", undefined, { timeout: 30_000 });
  const status = (await count.innerText()).trim().toLowerCase();
  const pageText = (await page.locator("main").innerText()).toLowerCase();
  const expectedPracticeText = `${expected.toLocaleString()} practice questions`;
  if (status !== "jamb quest ready") throw new Error(`Expected the settled JAMB Quest status, received "${status}".`);
  if (!pageText.includes(expectedPracticeText)) throw new Error(`Expected supporting practice total ${expected.toLocaleString()}, but it was not rendered in the Home launch copy.`);
  console.log(JSON.stringify({ verified: true, expected, status, supportingCount: expectedPracticeText, settled: true, source: "real Home flow public authorised-question query" }, null, 2));
} finally {
  await browser.close();
}
