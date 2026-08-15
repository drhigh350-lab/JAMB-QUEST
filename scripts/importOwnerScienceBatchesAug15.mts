import { eq } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { ENV } from "../server/_core/env";
import { getDb, getUserByOpenId, importAuthorisedQuestionSet, upsertUser } from "../server/db";
import { authorisedImportSchema } from "../server/questionImport";

type AuditRecord = {
  subject: "Biology" | "Chemistry" | "Physics";
  sourceFile: string;
  questionNo: number;
  question: string;
  options: string[];
  answerIndex: number;
  topic: string;
  explanation: string;
};
type AuditReceipt = {
  structuralHolds: unknown[];
  exactDuplicates: unknown[];
  nearDuplicates: unknown[];
  batchDuplicates: unknown[];
  safeUniqueRecords: AuditRecord[];
  summary: { safeUniqueCandidates: number };
};

const auditPath = "/home/ubuntu/jamb-quiz-game/reports/owner_batches_aug15_duplicate_audit.json";
const receiptPath = "/home/ubuntu/jamb-quiz-game/reports/owner_batches_aug15_import_receipt.json";
const sourceLabel = "JAMB Quest Science Bank · Owner batch · August 2026 · duplicate-safe";
const permissionNote = "Trusted owner-supplied Physics, Biology, and Chemistry question files received on 15 August 2026. Only records cleared by duplicate, near-duplicate, option-count, answer-index, and malformed-card safeguards were released; holds remain excluded.";

const audit = JSON.parse(await readFile(auditPath, "utf8")) as AuditReceipt;
if (!ENV.ownerOpenId) throw new Error("Owner account configuration is unavailable.");
await upsertUser({ openId: ENV.ownerOpenId, name: ENV.ownerName ?? "JAMB Quest owner", role: "admin" });
const owner = await getUserByOpenId(ENV.ownerOpenId);
const db = await getDb();
if (!owner || !db) throw new Error("Owner account or database is unavailable.");

const [existingSource] = await db.select({ id: questionSources.id }).from(questionSources).where(eq(questionSources.label, sourceLabel)).limit(1);
let imported = 0;
let sourceId = existingSource?.id ?? null;
if (!sourceId) {
  const questions = audit.safeUniqueRecords.map((record) => ({
    externalId: `owner-aug15-${record.subject.toLowerCase()}-${record.sourceFile.replace(/[^a-z0-9]+/gi, "-")}-${record.questionNo}`,
    subject: record.subject,
    topic: record.topic,
    difficulty: "medium" as const,
    question: record.question,
    options: record.options,
    answerIndex: record.answerIndex,
    explanation: record.explanation,
  }));
  const payload = authorisedImportSchema.parse({
    sourceLabel,
    permissionNote,
    fileName: "physics_100.md; biology_100.md; chemistry_100.md",
    storageKey: "owner-upload://physics_100.md;biology_100.md;chemistry_100.md",
    questions,
  });
  const result = await importAuthorisedQuestionSet(owner.id, payload);
  sourceId = result.sourceId;
  imported = result.questionCount;
  await db.update(questionItems).set({ explanationStatus: "approved" }).where(eq(questionItems.sourceId, sourceId));
}

const receipt = {
  sourceLabel,
  auditSummary: audit.summary,
  withheld: {
    structuralHolds: audit.structuralHolds.length,
    exactDuplicates: audit.exactDuplicates.length,
    nearDuplicates: audit.nearDuplicates.length,
    batchDuplicates: audit.batchDuplicates.length,
  },
  released: audit.safeUniqueRecords.length,
  imported,
  skippedExistingSource: Boolean(existingSource),
  sourceId,
};
await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt, null, 2));
process.exit(0);
