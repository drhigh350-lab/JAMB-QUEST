import { chromium } from "@playwright/test";

const baseUrl = process.env.JAMB_QUEST_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--disable-service-worker"] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.route("**/sw.js*", (route) => route.abort());
  await page.goto(`${baseUrl}/?e2eCbtFixture=1`, { waitUntil: "commit", timeout: 30_000 });
  await page.locator(".quiz-layout").waitFor({ state: "visible", timeout: 30_000 });
  await page.getByRole("radio").first().click({ force: true });
  await page.getByRole("button", { name: /save & next/i }).click({ force: true });
  await page.getByRole("button", { name: /flag for review/i }).click({ force: true });
  await page.getByRole("button", { name: /finish & review/i }).click({ force: true });
  await page.getByRole("alertdialog").waitFor({ state: "visible", timeout: 10_000 });
  await page.getByRole("button", { name: /review my answers/i }).click({ force: true });
  await page.locator(".exam-review").waitFor({ state: "visible", timeout: 10_000 });
  const metrics = await page.evaluate(() => ({ reviewItems: document.querySelectorAll(".exam-review-item").length, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, hasFlag: Boolean(document.querySelector(".ledger-flagged")) }));
  if (metrics.reviewItems !== 4 || metrics.overflow > 1) throw new Error(`CBT review fixture failed: ${JSON.stringify(metrics)}`);
  await page.getByRole("button", { name: /save exam log/i }).click({ force: true });
  await page.locator('[data-e2e="cbt-logged"]').waitFor({ state: "visible", timeout: 10_000 });
  console.log(JSON.stringify({ verified: true, ...metrics }, null, 2));
} finally {
  await browser.close();
}
