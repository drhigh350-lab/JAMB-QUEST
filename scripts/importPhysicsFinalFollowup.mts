import { and, eq } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { ENV } from "../server/_core/env";
import { getDb, getUserByOpenId, importAuthorisedQuestionSet, upsertUser } from "../server/db";
import { authorisedImportSchema } from "../server/questionImport";
const path = "/home/ubuntu/jamb-import-staging/physics_final_followup_candidates.json";
type Row = { externalId: string; subject: "Physics"; topic: string; difficulty: "easy" | "medium" | "hard"; question: string; options: string[]; answerIndex: number; explanation: string; sourceLabel: string; permissionNote: string };
const candidates = JSON.parse(await readFile(path, "utf8")) as Row[];
const db = await getDb();
if (!db || !ENV.ownerOpenId) throw new Error("Database or owner configuration unavailable");
await upsertUser({ openId: ENV.ownerOpenId, name: ENV.ownerName ?? "JAMB Quest owner", role: "admin" });
const owner = await getUserByOpenId(ENV.ownerOpenId);
if (!owner) throw new Error("Owner account unavailable");
const normalise = (v: string) => v.toLowerCase().normalize("NFKC").replace(/[–—]/g, "-").replace(/[^a-z0-9]+/g, " ").trim();
const existing = await db.select({ subject: questionItems.subject, question: questionItems.questionText }).from(questionItems).innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id)).where(and(eq(questionSources.sourceType, "authorised"), eq(questionSources.isActive, 1)));
const fingerprints = new Set(existing.map(r => `${r.subject}:${normalise(r.question)}`));
const imported: Array<{ sourceLabel: string; count: number; sourceId: number }> = [];
const holds: Array<{ externalId: string; reason: string }> = [];
for (const sourceLabel of [...new Set(candidates.map(r => r.sourceLabel))]) {
  const group = candidates.filter(r => r.sourceLabel === sourceLabel);
  const [source] = await db.select({ id: questionSources.id }).from(questionSources).where(eq(questionSources.label, sourceLabel)).limit(1);
  if (source) { for (const r of group) holds.push({ externalId: r.externalId, reason: "source label already exists; rerun prevented" }); continue; }
  const safe = group.filter(r => { const key = `${r.subject}:${normalise(r.question)}`; if (fingerprints.has(key)) { holds.push({ externalId: r.externalId, reason: "duplicate at immediate pre-import check" }); return false; } fingerprints.add(key); return true; });
  if (!safe.length) continue;
  const payload = authorisedImportSchema.parse({ sourceLabel, permissionNote: safe[0].permissionNote, fileName: sourceLabel, storageKey: `owner-upload://${sourceLabel}`, questions: safe.map(({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation }) => ({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation })) });
  const result = await importAuthorisedQuestionSet(owner.id, payload);
  await db.update(questionItems).set({ explanationStatus: "approved" }).where(eq(questionItems.sourceId, result.sourceId));
  imported.push({ sourceLabel, count: result.questionCount, sourceId: result.sourceId });
}
const receipt = { candidates: candidates.length, imported: imported.reduce((a, b) => a + b.count, 0), importedSources: imported, held: holds.length, holds };
await writeFile("/home/ubuntu/jamb-quiz-game/reports/physics_final_followup_import_receipt.json", JSON.stringify(receipt, null, 2) + "\n");
console.log(JSON.stringify(receipt, null, 2));
