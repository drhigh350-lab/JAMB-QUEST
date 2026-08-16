import { and, eq, inArray } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";

type InventoryRecord = { id: number; sourceLabel: string; blockers: string[]; safeIfStatusApproved: boolean };
const inventory = JSON.parse(await readFile("reports/needs_review_blocker_inventory.json", "utf8")) as { records: InventoryRecord[] };
const candidates = inventory.records.filter((record) => record.safeIfStatusApproved);
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const ids = candidates.map((record) => record.id);
const rows = ids.length ? await db.select({ id: questionItems.id, status: questionItems.explanationStatus, sourceLabel: questionSources.label })
  .from(questionItems).innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(inArray(questionItems.id, ids), eq(questionSources.sourceType, "authorised"), eq(questionSources.isActive, 1), eq(questionItems.explanationStatus, "needs_review"))) : [];
const updatedIds = rows.map((row) => row.id);
if (updatedIds.length) await db.update(questionItems).set({ explanationStatus: "approved" }).where(inArray(questionItems.id, updatedIds));
const report = { candidates: candidates.length, updated: updatedIds.length, skipped: candidates.filter((record) => !updatedIds.includes(record.id)).map((record) => record.id), ids: updatedIds };
await writeFile("reports/needs_review_status_only_release_receipt.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
