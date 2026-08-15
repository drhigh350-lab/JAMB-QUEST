import { chromium } from "@playwright/test";

const baseUrl = process.env.JAMB_QUEST_URL ?? "https://jambquiz-kmqgtf9m.manus.space";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium" });
const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
const page = await context.newPage();

await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
let serviceWorkerReady = false;
for (let attempt = 0; attempt < 3 && !serviceWorkerReady; attempt += 1) {
  try {
    await page.waitForLoadState("domcontentloaded", { timeout: 10_000 });
    await page.evaluate(async () => navigator.serviceWorker.ready);
    serviceWorkerReady = true;
  } catch {
    await page.waitForTimeout(1_000);
  }
}
if (!serviceWorkerReady) throw new Error("Service worker did not become ready after update navigation retries");
await context.setOffline(true);
await page.reload({ waitUntil: "domcontentloaded" });
await page.getByRole("heading", { name: /build toward/i }).waitFor();
await page.getByRole("button", { name: "Practice", exact: true }).last().waitFor({ state: "visible" });
await page.getByRole("button", { name: "About", exact: true }).last().waitFor({ state: "visible" });

await context.setOffline(false);
await browser.close();
console.log("pwa-offline-app-shell-verified");
