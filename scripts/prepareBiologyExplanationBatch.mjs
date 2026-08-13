import { readFile, writeFile } from "node:fs/promises";

const batchNumber = Number(process.argv[2]);
if (!Number.isInteger(batchNumber) || batchNumber < 1) throw new Error("Usage: node scripts/prepareBiologyExplanationBatch.mjs <batch-number>");
const base = JSON.parse(await readFile("/home/ubuntu/jamb_question_bank/jamb_high_yield_practice_bank_1000.json", "utf8"));
const biology = base.questions.filter((question) => question.subject === "Biology");
const start = (batchNumber - 1) * 25;
const selected = biology.slice(start, start + 25);
if (selected.length !== 25) throw new Error(`Batch ${batchNumber} has ${selected.length} remaining questions; expected 25`);
const output = `biology-explanation-batch-${batchNumber}.input.json`;
await writeFile(output, `${JSON.stringify(selected, null, 2)}\n`);
console.log(JSON.stringify({ batchNumber, selected: selected.length, first: selected[0].id, last: selected.at(-1).id, topics: [...new Set(selected.map((question) => question.topic))], output }, null, 2));
