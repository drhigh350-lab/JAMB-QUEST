import { chromium } from "@playwright/test";

const baseUrl = process.env.JAMB_QUEST_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
for (const viewport of [{ width: 1280, height: 720 }, { width: 375, height: 812 }]) {
  const page = await browser.newPage({ viewport });
  await page.route("**/api/trpc/auth.me**", (route) => route.abort());
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.locator("body").waitFor({ state: "attached", timeout: 30_000 });
  await page.waitForTimeout(1_500);
  await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find((candidate) => /Start BIO round/i.test(candidate.textContent ?? ""));
    if (!button) throw new Error("Start BIO round button not found");
    button.click();
  });
  await page.locator(".quiz-layout").waitFor({ state: "visible", timeout: 30_000 });
  if (await page.getByText(/OWNER-PROVIDED|VERIFICATION PENDING|easy|medium|hard/i).count()) throw new Error(`Internal source or difficulty label leaked into the learner card at ${viewport.width}px`);
  if (await page.locator(".question-topic-label").count() !== 1) throw new Error(`Expected exactly one topic label at ${viewport.width}px`);
  await page.getByRole("radio").first().click();
  await page.getByRole("button", { name: /Submit answer/i }).click();
  await page.locator(".explanation-block p").nth(5).waitFor();
  if (await page.locator(".explanation-block p").count() !== 6) throw new Error(`Expected six explanation lines at ${viewport.width}px`);
  await page.close();
}
await browser.close();
console.log("uniform-question-card-verified");
