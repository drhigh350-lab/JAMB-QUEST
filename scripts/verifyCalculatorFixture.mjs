import { chromium } from "@playwright/test";

const baseUrl = process.env.JAMB_QUEST_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--disable-service-worker"] });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/?e2eQuizFixture=1`, { waitUntil: "commit", timeout: 30_000 });
  await page.locator(".quiz-layout").waitFor({ state: "visible", timeout: 30_000 });
  await page.getByRole("radio").first().click({ force: true });
  await page.getByRole("button", { name: "Open JAMB calculator" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible" });
  for (const key of ["2", "+", "3", "×", "4"]) await dialog.getByRole("button", { name: key, exact: true }).click();
  await dialog.getByRole("button", { name: "Calculate" }).click();
  if (await dialog.locator("output").innerText() !== "14") throw new Error("Keypad calculation did not respect arithmetic precedence.");
  await dialog.getByRole("button", { name: "Clear calculator" }).click();
  await page.keyboard.type("8/2+1");
  await page.keyboard.press("Enter");
  if (await dialog.locator("output").innerText() !== "5") throw new Error("Keyboard calculation did not evaluate correctly.");
  await page.keyboard.press("Escape");
  if (!(await page.getByRole("radio").first().isChecked())) throw new Error("Opening the calculator lost the learner's selected answer.");
  console.log(JSON.stringify({ verified: true, keypadArithmetic: true, keyboardArithmetic: true, selectedAnswerRetained: true, viewport: "390x844" }, null, 2));
} finally {
  await browser.close();
}
