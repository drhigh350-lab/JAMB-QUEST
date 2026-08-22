import { readFile, writeFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { questionItems } from "../drizzle/schema";
import { ENV } from "../server/_core/env";
import { getDb, getUserByOpenId, importAuthorisedQuestionSet, upsertUser } from "../server/db";
import { authorisedImportSchema } from "../server/questionImport";

type Mapped = { id: string; subject: "Use of English" | "Biology" | "Chemistry" | "Physics"; officialTopic: string; difficulty: "easy" | "medium" | "hard"; question: string; options: string[]; answerIndex: number; explanation: string };
const input = JSON.parse(await readFile("reports/questions_rows3_topic_mapping_audit.json", "utf8")) as { mapped: Mapped[]; held: Array<{ id: string; flags: string[] }> };
if (!ENV.ownerOpenId) throw new Error("Owner account configuration is unavailable");
await upsertUser({ openId: ENV.ownerOpenId, name: ENV.ownerName ?? "JAMB Quest owner", role: "admin" });
const owner = await getUserByOpenId(ENV.ownerOpenId);
const db = await getDb();
if (!owner || !db) throw new Error("Owner account or database is unavailable");
const existing = await db.select({ externalId: questionItems.externalId }).from(questionItems);
const existingIds = new Set(existing.map((row) => row.externalId?.toLowerCase()).filter(Boolean) as string[]);
const release = input.mapped.filter((record) => !existingIds.has(record.id.toLowerCase()));
const skippedExisting = input.mapped.filter((record) => existingIds.has(record.id.toLowerCase())).map((record) => record.id);
const payload = authorisedImportSchema.parse({
  sourceLabel: "Owner CSV questions_rows(3) · Official syllabus mapping release",
  permissionNote: "Owner-provided questions_rows(3).csv. These records were held only because their source topic labels were not official JAMB labels. Each was mapped deterministically to one official syllabus area. Placeholder and diagram-dependent records remain held; Mathematics is excluded.",
  fileName: "questions_rows(3).csv",
  storageKey: "owner-csv://questions_rows(3).csv#official-syllabus-mapping-release",
  questions: release.map(({ id, subject, officialTopic, difficulty, question, options, answerIndex, explanation }) => ({ externalId: id, subject, topic: officialTopic, difficulty, question, options, answerIndex, explanation })),
});
const result = await importAuthorisedQuestionSet(owner.id, payload);
await db.update(questionItems).set({ explanationStatus: "approved" }).where(eq(questionItems.sourceId, result.sourceId));
const receipt = { inputMapped: input.mapped.length, imported: result.questionCount, skippedExisting, held: input.held.length, heldByReason: input.held.reduce<Record<string, number>>((acc, item) => { for (const flag of item.flags) acc[flag] = (acc[flag] ?? 0) + 1; return acc; }, {}), sourceId: result.sourceId, importId: result.importId };
await writeFile("reports/questions_rows3_topic_mapping_import_receipt.json", `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt, null, 2));
process.exit(0);
