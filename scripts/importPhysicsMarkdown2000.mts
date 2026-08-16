import { and, eq } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { ENV } from "../server/_core/env";
import { getDb, getUserByOpenId, importAuthorisedQuestionSet, upsertUser } from "../server/db";
import { authorisedImportSchema } from "../server/questionImport";

type Staged = { externalId: string; subject: "Physics"; topic: string; difficulty: "easy" | "medium" | "hard"; question: string; options: string[]; answerIndex: number; explanation: string; sourceLabel: string; permissionNote: string };
const staged = JSON.parse(await readFile("/home/ubuntu/jamb-import-staging/physics_jamb_2000.staged.json", "utf8")) as Staged[];
const db = await getDb();
if (!db || !ENV.ownerOpenId) throw new Error("Database or owner configuration unavailable");
await upsertUser({ openId: ENV.ownerOpenId, name: ENV.ownerName ?? "JAMB Quest owner", role: "admin" });
const owner = await getUserByOpenId(ENV.ownerOpenId);
if (!owner) throw new Error("Owner account unavailable");
const normalise = (value: string) => value.toLowerCase().normalize("NFKC").replace(/[–—]/g, "-").replace(/[^a-z0-9]+/g, " ").trim();
const existingRows = await db.select({ subject: questionItems.subject, question: questionItems.questionText }).from(questionItems).innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id)).where(and(eq(questionSources.sourceType, "authorised"), eq(questionSources.isActive, 1)));
const fingerprints = new Set(existingRows.map((row) => `${row.subject}:${normalise(row.question)}`));
const release: Staged[] = [];
const holds: Array<{ externalId: string; reason: string }> = [];
for (const row of staged) {
  const key = `${row.subject}:${normalise(row.question)}`;
  if (fingerprints.has(key)) holds.push({ externalId: row.externalId, reason: "duplicate found during immediate pre-import recheck" });
  else { fingerprints.add(key); release.push(row); }
}
const sourceLabel = staged[0]?.sourceLabel ?? "Owner-provided Markdown · physics_jamb_2000.md · Physics";
const receipt: { staged: number; releaseAfterRecheck: number; imported: number; sourceId: number | null; holds: typeof holds } = { staged: staged.length, releaseAfterRecheck: release.length, imported: 0, sourceId: null, holds };
if (release.length) {
  const [existingSource] = await db.select({ id: questionSources.id }).from(questionSources).where(eq(questionSources.label, sourceLabel)).limit(1);
  if (existingSource) receipt.holds.push({ externalId: "source", reason: "source label already exists; no rerun import" });
  else {
    const payload = authorisedImportSchema.parse({ sourceLabel, permissionNote: release[0].permissionNote, fileName: "physics_jamb_2000.md", storageKey: "owner-markdown://physics_jamb_2000.md", questions: release.map(({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation }) => ({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation })) });
    const result = await importAuthorisedQuestionSet(owner.id, payload);
    await db.update(questionItems).set({ explanationStatus: "approved" }).where(eq(questionItems.sourceId, result.sourceId));
    receipt.imported = result.questionCount;
    receipt.sourceId = result.sourceId;
  }
}
await writeFile("/home/ubuntu/jamb-quiz-game/reports/physics_jamb_2000_import_receipt.json", `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt, null, 2));
