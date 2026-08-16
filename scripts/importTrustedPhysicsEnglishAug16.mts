import { and, eq } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { ENV } from "../server/_core/env";
import { getDb, getUserByOpenId, importAuthorisedQuestionSet, upsertUser } from "../server/db";
import { authorisedImportSchema } from "../server/questionImport";

type Record = {
  externalId: string;
  subject: "Physics" | "Use of English";
  topic: string;
  difficulty: "medium";
  question: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
  sourceLabel: string;
  permissionNote: string;
};

const inputPath = "/home/ubuntu/jamb-import-staging/trusted_physics_english_aug16.staged.json";
const incoming = JSON.parse(await readFile(inputPath, "utf8")) as Record[];
const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");
const metadataPattern = /(?:✓|©|\bcorrect\s+answer\s*:|\bexplanation\s*:|\bwhy\s+others?\s+are\s+wrong\s*:)/i;

if (!ENV.ownerOpenId) throw new Error("Owner account configuration is unavailable");
await upsertUser({ openId: ENV.ownerOpenId, name: ENV.ownerName ?? "JAMB Quest owner", role: "admin" });
const owner = await getUserByOpenId(ENV.ownerOpenId);
const db = await getDb();
if (!owner || !db) throw new Error("Owner account or database is unavailable");

const existing = await db
  .select({ subject: questionItems.subject, questionText: questionItems.questionText })
  .from(questionItems)
  .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.sourceType, "authorised"), eq(questionSources.isActive, 1)));
const existingFingerprints = new Set(existing.map((record) => `${record.subject}:${normalise(record.questionText)}`));

const seen = new Set<string>();
const release: Record[] = [];
const skippedDuplicates: Array<{ externalId: string; reason: string }> = [];
const technicalHolds: Array<{ externalId: string; reason: string }> = [];

for (const record of incoming) {
  const fingerprint = `${record.subject}:${normalise(record.question)}`;
  if (seen.has(fingerprint)) {
    skippedDuplicates.push({ externalId: record.externalId, reason: "duplicate within new trusted staging batch" });
    continue;
  }
  seen.add(fingerprint);
  if (existingFingerprints.has(fingerprint)) {
    skippedDuplicates.push({ externalId: record.externalId, reason: "exact duplicate already exists in active authorised bank" });
    continue;
  }
  const normalisedOptions = record.options.map(normalise);
  if (!record.question.trim()) technicalHolds.push({ externalId: record.externalId, reason: "missing question text" });
  else if (record.options.length < 4 || record.options.length > 5) technicalHolds.push({ externalId: record.externalId, reason: `expected four or five options, found ${record.options.length}` });
  else if (record.options.some((option) => !option.trim() || metadataPattern.test(option))) technicalHolds.push({ externalId: record.externalId, reason: "blank or metadata-contaminated option" });
  else if (new Set(normalisedOptions).size !== normalisedOptions.length) technicalHolds.push({ externalId: record.externalId, reason: "duplicate answer options prevent unambiguous gameplay" });
  else if (!Number.isInteger(record.answerIndex) || record.answerIndex < 0 || record.answerIndex >= record.options.length) technicalHolds.push({ externalId: record.externalId, reason: "answer index is out of range" });
  else release.push(record);
}

const receipt: {
  incoming: number;
  released: number;
  imported: number;
  skippedExistingSources: string[];
  skippedDuplicates: Array<{ externalId: string; reason: string }>;
  technicalHolds: Array<{ externalId: string; reason: string }>;
  sources: Array<{ label: string; released: number; imported: number; sourceId: number | null }>;
} = {
  incoming: incoming.length,
  released: release.length,
  imported: 0,
  skippedExistingSources: [],
  skippedDuplicates,
  technicalHolds,
  sources: [],
};

for (const sourceLabel of [...new Set(release.map((record) => record.sourceLabel))]) {
  const records = release.filter((record) => record.sourceLabel === sourceLabel);
  const [existingSource] = await db.select({ id: questionSources.id }).from(questionSources).where(eq(questionSources.label, sourceLabel)).limit(1);
  if (existingSource) {
    receipt.skippedExistingSources.push(sourceLabel);
    receipt.sources.push({ label: sourceLabel, released: records.length, imported: 0, sourceId: existingSource.id });
    continue;
  }
  const payload = authorisedImportSchema.parse({
    sourceLabel,
    permissionNote: records[0].permissionNote,
    fileName: "trusted_physics_english_aug16.staged.json",
    storageKey: "owner-markdown://trusted_physics_english_aug16.staged.json",
    questions: records.map(({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation }) => ({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation })),
  });
  const result = await importAuthorisedQuestionSet(owner.id, payload);
  await db.update(questionItems).set({ explanationStatus: "approved" }).where(eq(questionItems.sourceId, result.sourceId));
  receipt.imported += result.questionCount;
  receipt.sources.push({ label: sourceLabel, released: records.length, imported: result.questionCount, sourceId: result.sourceId });
}

await writeFile("reports/trusted_physics_english_aug16_import_receipt.json", JSON.stringify(receipt, null, 2) + "\n");
console.log(JSON.stringify(receipt, null, 2));
