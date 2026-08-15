import { eq } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { ENV } from "../server/_core/env";
import { getDb, getUserByOpenId, importAuthorisedQuestionSet, upsertUser } from "../server/db";
import { authorisedImportSchema } from "../server/questionImport";

const inputPaths = [
  "/home/ubuntu/jamb-import-staging/chemistry_past_questions_aug15_2026.validated.json",
  "/home/ubuntu/jamb-import-staging/chemistry_past_questions_aug15_part2_25_50.validated.json",
];
const sourceLabel = "JAMB Quest Chemistry Bank · Trusted owner batch · August 2026";
const permissionNote = "Trusted owner-provided Chemistry batch, supplied in two overlapping parts on 15 August 2026. Directly released at the owner’s instruction after automatic duplicate and card-shape safeguards.";
const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");
const metadataPattern = /(?:✓|©|\bcorrect\s+answer\s*:|\bexplanation\s*:|\bwhy\s+others?\s+are\s+wrong\s*:)/i;

type IncomingRecord = {
  externalId: string;
  subject: "Chemistry";
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
};

const incoming = (await Promise.all(inputPaths.map(async (path) => JSON.parse(await readFile(path, "utf8")) as IncomingRecord[]))).flat();
const seen = new Set<string>();
const structuralHolds: Array<{ externalId: string; reason: string }> = [];
const release: IncomingRecord[] = [];

for (const record of incoming) {
  const fingerprint = `${record.subject}:${normalise(record.question)}`;
  if (seen.has(fingerprint)) continue;
  seen.add(fingerprint);
  if (!record.question.trim()) structuralHolds.push({ externalId: record.externalId, reason: "missing question" });
  else if (!Array.isArray(record.options) || record.options.length !== 4 || record.options.some((option) => !option.trim() || metadataPattern.test(option))) structuralHolds.push({ externalId: record.externalId, reason: "invalid or malformed options" });
  else if (!Number.isInteger(record.answerIndex) || record.answerIndex < 0 || record.answerIndex > 3) structuralHolds.push({ externalId: record.externalId, reason: "invalid answer index" });
  else release.push(record);
}

if (structuralHolds.length) throw new Error(`Trusted batch retained ${structuralHolds.length} structural holds: ${JSON.stringify(structuralHolds.slice(0, 10))}`);
if (release.length !== 50) throw new Error(`Expected 50 unique Chemistry questions after overlap removal; received ${release.length}.`);
if (!ENV.ownerOpenId) throw new Error("Owner account configuration is unavailable.");

await upsertUser({ openId: ENV.ownerOpenId, name: ENV.ownerName ?? "JAMB Quest owner", role: "admin" });
const owner = await getUserByOpenId(ENV.ownerOpenId);
const db = await getDb();
if (!owner || !db) throw new Error("Owner account or database is unavailable.");

const [existing] = await db.select({ id: questionSources.id }).from(questionSources).where(eq(questionSources.label, sourceLabel)).limit(1);
let imported = 0;
let sourceId = existing?.id ?? null;
if (!sourceId) {
  const payload = authorisedImportSchema.parse({
    sourceLabel,
    permissionNote,
    fileName: "chemistry_past_questions_aug15_parts_1_to_50.txt",
    storageKey: "owner-markdown://chemistry_past_questions_aug15_parts_1_to_50.txt",
    questions: release.map((record) => ({ ...record, explanation: record.explanation ?? undefined })),
  });
  const result = await importAuthorisedQuestionSet(owner.id, payload);
  sourceId = result.sourceId;
  imported = result.questionCount;
  await db.update(questionItems).set({ explanationStatus: "approved" }).where(eq(questionItems.sourceId, sourceId));
}

const receipt = {
  sourceLabel,
  incomingRecords: incoming.length,
  overlapDuplicatesRemoved: incoming.length - release.length,
  structuralHolds,
  imported,
  skippedExistingSource: Boolean(existing),
  released: release.length,
  sourceId,
};
await writeFile("/home/ubuntu/jamb-import-staging/trusted_chemistry_aug15_import_receipt.json", `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt, null, 2));
