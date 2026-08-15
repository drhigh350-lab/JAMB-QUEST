import { chromium } from "@playwright/test";

const baseUrl = process.env.JAMB_QUEST_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--disable-service-worker"] });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.route("**/sw.js*", (route) => route.abort());
  await page.goto(`${baseUrl}/?e2eReminderFixture=1&tab=profile`, { waitUntil: "commit", timeout: 30_000 });
  await page.getByRole("button", { name: /send test/i }).waitFor({ state: "visible", timeout: 30_000 });
  await page.getByRole("button", { name: /send test/i }).click();
  await page.getByRole("status").filter({ hasText: /test reminder sent/i }).waitFor({ state: "visible", timeout: 10_000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) throw new Error(`Reminder fixture overflowed by ${overflow}px on phone width.`);
  console.log(JSON.stringify({ verified: true, testControl: true, successFeedback: true, overflow }, null, 2));
} finally {
  await browser.close();
}
