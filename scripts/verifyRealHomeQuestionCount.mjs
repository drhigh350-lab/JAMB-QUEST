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
  const text = (await count.innerText()).trim().toLowerCase();
  if (text !== `${expected.toLocaleString()} questions ready`) throw new Error(`Expected real settled count ${expected.toLocaleString()}, received "${text}".`);
  console.log(JSON.stringify({ verified: true, expected, text, settled: true, source: "real Home flow public authorised-question query" }, null, 2));
} finally {
  await browser.close();
}
