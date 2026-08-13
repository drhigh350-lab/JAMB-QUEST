import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "/home/ubuntu/jamb-import-staging/submitted_rich_questions.held.json";
const records = JSON.parse(await readFile(sourcePath, "utf8"));
const queue = records
  .filter((record) => record.qualityAssessment?.reasons?.every((reason) => reason === "rich explanation requires at least 65 words across two sentences"))
  .map((record) => ({
    id: record.externalId,
    subject: record.subject,
    topic: record.topic,
    question: record.question,
    options: record.options,
    answer_index: record.answerIndex,
    explanation: record.explanation,
    sourceLabel: record.sourceLabel,
  }));
const outputPath = "/home/ubuntu/jamb-import-staging/submitted_rich_questions.short-enrichment.input.json";
await writeFile(outputPath, `${JSON.stringify(queue, null, 2)}\n`);
console.log(JSON.stringify({ input: records.length, queued: queue.length, heldForSourceAmbiguity: records.length - queue.length, outputPath }, null, 2));
