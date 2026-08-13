import { chromium } from "@playwright/test";

const baseUrl = process.env.JAMB_QUEST_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--disable-service-worker"] });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, serviceWorkers: "block" });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/?e2eRealGameCbtFixture=1`, { waitUntil: "commit", timeout: 30_000 });
  await page.locator(".quiz-layout").waitFor({ state: "visible", timeout: 30_000 });
  await page.getByRole("button", { name: /pause exam/i }).click({ force: true });
  const pausedTimer = await page.locator(".timer-block span").innerText();
  await page.waitForTimeout(1_200);
  if (await page.locator(".timer-block span").innerText() !== pausedTimer) throw new Error("The real useQuizGame CBT timer changed while paused.");
  await page.getByRole("button", { name: /resume exam/i }).click({ force: true });
  await page.waitForTimeout(1_200);
  if (await page.locator(".timer-block span").innerText() === pausedTimer) throw new Error("The real useQuizGame CBT timer did not resume.");
  await page.getByRole("radio").first().click({ force: true });
  await page.getByRole("button", { name: /save & next/i }).click({ force: true });
  await page.getByRole("button", { name: /question 1/i }).click({ force: true });
  if (!(await page.getByRole("radio").first().isChecked())) throw new Error("The real useQuizGame CBT answer did not survive navigation.");
  console.log(JSON.stringify({ verified: true, controller: "useQuizGame", timerFrozen: true, timerResumed: true, savedAnswerRetained: true }, null, 2));
} finally {
  await browser.close();
}
