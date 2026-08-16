import { eq } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { ENV } from "../server/_core/env";
import { getDb, getUserByOpenId, importAuthorisedQuestionSet, upsertUser } from "../server/db";
import { authorisedImportSchema } from "../server/questionImport";

type StagedRecord = {
  externalId: string;
  subject: "Use of English" | "Biology" | "Chemistry" | "Physics";
  topic: string;
  difficulty: "medium";
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  sourceLabel: string;
  permissionNote: string;
};

const stagedPath = "/home/ubuntu/jamb-import-staging/supplied_answer_key_pairs_aug16_staged.json";
const receiptPath = "/home/ubuntu/jamb-quiz-game/reports/supplied_answer_key_pair_import_receipt.json";
const staged = JSON.parse(await readFile(stagedPath, "utf8")) as StagedRecord[];
if (!ENV.ownerOpenId) throw new Error("Owner account configuration is unavailable.");
await upsertUser({ openId: ENV.ownerOpenId, name: ENV.ownerName ?? "JAMB Quest owner", role: "admin" });
const owner = await getUserByOpenId(ENV.ownerOpenId);
const db = await getDb();
if (!owner || !db) throw new Error("Owner account or database is unavailable.");
const sourceLabel = staged[0]?.sourceLabel ?? "JAMB Quest · supplied keyed answer pairs · August 2026";
const [existingSource] = await db.select({ id: questionSources.id }).from(questionSources).where(eq(questionSources.label, sourceLabel)).limit(1);
let imported = 0;
let sourceId = existingSource?.id ?? null;
if (!sourceId) {
  const payload = authorisedImportSchema.parse({
    sourceLabel,
    permissionNote: staged[0]?.permissionNote ?? "Owner-supplied keyed answer-pair intake with full-bank duplicate prevention and official-topic gates.",
    fileName: "english_2004.py; english_2004_answers_p1.py; biology_2004.py; biology_2004_answers.py; chemistry_2021.py; chemistry_2021_answers.py",
    storageKey: "owner-upload://supplied-keyed-answer-pairs-aug16",
    questions: staged,
  });
  const result = await importAuthorisedQuestionSet(owner.id, payload);
  sourceId = result.sourceId;
  imported = result.questionCount;
  await db.update(questionItems).set({ explanationStatus: "approved" }).where(eq(questionItems.sourceId, sourceId));
}
const receipt = {
  sourceLabel,
  staged: staged.length,
  imported,
  skippedExistingSource: Boolean(existingSource),
  sourceId,
  bySubject: Object.fromEntries(["Use of English", "Biology", "Chemistry", "Physics"].map((subject) => [subject, staged.filter((item) => item.subject === subject).length])),
  heldOutsideImport: [{ externalId: "supplied-keyed-2004-biology-016", reason: "no safe official syllabus mapping" }],
};
await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt, null, 2));
process.exit(0);
