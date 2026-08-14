import { chromium } from "@playwright/test";

const baseUrl = process.env.JAMB_QUEST_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--disable-service-worker"] });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/?e2eRealGameCbtFixture=1`, { waitUntil: "commit", timeout: 30_000 });
  await page.locator(".quiz-layout").waitFor({ state: "visible", timeout: 30_000 });
  await page.getByRole("radio").first().click({ force: true });
  await page.getByRole("button", { name: /save & next/i }).click({ force: true });
  await page.getByRole("button", { name: /flag for review/i }).click({ force: true });
  const timerBefore = await page.locator(".timer-block span").innerText();
  await page.getByRole("button", { name: "Open JAMB calculator" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "2", exact: true }).click();
  await dialog.getByRole("button", { name: "×", exact: true }).click();
  await dialog.getByRole("button", { name: "5", exact: true }).click();
  await dialog.getByRole("button", { name: "Calculate" }).click();
  if (await dialog.locator("output").innerText() !== "10") throw new Error("Calculator did not work during the CBT exam.");
  await page.waitForTimeout(1_200);
  if (await page.locator(".timer-block span").innerText() === timerBefore) throw new Error("CBT timer stopped while the calculator was open.");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /unflag question/i }).waitFor({ state: "visible" });
  await page.getByRole("button", { name: /question 1/i }).click({ force: true });
  if (!(await page.getByRole("radio").first().isChecked())) throw new Error("Saved CBT answer did not survive calculator use and navigator return.");
  console.log(JSON.stringify({ verified: true, realController: "useQuizGame", calculatorWorked: true, timerContinued: true, flagRetained: true, savedAnswerRetained: true, navigatorRetained: true }, null, 2));
} finally {
  await browser.close();
}
