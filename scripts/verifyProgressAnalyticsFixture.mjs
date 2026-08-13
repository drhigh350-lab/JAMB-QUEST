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
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    text: document.body.textContent ?? "",
  }));
  if (metrics.chartBars !== 2 || metrics.logRows !== 2 || metrics.weakTopics !== 2 || metrics.overflow > 1 || !metrics.text.includes("WEAK-TOPIC RECOVERY")) throw new Error(`Progress analytics fixture failed: ${JSON.stringify(metrics)}`);
  console.log(JSON.stringify({ verified: true, ...metrics, text: undefined }, null, 2));
} finally {
  await browser.close();
}
