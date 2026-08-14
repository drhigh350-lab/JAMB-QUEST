import { chromium } from "@playwright/test";

const baseUrl = process.env.JAMB_QUEST_URL ?? "http://127.0.0.1:3000";
const cases = [
  { origin: "saved-question", message: "That saved question is no longer available in the active question bank." },
  { origin: "missed-questions", message: "None of the missed questions from that attempt are currently available in the active question bank." },
];
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--disable-service-worker"] });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.route("**/sw.js*", (route) => route.abort());
  for (const testCase of cases) {
    await page.goto(`${baseUrl}/?e2eRecoveryEmptyFixture=1&tab=progress&recoveryOrigin=${testCase.origin}`, { waitUntil: "commit", timeout: 30_000 });
    await page.locator(".load-error").waitFor({ state: "visible", timeout: 30_000 });
    const text = await page.locator(".load-error").innerText();
    if (!text.includes(testCase.message)) throw new Error(`Wrong ${testCase.origin} recovery message: ${text}`);
    if (!await page.getByText("Your work", { exact: false }).isVisible()) throw new Error(`${testCase.origin} recovery did not remain on Progress.`);
    if (await page.locator(".quiz-shell").count()) throw new Error(`${testCase.origin} recovery incorrectly opened a replacement quiz.`);
  }
  console.log(JSON.stringify({ verified: true, savedQuestionMessage: true, missedQuestionMessage: true, stayedOnProgress: true, noQuestionSubstitution: true }, null, 2));
} finally {
  await browser.close();
}
