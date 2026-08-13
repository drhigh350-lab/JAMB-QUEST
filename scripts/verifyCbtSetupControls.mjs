import { chromium } from "@playwright/test";

const baseUrl = process.env.JAMB_QUEST_URL;
if (!baseUrl) throw new Error("Set JAMB_QUEST_URL to the running development-preview URL.");
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--disable-service-worker"] });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, serviceWorkers: "block" });
  const page = await context.newPage();
  await page.goto(`${baseUrl.replace(/\/$/, "")}/?e2eRealCountProbe=1`, { waitUntil: "commit", timeout: 30_000 });
  await page.waitForFunction(() => document.querySelector('[data-testid="ready-question-count"]')?.getAttribute("data-ready") === "true", undefined, { timeout: 30_000 });
  await page.getByRole("button", { name: /CBT simulation/i }).click();
  await page.getByText(/FULL JAMB MOCK \/ 180 QUESTIONS/i).waitFor({ state: "visible", timeout: 10_000 });
  const checkboxes = page.locator('.readiness-checks input[type="checkbox"]');
  if (await checkboxes.count() !== 3) throw new Error("Expected three pre-exam readiness checks.");
  for (let index = 0; index < 3; index += 1) await checkboxes.nth(index).check();
  const start = page.getByRole("button", { name: /Start standard 180-question mock/i });
  if (await start.isDisabled()) throw new Error("Full-mock launch remained disabled after all readiness checks were completed.");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) throw new Error(`Unexpected horizontal overflow: ${overflow}px.`);
  console.log(JSON.stringify({ verified: true, readinessChecks: 3, fullMockLaunchEnabled: true, overflow }, null, 2));
} finally {
  await browser.close();
}
