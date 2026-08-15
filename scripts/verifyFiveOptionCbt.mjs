import { chromium } from "@playwright/test";

const baseUrl = process.env.JAMB_QUEST_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--disable-service-worker"] });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.route("**/sw.js*", (route) => route.abort());
  await page.goto(`${baseUrl}/?e2eFiveOptionCbtFixture=1`, { waitUntil: "commit", timeout: 30_000 });
  await page.locator('[data-e2e="five-option-cbt"]').waitFor({ state: "visible", timeout: 30_000 });
  const options = page.getByRole("radio");
  if (await options.count() !== 5) throw new Error(`Expected five choices but found ${await options.count()}.`);
  if (!/E choice/.test(await options.nth(4).innerText())) throw new Error("The fifth E choice did not render correctly.");
  await page.keyboard.press("e");
  if (!(await options.nth(4).isChecked())) throw new Error("The E keyboard shortcut did not select the fifth answer.");
  if (await page.locator('[data-e2e="five-option-cbt"]').getAttribute("data-selected") !== "4") throw new Error("The fifth answer index was not persisted as 4.");
  if (!/Keys: A–E/.test(await page.locator(".keyboard-hint").innerText())) throw new Error("The CBT keyboard hint did not advertise E support.");
  console.log(JSON.stringify({ verified: true, options: 5, keyboardE: true, selectedIndex: 4, viewport: "390x844" }, null, 2));
} finally {
  await browser.close();
}
