import { and, eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";

const inputPath = process.argv[2];
if (!inputPath) throw new Error("Usage: pnpm tsx scripts/approveSubmittedRichMarkdown.mts <ready-records-json>");
const records = JSON.parse(await readFile(inputPath, "utf8")) as Array<{ externalId: string; subject: string; sourceLabel: string }>;
const db = await getDb();
if (!db) throw new Error("Database unavailable");

let approved = 0;
const missing: Array<{ externalId: string; subject: string; sourceLabel: string }> = [];
for (const record of records) {
  const [row] = await db.select({ id: questionItems.id })
    .from(questionItems)
    .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
    .where(and(eq(questionItems.externalId, record.externalId), eq(questionItems.subject, record.subject), eq(questionSources.label, record.sourceLabel)))
    .limit(1);
  if (!row) {
    missing.push(record);
    continue;
  }
  await db.update(questionItems).set({ explanationStatus: "approved" }).where(eq(questionItems.id, row.id));
  approved += 1;
}
if (missing.length) throw new Error(`Could not match ${missing.length} submitted records for approval: ${JSON.stringify(missing.slice(0, 5))}`);
console.log(JSON.stringify({ verified: true, approved, heldOutsideGameplay: 50 }, null, 2));
