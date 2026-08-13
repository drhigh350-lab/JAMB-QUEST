import { chromium } from "@playwright/test";

const baseUrl = "https://jambquiz-kmqgtf9m.manus.space";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium" });
const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
const page = await context.newPage();

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.evaluate(async () => {
  const registration = await navigator.serviceWorker.getRegistration();
  await registration?.unregister();
});
await page.goto(`${baseUrl}/?swUpgradeFixture=legacy`, { waitUntil: "networkidle" });
await page.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL.includes("upgradeFixture=legacy"));
const legacyController = await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL.includes("upgradeFixture=legacy"));
if (!legacyController) throw new Error("Legacy service-worker fixture did not control the page.");

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL.endsWith("/sw.js"));
await page.getByRole("button", { name: "Practice", exact: true }).last().waitFor({ state: "visible" });
await page.getByRole("button", { name: "About", exact: true }).last().waitFor({ state: "visible" });
const currentController = await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL.endsWith("/sw.js"));
if (!currentController) throw new Error("Current service worker did not take control after the upgrade.");

await context.setOffline(true);
await page.reload({ waitUntil: "domcontentloaded" });
await page.getByRole("button", { name: "Profile", exact: true }).last().waitFor({ state: "visible" });
await context.setOffline(false);
await browser.close();
console.log("pwa-stale-session-upgrade-path-verified");
