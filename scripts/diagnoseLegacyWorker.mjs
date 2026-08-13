import { chromium } from "@playwright/test";

const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium" });
const context = await browser.newContext();
const page = await context.newPage();
await page.goto("https://jambquiz-kmqgtf9m.manus.space/?swUpgradeFixture=legacy", { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
console.log(await page.evaluate(async () => {
  const registration = await navigator.serviceWorker.getRegistration();
  return {
    href: location.href,
    controller: navigator.serviceWorker.controller?.scriptURL ?? null,
    active: registration?.active?.scriptURL ?? null,
    waiting: registration?.waiting?.scriptURL ?? null,
    installing: registration?.installing?.scriptURL ?? null,
  };
}));
await browser.close();
