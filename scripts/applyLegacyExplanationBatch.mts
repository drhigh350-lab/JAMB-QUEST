import { eq } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";

const batchNumber = Number(process.argv[2] ?? "1");
if (!Number.isInteger(batchNumber) || batchNumber < 1) throw new Error("Batch number must be a positive integer");
const path = `reports/legacy_explanation_batch_${String(batchNumber).padStart(3, "0")}_output.json`;
const payload = JSON.parse(await readFile(path, "utf8")) as { records: Array<{ id: number; explanation: string; status: string; lineCount: number; wordCount: number }> };
const eligible = payload.records.filter((record) => record.status === "ready" && record.lineCount === 4 && record.wordCount >= 28 && record.wordCount <= 110);
if (eligible.length !== payload.records.length) throw new Error("Batch contains records that do not meet the four-line contract");
const db = await getDb();
if (!db) throw new Error("Database unavailable");
for (const record of eligible) {
  await db.update(questionItems).set({ explanation: record.explanation }).where(eq(questionItems.id, record.id));
}
const receipt = { batchNumber, updatedCount: eligible.length, ids: eligible.map((record) => record.id) };
await writeFile(`reports/legacy_explanation_batch_${String(batchNumber).padStart(3, "0")}_apply_receipt.json`, JSON.stringify(receipt, null, 2) + "\n");
console.log(JSON.stringify(receipt, null, 2));
