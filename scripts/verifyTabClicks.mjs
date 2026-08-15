import { chromium } from "@playwright/test";

const baseUrl = "https://3000-iobewn6v6k0sqroneio5d-c3a4c244.us4.manus.computer";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium" });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
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
  const selected = await buttons.last().getAttribute("aria-current");
  if (selected !== "page") throw new Error(`${tab} did not expose an active tab state.`);
}

await browser.close();
console.log("tab-controls-verified");
