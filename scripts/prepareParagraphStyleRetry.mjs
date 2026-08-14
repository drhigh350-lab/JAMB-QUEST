import { readFile, writeFile } from "node:fs/promises";

const inputPath = process.argv[2];
const priorOutputPath = process.argv[3];
const outputPath = process.argv[4];
const limitRaw = process.argv[5];
if (!inputPath || !priorOutputPath || !outputPath) throw new Error("Usage: node scripts/prepareParagraphStyleRetry.mjs <input-json> <prior-output-json> <retry-output-json>");
const input = JSON.parse(await readFile(inputPath, "utf8"));
const prior = JSON.parse(await readFile(priorOutputPath, "utf8"));
const retryIds = new Set(prior.filter((record) => record.needs_review && record.lines?.every((line) => line === "This record could not be safely enriched automatically.")).map((record) => record.id));
const limit = limitRaw ? Number(limitRaw) : undefined;
if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) throw new Error("Retry limit must be a positive integer");
const retry = input.filter((record) => retryIds.has(record.id)).slice(0, limit);
await writeFile(outputPath, `${JSON.stringify(retry, null, 2)}\n`);
console.log(JSON.stringify({ input: input.length, retry: retry.length, retainedReviewDecisions: prior.filter((record) => record.needs_review && !retryIds.has(record.id)).length, outputPath }, null, 2));
