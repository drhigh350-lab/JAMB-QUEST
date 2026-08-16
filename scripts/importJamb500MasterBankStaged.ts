import { eq } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { ENV } from "../server/_core/env";
import { getDb, getUserByOpenId, importAuthorisedQuestionSet, upsertUser } from "../server/db";
import { authorisedImportSchema } from "../server/questionImport";

type Record = {
  externalId: string;
  subject: "Use of English" | "Biology" | "Chemistry" | "Physics";
  topic: string;
  difficulty: "hard";
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  sourceLabel: string;
  permissionNote: string;
};

const stagePath = "/home/ubuntu/jamb-import-staging/jamb_500_master_bank.duplicate_safe_staged.json";
const receiptPath = "reports/jamb_500_master_bank_import_receipt.json";
const records = JSON.parse(await readFile(stagePath, "utf8")) as Record[];
if (!records.length) throw new Error("No duplicate-safe master-bank records are staged for import");
if (!ENV.ownerOpenId) throw new Error("Owner account configuration is unavailable");

await upsertUser({ openId: ENV.ownerOpenId, name: ENV.ownerName ?? "JAMB Quest owner", role: "admin" });
const owner = await getUserByOpenId(ENV.ownerOpenId);
const db = await getDb();
if (!owner || !db) throw new Error("Owner account or database is unavailable");

const groups = [...new Set(records.map((record) => record.sourceLabel))].map((sourceLabel) => ({ sourceLabel, records: records.filter((record) => record.sourceLabel === sourceLabel) }));
const receipt: Array<{ sourceLabel: string; staged: number; imported: number; status: "imported" | "existing"; sourceId: number }> = [];
for (const group of groups) {
  const [existing] = await db.select({ id: questionSources.id }).from(questionSources).where(eq(questionSources.label, group.sourceLabel)).limit(1);
  if (existing) {
    receipt.push({ sourceLabel: group.sourceLabel, staged: group.records.length, imported: 0, status: "existing", sourceId: existing.id });
    continue;
  }
  const payload = authorisedImportSchema.parse({
    sourceLabel: group.sourceLabel,
    permissionNote: group.records[0].permissionNote,
    fileName: "JAMB_500_QUESTION_MASTER_BANK.pdf",
    storageKey: "owner-pdf://JAMB_500_QUESTION_MASTER_BANK.pdf",
    questions: group.records.map(({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation }) => ({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation })),
  });
  const imported = await importAuthorisedQuestionSet(owner.id, payload);
  await db.update(questionItems).set({ explanationStatus: "approved" }).where(eq(questionItems.sourceId, imported.sourceId));
  receipt.push({ sourceLabel: group.sourceLabel, staged: group.records.length, imported: imported.questionCount, status: "imported", sourceId: imported.sourceId });
}

const report = {
  staged: records.length,
  imported: receipt.reduce((sum, item) => sum + item.imported, 0),
  existing: receipt.filter((item) => item.status === "existing").reduce((sum, item) => sum + item.staged, 0),
  sources: receipt,
};
await writeFile(receiptPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
