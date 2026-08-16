import { and, eq, inArray } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";
const subject = process.argv[2] as "Biology" | "Chemistry";
const batch = Number(process.argv[3] ?? 1);
if (!subject || !["Biology", "Chemistry"].includes(subject)) throw new Error("Subject must be Biology or Chemistry");
const path = `reports/${subject.toLowerCase()}_held_shortening_batch_${String(batch).padStart(3, "0")}.json`;
const payload = JSON.parse(await readFile(path, "utf8"));
const selected = payload.selected as Array<{ id: number; after: string; afterLines: number; beforeLines: number }>;
if (!selected.length) throw new Error("No selected records");
if (selected.some((x) => x.afterLines > 4 || x.afterLines < 3 || !x.after.trim())) throw new Error("Shortened explanation failed line contract");
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const ids = selected.map((x) => x.id);
const existing = await db.select({ id: questionItems.id, subject: questionItems.subject, explanation: questionItems.explanation, explanationStatus: questionItems.explanationStatus }).from(questionItems).where(inArray(questionItems.id, ids));
if (existing.length !== selected.length || existing.some((row) => row.subject !== subject)) throw new Error("Selected records do not match the requested subject");
for (const item of selected) {
  await db.update(questionItems).set({ explanation: item.after, explanationStatus: "approved" }).where(and(eq(questionItems.id, item.id), eq(questionItems.subject, subject)));
}
const receipt = { subject, batch, selected: selected.length, ids, beforeLineRange: [Math.min(...selected.map((x) => x.beforeLines)), Math.max(...selected.map((x) => x.beforeLines))], afterLineRange: [Math.min(...selected.map((x) => x.afterLines)), Math.max(...selected.map((x) => x.afterLines))] };
await writeFile(`reports/${subject.toLowerCase()}_held_shortening_batch_${String(batch).padStart(3, "0")}_apply_receipt.json`, JSON.stringify(receipt, null, 2) + "\n");
console.log(JSON.stringify(receipt));
