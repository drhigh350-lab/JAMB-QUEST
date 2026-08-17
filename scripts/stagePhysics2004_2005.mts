import { readFileSync, writeFileSync } from "node:fs";
import { getPlayableAuthorisedQuestions } from "../server/db";

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const sources = [{ file: "/home/ubuntu/upload/physics_jamb_2004.md", year: 2004 }, { file: "/home/ubuntu/upload/physics_jamb_2005.md", year: 2005 }];
const livePrompts = new Set((await getPlayableAuthorisedQuestions()).map((record) => normalize(record.question)));
const stage: Array<{ externalId: string; subject: "Physics"; topic: string; difficulty: "medium"; question: string; options: string[]; answerIndex: number; explanation: string }> = [];
const holds: Array<{ file: string; number: string; reason: string }> = [];

for (const source of sources) {
  const text = readFileSync(source.file, "utf8");
  const blocks = [...text.matchAll(/\*\*(\d+)\. \[([^\]]+)\]\*\*\s*\n([\s\S]*?)\nA\. (.*?)\nB\. (.*?)\nC\. (.*?)\nD\. (.*?)\n\n\*\*Answer: ([A-D])\*\*\s*\n\n> ([\s\S]*?)(?=\n\n---|$)/g)];
  for (const block of blocks) {
    const [, number, topic, question, a, b, c, d, answer, explanation] = block;
    const options = [a, b, c, d].map((option) => option.trim());
    if (new Set(options.map(normalize)).size !== 4) { holds.push({ file: source.file, number, reason: "duplicate option text" }); continue; }
    if (livePrompts.has(normalize(question))) { holds.push({ file: source.file, number, reason: "exact duplicate prompt already playable" }); continue; }
    stage.push({ externalId: `OWNER-PHY-${source.year}-MD-${number.padStart(3, "0")}`, subject: "Physics", topic, difficulty: "medium", question: question.trim(), options, answerIndex: "ABCD".indexOf(answer), explanation: explanation.trim() });
  }
}

const receipt = { batch: "owner-supplied Physics 2004 and 2005 Markdown", status: "staged-pending-import", stagedCount: stage.length, holds, questions: stage };
writeFileSync("reports/physics_2004_2005_safe_stage.json", `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ stagedCount: stage.length, holdCount: holds.length, holds }, null, 2));
