import { chromium } from "@playwright/test";

const baseUrl = process.env.JAMB_QUEST_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--disable-service-worker"] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.route("**/sw.js*", (route) => route.abort());
  await page.goto(`${baseUrl}/?e2eProgressAnalyticsFixture=1&tab=progress`, { waitUntil: "commit", timeout: 30_000 });
  await page.locator(".exam-analytics").waitFor({ state: "visible", timeout: 30_000 });
  const metrics = await page.evaluate(() => ({
    chartBars: document.querySelectorAll(".exam-trend-point").length,
    logRows: document.querySelectorAll(".exam-log-row").length,
    weakTopics: document.querySelectorAll(".weak-topic-list article").length,
    drillButtons: Array.from(document.querySelectorAll(".weak-topic-list button")).filter((button) => button.textContent?.includes("Start 10-question drill")).length,
    logReviewButtons: Array.from(document.querySelectorAll(".exam-log-review")).filter((button) => button.textContent?.includes("Review")).length,
    savedQuestions: document.querySelectorAll(".saved-question-list article").length,
    comparisonVisible: Boolean(document.querySelector(".exam-comparison")),
    revisionSteps: document.querySelectorAll(".revision-planner li").length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    text: document.body.textContent ?? "",
  }));
  if (metrics.chartBars !== 3 || metrics.logRows !== 3 || metrics.weakTopics !== 2 || metrics.drillButtons !== 2 || metrics.logReviewButtons !== 3 || metrics.savedQuestions !== 2 || metrics.revisionSteps !== 3 || !metrics.comparisonVisible || metrics.overflow > 1 || !metrics.text.includes("NEXT-STUDY PLAN")) throw new Error(`Progress analytics fixture failed: ${JSON.stringify(metrics)}`);
  await page.getByRole("button", { name: /Start 10-question drill/i }).first().click();
  const drillConfig = await page.getByTestId("fixture-launched-config").textContent();
  if (!drillConfig?.includes('"subject":"Biology"') || !drillConfig.includes('"topic":"Genetics"')) throw new Error(`Focused topic drill did not launch the expected round: ${drillConfig}`);
  await page.locator(".saved-question-list button").first().click();
  const bookmarkConfig = await page.getByTestId("fixture-launched-config").textContent();
  if (!bookmarkConfig?.includes('"questionIds":["BIO-001"]')) throw new Error(`Saved revision did not launch the exact saved question: ${bookmarkConfig}`);
  await page.getByRole("button", { name: /Review 2 missed/i }).click();
  const logRecoveryConfig = await page.getByTestId("fixture-launched-config").textContent();
  if (!logRecoveryConfig?.includes('"questionIds":["BIO-001","CHE-010"]') || !logRecoveryConfig.includes('"mode":"review"')) throw new Error(`Exam-log recovery did not launch its exact missed questions: ${logRecoveryConfig}`);
  await page.getByRole("button", { name: /Open all 1 missed/i }).click();
  const allMissesConfig = await page.getByTestId("fixture-launched-config").textContent();
  if (!allMissesConfig?.includes('"questionIds":["BIO-001"]') || !allMissesConfig.includes('"subject":"Full JAMB Mock"')) throw new Error(`All-misses recovery did not launch the exact ledger question: ${allMissesConfig}`);
  console.log(JSON.stringify({ verified: true, ...metrics, text: undefined }, null, 2));
} finally {
  await browser.close();
}
