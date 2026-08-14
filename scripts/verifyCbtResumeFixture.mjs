import { chromium } from "@playwright/test";

const baseUrl = process.env.JAMB_QUEST_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--disable-service-worker"] });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/?e2eCbtResumeFixture=1`, { waitUntil: "commit", timeout: 30_000 });
  await page.locator('[data-e2e="resume-cbt-session"]').waitFor({ state: "visible", timeout: 30_000 });
  await page.getByRole("radio").first().click();
  await page.getByRole("button", { name: /flag for review/i }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  const before = await page.locator('[data-e2e="resume-cbt-session"]').evaluate((element) => ({ index: element.getAttribute("data-index"), answers: element.getAttribute("data-answers"), flags: element.getAttribute("data-flags"), seconds: Number(element.getAttribute("data-seconds")) }));
  if (before.index !== "1" || !before.answers?.includes("selectedIndex") || JSON.parse(before.flags ?? "[]").length !== 1) throw new Error(`CBT fixture did not save the expected in-progress state: ${JSON.stringify(before)}`);
  await page.reload({ waitUntil: "commit", timeout: 30_000 });
  await page.locator('[data-e2e="resume-cbt-ready"]').waitFor({ state: "visible", timeout: 30_000 });
  await page.getByRole("button", { name: "Resume exact CBT" }).click();
  await page.locator('[data-e2e="resume-cbt-session"]').waitFor({ state: "visible", timeout: 30_000 });
  const after = await page.locator('[data-e2e="resume-cbt-session"]').evaluate((element) => ({ index: element.getAttribute("data-index"), answers: element.getAttribute("data-answers"), flags: element.getAttribute("data-flags"), seconds: Number(element.getAttribute("data-seconds")) }));
  if (after.index !== before.index || after.answers !== before.answers || after.flags !== before.flags || after.seconds > before.seconds || after.seconds <= 0) throw new Error(`Resumed CBT state changed unexpectedly: before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
  await page.getByRole("button", { name: "Leave round" }).click();
  await page.locator('[data-e2e="resume-cbt-ready"]').waitFor({ state: "visible", timeout: 10_000 });
  const studyContext = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const studyPage = await studyContext.newPage();
  await studyPage.goto(`${baseUrl}/?e2eCbtResumeFixture=1&study=1`, { waitUntil: "commit", timeout: 30_000 });
  await studyPage.locator('[data-e2e="resume-cbt-session"]').waitFor({ state: "visible", timeout: 30_000 });
  const studyStoredCbt = await studyPage.evaluate(() => window.localStorage.getItem("jamb-quest-active-cbt-v1"));
  if (studyStoredCbt !== null) throw new Error("Untimed Study incorrectly created an active CBT resume record");
  await studyContext.close();
  await context.close();
  console.log(JSON.stringify({ verified: true, resumedIndex: after.index, answerAndFlagRestored: true, leaveAndResumeAvailable: true, remainingSeconds: after.seconds, studySessionIgnored: true }, null, 2));
} finally {
  await browser.close();
}
