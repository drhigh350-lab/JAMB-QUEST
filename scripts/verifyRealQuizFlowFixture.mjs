import { chromium } from "@playwright/test";

const baseUrl = process.env.JAMB_QUEST_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--disable-service-worker"] });
const results = [];
try {
  for (const viewport of [{ width: 1280, height: 720 }, { width: 375, height: 812 }]) {
    const page = await browser.newPage({ viewport });
    await page.route("**/sw.js*", (route) => route.abort());
    await page.goto(`${baseUrl}/?e2eQuizFixture=1`, { waitUntil: "commit", timeout: 30_000 });
    await page.locator(".quiz-layout").waitFor({ state: "visible", timeout: 30_000 });
    if (!await page.getByText("STUDY MODE / UNTIMED", { exact: true }).isVisible() || await page.locator(".timer-block").count()) throw new Error(`Study-mode timing contract failed at ${viewport.width}px`);
    await page.getByRole("radio").first().click({ force: true, noWaitAfter: true, timeout: 10_000 });
    await page.getByRole("button", { name: /Submit answer/i }).click({ force: true, noWaitAfter: true, timeout: 10_000 });
    await page.locator(".explanation-block").waitFor({ state: "visible", timeout: 10_000 });
    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      topicLabels: document.querySelectorAll(".question-topic-label").length,
      explanationLength: document.querySelector(".explanation-block")?.textContent?.trim().length ?? 0,
      provenanceLeak: /DailyEd|Verification Pending|OWNER-PROVIDED|difficulty-(easy|medium|hard)/i.test(document.body.textContent ?? ""),
    }));
    if (metrics.overflow > 1) throw new Error(`Horizontal overflow at ${viewport.width}px`);
    if (metrics.topicLabels !== 1 || metrics.explanationLength < 80 || metrics.provenanceLeak) throw new Error(`Uniform learner contract failed at ${viewport.width}px`);
    results.push({ viewport: `${viewport.width}x${viewport.height}`, ...metrics });
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify({ verified: true, questionId: "BIO-076", results }, null, 2));
