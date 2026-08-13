import { chromium } from "@playwright/test";

const baseUrl = process.env.JAMB_QUEST_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--disable-service-worker"] });
for (const viewport of [{ width: 1280, height: 720 }, { width: 375, height: 812 }]) {
  console.log(`starting-${viewport.width}`);
  const page = await browser.newPage({ viewport });
  await page.route("**/api/trpc/**", (route) => {
    const procedures = new URL(route.request().url()).pathname.split("/").at(-1)?.split(",") ?? [];
    const body = procedures.map((procedure) => ({
      result: { data: { json: procedure === "auth.me" ? null : [] } },
    }));
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.route("**/sw.js*", (route) => route.abort());
  await page.goto(baseUrl, { waitUntil: "commit", timeout: 30_000 });
  console.log(`committed-${viewport.width}-${page.url()}`);
  await page.locator("body").waitFor({ state: "attached", timeout: 30_000 });
  console.log(`body-${viewport.width}-${page.url()}`);
  await new Promise((resolve) => setTimeout(resolve, 1_500));
  console.log(`ready-${viewport.width}`);
  console.log(`shell-${viewport.width}-${(await page.locator("body").innerText({ timeout: 10_000 })).slice(0, 500).replace(/\s+/g, " ")}`);
  await page.getByRole("button", { name: /Start BIO round/i }).click({ force: true, noWaitAfter: true, timeout: 10_000 });
  console.log(`started-${viewport.width}`);
  await page.locator(".quiz-layout").waitFor({ state: "visible", timeout: 30_000 });
  console.log(`quiz-${viewport.width}`);
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
