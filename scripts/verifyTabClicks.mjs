import { chromium } from "@playwright/test";

const baseUrl = "https://3000-iobewn6v6k0sqroneio5d-c3a4c244.us4.manus.computer";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium" });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(baseUrl, { waitUntil: "networkidle" });

const cases = [
  ["Practice", "Smash 380"],
  ["Progress", "Your work"],
  ["Profile", "Your study"],
  ["About", "Know the"],
];

for (const [tab, expectedHeading] of cases) {
  await page.getByRole("button", { name: tab, exact: true }).last().click();
  await page.getByRole("heading", { name: new RegExp(expectedHeading, "i") }).waitFor();
  const selected = await page.getByRole("button", { name: tab, exact: true }).last().getAttribute("aria-current");
  if (selected !== "page") throw new Error(`${tab} did not expose an active tab state.`);
}

await browser.close();
console.log("tab-controls-verified");
