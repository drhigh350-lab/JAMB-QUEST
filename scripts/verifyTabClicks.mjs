import { chromium } from "@playwright/test";

const baseUrl = process.env.JAMB_QUEST_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium" });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, serviceWorkers: "block" });
const page = await context.newPage();
await page.route("**/sw.js*", (route) => route.abort());
await page.goto(`${baseUrl.replace(/\/$/, "")}/?e2eTabClicks=1`, { waitUntil: "domcontentloaded", timeout: 30_000 });
await page.getByRole("heading", { name: /build toward/i }).waitFor();

const cases = [
  ["Practice", "Build toward"],
  ["Progress", "Your work"],
  ["Profile", "Your study"],
  ["About", "Know the"],
];

for (const [tab, expectedHeading] of cases) {
  const buttons = page.getByRole("button", { name: tab, exact: true });
  const target = tab === "Practice" || tab === "Progress" ? buttons.first() : buttons.last();
  if (tab !== "Practice") await target.evaluate((element) => element.click());
  await page.getByRole("heading", { name: new RegExp(expectedHeading, "i") }).waitFor();
  await page.getByTestId(`tab-cinematic-${tab.toLowerCase()}`).waitFor();
  const selected = await buttons.last().getAttribute("aria-current");
  if (selected !== "page") throw new Error(`${tab} did not expose an active tab state.`);
}

await context.close();
await browser.close();
console.log("tab-controls-verified");
