import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const run = promisify(execFile);
const projectRoot = "/home/ubuntu/jamb-quiz-game";
const fixturePath = `${projectRoot}/scripts/fixtures/rich_markdown_intake_fixture.md`;
const outputPath = "/home/ubuntu/jamb-import-staging/rich_markdown_intake_fixture.validated.json";

describe("rich Markdown question intake", () => {
  it("retains an author-supplied topic and six-line explanation through staging", async () => {
    await run("node", ["scripts/parseMarkdownQuestionBank.mjs", fixturePath], { cwd: projectRoot });
    const records = JSON.parse(await readFile(outputPath, "utf8")) as Array<{ subject: string; topic: string; answerIndex: number; explanation?: string }>;
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ subject: "Biology", topic: "Cell Division", answerIndex: 1 });
    expect(records[0]?.explanation?.split("\n").filter(Boolean)).toHaveLength(6);
    expect(records[0]?.explanation).toContain("independent assortment");
  });
});
