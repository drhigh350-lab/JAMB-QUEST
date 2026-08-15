import { chromium } from "@playwright/test";

const baseUrl = process.env.JAMB_QUEST_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--disable-service-worker"] });

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const page = await context.newPage();
  await page.route("**/sw.js*", (route) => route.abort());
  await page.goto(`${baseUrl.replace(/\/$/, "")}/?e2eLekkiChapterFixture=1`, { waitUntil: "commit", timeout: 30_000 });
  await page.getByTestId("lekki-palette").click();
  const panel = page.locator(".compact-lekki-desk");
  await panel.waitFor({ state: "visible", timeout: 30_000 });
  await page.getByTestId("lekki-random-start").click();
  const launchedConfig = await page.getByTestId("fixture-launched-config").textContent({ timeout: 10_000 });
  const result = JSON.parse(launchedConfig || "{}");
  if (result.subject !== "Use of English" || result.topic !== "The Lekki Headmaster" || result.count !== 20 || result.mode !== "sprint" || result.timing !== "study") throw new Error(`Lekki chapter launch did not preserve the intended 20-question study configuration: ${launchedConfig}`);
  await page.getByTestId("lekki-count-50").click();
  await panel.locator("select").selectOption({ index: 1 });
  await page.getByTestId("lekki-chapter-start").click();
  const chapterConfig = JSON.parse((await page.getByTestId("fixture-launched-config").textContent({ timeout: 10_000 })) || "{}");
  if (!String(chapterConfig.topic ?? "").startsWith("The Lekki Headmaster · Chapter") || chapterConfig.count !== 50) throw new Error(`Lekki chapter selection did not launch the requested 50-question exact chapter drill: ${JSON.stringify(chapterConfig)}`);
  console.log(JSON.stringify({ verified: true, random: result, chapter: chapterConfig }, null, 2));
} finally {
  await browser.close();
}
