import { chromium } from "@playwright/test";

const baseUrl = process.env.JAMB_QUEST_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--disable-service-worker"] });

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.route("**/sw.js*", (route) => route.abort());
  await page.goto(`${baseUrl}/?e2eTopicPracticeFixture=1`, { waitUntil: "commit", timeout: 30_000 });
  const panel = page.locator(".compact-panel-maize");
  await panel.waitFor({ state: "visible", timeout: 30_000 });
  await panel.evaluate((element) => { element.open = true; });
  await panel.locator(".compact-topic-groups button").first().click();
  const select = panel.locator("select");
  await page.waitForFunction(() => document.querySelectorAll(".compact-panel-maize select option").length > 1, undefined, { timeout: 30_000 });
  const topic = await select.locator("option").nth(1).textContent();
  if (!topic?.trim()) throw new Error("The Biology topic selector did not expose a verified topic.");
  await select.selectOption({ label: topic.trim() });
  await panel.getByRole("button", { name: /Start topic drill/i }).click();
  const launchedConfig = await page.getByTestId("fixture-launched-config").textContent({ timeout: 10_000 });
  const result = JSON.parse(launchedConfig || "{}");
  if (result.subject !== "Biology") throw new Error(`Expected a Biology drill, received ${result.subject ?? "no subject"}.`);
  if (result.topic !== topic.trim()) throw new Error(`Expected topic ${topic.trim()}, received ${result.topic ?? "no topic"}.`);
  if (result.count !== 20) throw new Error(`Expected a 20-question drill, received ${result.count ?? "no count"}.`);
  if (result.timing !== "study" || result.mode !== "sprint") throw new Error("Topic practice must launch as untimed Study.");
  console.log(JSON.stringify({ verified: true, ...result }, null, 2));
  await page.close();
} finally {
  await browser.close();
}
