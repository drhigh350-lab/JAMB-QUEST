import { eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";

const inputPath = process.argv[2] ?? "authorised-biology-explanation-pilot.output.json";
const records = JSON.parse(await readFile(inputPath, "utf8"));
const db = await getDb();
if (!db) throw new Error("Database unavailable");
let approved = 0;
let heldForReview = 0;
for (const record of records) {
  const id = Number(String(record.id).replace(/^authorised-/, ""));
  if (!Number.isInteger(id)) throw new Error(`Invalid authorised question id ${record.id}`);
  const status = record.quality_gate && !record.needs_review ? "approved" : "needs_review";
  const explanation = status === "approved" ? record.lines.join("\n") : undefined;
  await db.update(questionItems).set({ explanationStatus: status, ...(explanation ? { explanation } : {}) }).where(eq(questionItems.id, id));
  if (status === "approved") approved += 1;
  else heldForReview += 1;
}
console.log(JSON.stringify({ inputPath, total: records.length, approved, heldForReview }, null, 2));
process.exit(0);
