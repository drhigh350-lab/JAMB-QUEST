import { basename } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { questionSources } from "../drizzle/schema";
import { ENV } from "../server/_core/env";
import { getDb, getUserByOpenId, importAuthorisedQuestionSet, upsertUser } from "../server/db";
import { authorisedImportSchema } from "../server/questionImport";

const [inputPath] = process.argv.slice(2);
if (!inputPath) throw new Error("Usage: pnpm tsx scripts/importStagedMarkdownSource.mts <staged-json-path>");

const rawRecords = JSON.parse(await readFile(inputPath, "utf8")) as Array<{
  externalId: string; subject: string; topic: string; difficulty: "easy" | "medium" | "hard"; question: string; options: string[]; answerIndex: number; explanation?: string; sourceLabel: string; permissionNote: string;
}>;
if (!rawRecords.length) throw new Error("The staged Markdown source contains no records.");
if (!ENV.ownerOpenId) throw new Error("Owner account configuration is unavailable.");

await upsertUser({ openId: ENV.ownerOpenId, name: ENV.ownerName ?? "JAMB Quest owner", role: "admin" });
const owner = await getUserByOpenId(ENV.ownerOpenId);
const db = await getDb();
if (!owner || !db) throw new Error("The owner account or database is unavailable.");

const sourceFile = basename(inputPath);
const chunks = Array.from({ length: Math.ceil(rawRecords.length / 500) }, (_, index) => rawRecords.slice(index * 500, (index + 1) * 500));
const receipt: Array<{ sourceLabel: string; questionCount: number; status: "imported" | "skipped" }> = [];

for (const [index, records] of chunks.entries()) {
  const labelSuffix = chunks.length > 1 ? ` · Part ${index + 1} of ${chunks.length}` : "";
  const payload = authorisedImportSchema.parse({
    sourceLabel: `${records[0].sourceLabel}${labelSuffix}`,
    permissionNote: records[0].permissionNote,
    fileName: sourceFile,
    storageKey: `owner-markdown://${sourceFile}`,
    questions: records.map(({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation }) => ({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation })),
  });
  const [existing] = await db.select({ id: questionSources.id }).from(questionSources).where(eq(questionSources.label, payload.sourceLabel)).limit(1);
  if (existing) {
    receipt.push({ sourceLabel: payload.sourceLabel, questionCount: payload.questions.length, status: "skipped" });
    continue;
  }
  const result = await importAuthorisedQuestionSet(owner.id, payload);
  receipt.push({ sourceLabel: result.sourceLabel, questionCount: result.questionCount, status: "imported" });
}

await writeFile("/home/ubuntu/jamb-import-staging/markdown_import_receipt.json", `${JSON.stringify({ sourceFile, totalRecords: rawRecords.length, receipt }, null, 2)}\n`);
