import { basename, join } from "node:path";
import { readFile, writeFile } from "node:fs/promises";

const inputPath = process.argv[2];
if (!inputPath) throw new Error("Usage: node scripts/parseMarkdownQuestionBank.mjs <markdown-path>");

const text = await readFile(inputPath, "utf8");
const sourceFile = basename(inputPath);
const subjectFrom = (value) => {
  const lower = value.toLowerCase();
  if (lower.includes("english")) return "Use of English";
  if (lower.includes("biology")) return "Biology";
  if (lower.includes("chemistry")) return "Chemistry";
  if (lower.includes("physics")) return "Physics";
  return null;
};
const clean = (value) => value.replaceAll("✅", "").replace(/\*\*/g, "").replace(/__+/g, "").replace(/^\s*[-•]\s*/, "").replace(/^\s*[A-D][.)]\s*/i, "").trim();
const normalise = (value) => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
const isAnswerLine = (line) => /^\s*\*{0,2}answer\s*:/i.test(line);
const optionMatch = (line) => line.match(/^\s*[-•]\s*([A-D])[.)]\s*(.+)$/i);

let subject = subjectFrom(text.split("\n").slice(0, 8).join(" ")) ?? null;
let current = null;
let collectingBullets = false;
const parsed = [];

function flush() {
  if (!current) return;
  const options = current.options.map(clean);
  const answerText = clean(current.answerText ?? "");
  let answerIndex = -1;
  if (current.answerLetter) answerIndex = current.answerLetter.charCodeAt(0) - 65;
  if (answerIndex < 0 && answerText) {
    answerIndex = options.findIndex((option) => normalise(option) === normalise(answerText));
  }
  if (current.questionText && options.length === 4 && answerIndex >= 0 && answerIndex < 4) {
    parsed.push({
      externalId: `${sourceFile.replace(/[^a-z0-9]+/gi, "-")}-${(current.subject ?? subject ?? "unclassified").replace(/[^a-z0-9]+/gi, "-")}-${current.number}`,
      subject: current.subject ?? subject ?? "Unclassified",
      topic: "To be tagged during syllabus mapping",
      difficulty: "medium",
      question: clean(current.questionText),
      options,
      answerIndex,
      explanation: current.explanation ? clean(current.explanation) : undefined,
      sourceLabel: `Owner-provided Markdown · ${sourceFile} · ${current.subject ?? subject ?? "Unclassified"}`,
      permissionNote: `Owner-provided upload: ${sourceFile}. Wording and answer mapping are verification-pending; do not represent as official JAMB wording without confirmation.`,
    });
  }
  current = null;
  collectingBullets = false;
}

for (const rawLine of text.split(/\r?\n/)) {
  const line = rawLine.trim();
  const headingSubject = subjectFrom(line);
  if (headingSubject) subject = headingSubject;

  const numberedHeading = line.match(/^##\s*Q?\s*(\d+)\s*$/i);
  const numberedBold = line.match(/^\*{2}\s*(\d+)\.\s*(.+?)\s*\*{2}\s*$/);
  if (numberedHeading || numberedBold) {
    flush();
    current = { number: Number((numberedHeading ?? numberedBold).at(1)), questionText: numberedBold?.at(2) ?? "", options: [], subject, answerText: "" };
    collectingBullets = false;
    continue;
  }
  if (!current) continue;

  if (/^\s*options\s*:/i.test(line)) {
    const inline = line.replace(/^\s*options\s*:\s*/i, "");
    if (inline.includes("|")) current.options.push(...inline.split("|").map(clean).filter(Boolean));
    collectingBullets = true;
    continue;
  }
  const option = optionMatch(line);
  if (option && (collectingBullets || current.options.length < 4)) {
    current.options.push(clean(option[2]));
    continue;
  }
  if (isAnswerLine(line)) {
    const answer = line.replace(/^\s*\*{0,2}answer\s*:\s*/i, "").replace(/\*{2}$/g, "").trim();
    const letter = answer.match(/^([A-D])[.)]?\s*/i);
    current.answerLetter = letter?.[1]?.toUpperCase();
    current.answerText = letter ? answer.slice(letter[0].length) : answer;
    collectingBullets = false;
    continue;
  }
  if (/^\s*\*{0,2}explanation\s*:/i.test(line)) {
    current.explanation = line.replace(/^\s*\*{0,2}explanation\s*:\s*/i, "").replace(/\*{2}$/g, "");
    continue;
  }
  if (!current.questionText && line && !line.startsWith("---") && !/^\s*(Format|Date|Source|Compiled):/i.test(line)) {
    current.questionText = line;
  }
  if (current.questionText && !current.options.length && line && !line.startsWith("---") && !/^\s*(Options|Answer|Explanation):/i.test(line)) {
    current.questionText = `${current.questionText} ${line}`.trim();
  }
}
flush();

const seen = new Set();
const unique = [];
let duplicateCount = 0;
for (const record of parsed) {
  const fingerprint = `${record.subject}:${normalise(record.question)}`;
  if (seen.has(fingerprint)) { duplicateCount += 1; continue; }
  seen.add(fingerprint);
  unique.push(record);
}
const rejectedCount = Math.max(0, parsed.length - unique.length);
const outputBase = sourceFile.replace(/\.md$/i, "");
const outputPath = join("/home/ubuntu/jamb-import-staging", `${outputBase}.validated.json`);
const reportPath = join("/home/ubuntu/jamb-import-staging", `${outputBase}.validation-report.json`);
await writeFile(outputPath, `${JSON.stringify(unique, null, 2)}\n`);
await writeFile(reportPath, `${JSON.stringify({ sourceFile, parsedCount: parsed.length, acceptedCount: unique.length, duplicateCount, rejectedCount, subjects: Object.fromEntries([...new Set(unique.map((record) => record.subject))].map((name) => [name, unique.filter((record) => record.subject === name).length])) }, null, 2)}\n`);
console.log(JSON.stringify({ sourceFile, parsedCount: parsed.length, acceptedCount: unique.length, duplicateCount, rejectedCount, outputPath }, null, 2));
