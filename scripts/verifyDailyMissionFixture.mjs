import { chromium } from "@playwright/test";

const baseUrl = process.env.JAMB_QUEST_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--disable-service-worker"] });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.route("**/sw.js*", (route) => route.abort());
  await page.goto(`${baseUrl}/?e2eProgressAnalyticsFixture=1`, { waitUntil: "commit", timeout: 30_000 });
  await page.locator(".daily-mission-panel").waitFor({ state: "visible", timeout: 30_000 });
  if (!(await page.locator(".daily-mission-panel").innerText()).includes("Genetics")) throw new Error("Daily mission did not prioritise the weakest available topic.");
  if (await page.getByRole("button", { name: /continue 20-question mission|repair my mistakes/i }).count()) throw new Error("A duplicate daily-system launch action competed with the primary automatic mission.");
  await page.getByRole("button", { name: /start today's mission/i }).click();
  const missionConfig = await page.getByTestId("fixture-launched-config").textContent();
  if (!missionConfig?.includes('"subject":"Biology"') || !missionConfig.includes('"topic":"Genetics"') || !missionConfig.includes('"count":20')) throw new Error(`Daily mission did not launch the 20-question weak-topic drill: ${missionConfig}`);
  await page.goto(`${baseUrl}/?e2eProgressAnalyticsFixture=1&tab=progress`, { waitUntil: "commit", timeout: 30_000 });
  await page.locator(".progress-signals").waitFor({ state: "visible", timeout: 30_000 });
  const signals = await page.locator(".progress-signals").innerText();
  const normalizedSignals = signals.toLowerCase();
  if (!normalizedSignals.includes("practice accuracy") || !normalizedSignals.includes("average per question") || !normalizedSignals.includes("complete a full mock")) throw new Error(`Progress signals were incomplete: ${signals}`);
  await page.goto(`${baseUrl}/?e2eProgressAnalyticsFixture=1&tab=progress&paceScenario=slow-accurate`, { waitUntil: "commit", timeout: 30_000 });
  const slowSignals = (await page.locator(".progress-signals").innerText()).toLowerCase();
  if (!slowSignals.includes("timed speed drill") || !slowSignals.includes("100s per question")) throw new Error(`Slow-but-accurate guidance was not pace-aware: ${slowSignals}`);
  await page.goto(`${baseUrl}/?e2eProgressAnalyticsFixture=1&tab=progress&paceScenario=fast-inaccurate`, { waitUntil: "commit", timeout: 30_000 });
  const fastSignals = (await page.locator(".progress-signals").innerText()).toLowerCase();
  if (!fastSignals.includes("repair the weakest topic first") || !fastSignals.includes("30s per question")) throw new Error(`Fast-but-inaccurate guidance did not prioritise accuracy: ${fastSignals}`);
  await page.goto(`${baseUrl}/?e2eProgressAnalyticsFixture=1&tab=progress&fullMock=1`, { waitUntil: "commit", timeout: 30_000 });
  const fullMockSignals = await page.locator(".progress-signals").innerText();
  if (!fullMockSignals.includes("320/400") || !fullMockSignals.includes("60 TO TARGET") || !fullMockSignals.includes("FULL-MOCK CONTRIBUTION") || !fullMockSignals.includes("ENG 80%") || !fullMockSignals.includes("PHY 95%")) throw new Error(`Full-mock score gap or subject contributions were incomplete: ${fullMockSignals}`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) throw new Error(`Daily mission phone layout overflowed by ${overflow}px.`);
  console.log(JSON.stringify({ verified: true, dailyWeakTopicMission: true, count: 20, progressSignals: true, paceAwareRecommendations: true, viewport: "390x844" }, null, 2));
} finally {
  await browser.close();
}
