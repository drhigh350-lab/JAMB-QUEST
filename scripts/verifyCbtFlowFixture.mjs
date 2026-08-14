import { chromium } from "@playwright/test";

const baseUrl = process.env.JAMB_QUEST_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--disable-service-worker"] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.route("**/sw.js*", (route) => route.abort());
  await page.goto(`${baseUrl}/?e2eCbtFixture=1`, { waitUntil: "commit", timeout: 30_000 });
  await page.locator(".quiz-layout").waitFor({ state: "visible", timeout: 30_000 });
  await page.getByRole("button", { name: /pause exam/i }).click({ force: true });
  const pausedTimer = await page.locator(".timer-block span").innerText();
  await page.waitForTimeout(1_200);
  if (await page.locator(".timer-block span").innerText() !== pausedTimer) throw new Error("CBT timer changed while the exam was paused.");
  await page.getByRole("button", { name: /resume exam/i }).click({ force: true });
  await page.waitForTimeout(1_200);
  if (await page.locator(".timer-block span").innerText() === pausedTimer) throw new Error("CBT timer did not resume after the learner resumed the exam.");
  await page.keyboard.press("a");
  if (!(await page.getByRole("radio").first().isChecked())) throw new Error("A did not select the first JAMB answer option.");
  await page.keyboard.press("n");
  if (!(await page.locator(".question-meta").innerText()).includes("02")) throw new Error("N did not move to the next CBT question.");
  await page.keyboard.press("p");
  if (!(await page.locator(".question-meta").innerText()).includes("01")) throw new Error("P did not return to the previous CBT question.");
  if (!(await page.getByRole("radio").first().isChecked())) throw new Error("Saved CBT answer was lost after navigating away and back.");
  await page.keyboard.press("s");
  await page.getByRole("alertdialog").waitFor({ state: "visible", timeout: 10_000 });
  await page.keyboard.press("r");
  await page.getByRole("alertdialog").waitFor({ state: "hidden", timeout: 10_000 });
  await page.keyboard.press("s");
  await page.getByRole("button", { name: /review unanswered/i }).click({ force: true });
  if (!(await page.locator(".question-meta").innerText()).includes("02")) throw new Error("Review unanswered did not navigate to the first unanswered question.");
  await page.getByRole("button", { name: /flag for review/i }).click({ force: true });
  await page.keyboard.press("s");
  await page.getByRole("button", { name: /review flagged/i }).click({ force: true });
  if (!(await page.locator(".question-meta").innerText()).includes("02")) throw new Error("Review flagged did not navigate to the first flagged question.");
  await page.keyboard.press("s");
  await page.getByRole("alertdialog").waitFor({ state: "visible", timeout: 10_000 });
  await page.keyboard.press("y");
  await page.locator(".exam-review").waitFor({ state: "visible", timeout: 10_000 });
  const metrics = await page.evaluate(() => ({ reviewItems: document.querySelectorAll(".exam-review-item").length, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, hasFlag: Boolean(document.querySelector(".ledger-flagged")) }));
  if (metrics.reviewItems !== 4 || metrics.overflow > 1) throw new Error(`CBT review fixture failed: ${JSON.stringify(metrics)}`);
  await page.getByRole("button", { name: /save exam log/i }).click({ force: true });
  await page.locator('[data-e2e="cbt-logged"]').waitFor({ state: "visible", timeout: 10_000 });
  console.log(JSON.stringify({ verified: true, keyboardAnswer: true, keyboardNavigation: true, keyboardSubmitReturnConfirm: true, reviewUnanswered: true, reviewFlagged: true, ...metrics }, null, 2));
} finally {
  await browser.close();
}
