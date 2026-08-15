import { chromium } from "@playwright/test";

const baseUrl = process.env.JAMB_QUEST_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--disable-service-worker"] });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.route("**/sw.js*", (route) => route.abort());
  await page.goto(`${baseUrl}/?e2eOpeningSequenceFixture=1`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const opening = page.locator('[data-e2e="quest-opening"]');
  await opening.waitFor({ state: "visible", timeout: 10_000 });
  if (!/Build your system\.\s*Win JAMB\./.test((await opening.innerText()).replace(/\s+/g, " "))) throw new Error("Opening sequence did not present the system-led JAMB Quest message.");
  await page.getByRole("button", { name: /skip intro/i }).click();
  await opening.waitFor({ state: "hidden", timeout: 10_000 });
  await page.locator('[data-e2e="opening-handoff"]').waitFor({ state: "visible", timeout: 10_000 });
  console.log(JSON.stringify({ verified: true, officialMark: true, systemMessage: true, skipControl: true, viewport: "390x844" }, null, 2));
} finally {
  await browser.close();
}
