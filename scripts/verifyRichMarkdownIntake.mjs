import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";

const run = promisify(execFile);
const fixturePath = "/home/ubuntu/jamb-quiz-game/scripts/fixtures/rich_markdown_intake_fixture.md";
await run("node", ["scripts/parseMarkdownQuestionBank.mjs", fixturePath], { cwd: "/home/ubuntu/jamb-quiz-game" });
const records = JSON.parse(await readFile("/home/ubuntu/jamb-import-staging/rich_markdown_intake_fixture.validated.json", "utf8"));
const report = JSON.parse(await readFile("/home/ubuntu/jamb-import-staging/rich_markdown_intake_fixture.validation-report.json", "utf8"));
const record = records[0];
if (records.length !== 1 || record?.subject !== "Biology" || record?.topic !== "Cell Division" || record?.answerIndex !== 1 || !record?.explanation?.includes("independent assortment") || record.explanation.split("\n").filter(Boolean).length !== 6 || report.richExplanationCount !== 1) {
  throw new Error(`Rich Markdown intake verification failed: ${JSON.stringify({ records, report })}`);
}
console.log(JSON.stringify({ verified: true, topic: record.topic, explanationLines: record.explanation.split("\n").filter(Boolean).length, richExplanationCount: report.richExplanationCount }, null, 2));
