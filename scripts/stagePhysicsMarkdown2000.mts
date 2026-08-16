import { and, eq } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";
import { resolveSyllabusTopic, type SyllabusSubject } from "../shared/syllabusTopicMap";

type Record = { externalId: string; subject: SyllabusSubject; topic: string; difficulty: "easy" | "medium" | "hard"; question: string; options: string[]; answerIndex: number; explanation: string; sourceLabel: string; permissionNote: string };
const input = JSON.parse(await readFile("/home/ubuntu/jamb-import-staging/physics_jamb_2000.validated.json", "utf8")) as Record[];
const model = JSON.parse(await readFile("/home/ubuntu/jamb-import-staging/model_bank_for_duplicate_audit.json", "utf8")) as { questions?: Array<{ subject?: string; question?: string }> };
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const sourceLabel = "Owner-provided Markdown · physics_jamb_2000.md · Physics";
const permissionNote = "Owner-provided Physics Markdown upload. Supplied answer keys and explanations are preserved. The material is presented as user-authorised study content and is not represented as official JAMB wording without separate confirmation.";
const normalise = (value: string) => value.toLowerCase().normalize("NFKC").replace(/[–—]/g, "-").replace(/[^a-z0-9]+/g, " ").trim();
const normaliseOption = (value: string) => value.toLowerCase().normalize("NFKC").replace(/\s+/g, " ").trim();
const existing = await db.select({ subject: questionItems.subject, question: questionItems.questionText }).from(questionItems).innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id)).where(and(eq(questionSources.sourceType, "authorised"), eq(questionSources.isActive, 1)));
const fingerprints = new Set<string>();
for (const row of existing) fingerprints.add(`${row.subject}:${normalise(row.question)}`);
for (const row of model.questions ?? []) if (row.subject && row.question) fingerprints.add(`${row.subject}:${normalise(row.question)}`);
const topicOverrides: Record<string, string> = {
  "current electricity": "Current electricity",
  "electricity": "Current electricity",
  "waves, optics and modern physics": "Waves",
  "thermal physics": "Quantity of heat",
  "mechanics": "Motion",
  "general physics": "Pressure",
  "magnetism and electromagnetism": "Magnets and magnetic fields",
};
const staged: Record[] = [];
const holds: Array<{ externalId: string; reason: string }> = [];
const seen = new Set<string>();
for (const row of input) {
  const key = `${row.subject}:${normalise(row.question)}`;
  if (seen.has(key) || fingerprints.has(key)) { holds.push({ externalId: row.externalId, reason: "duplicate in full active or model bank" }); continue; }
  seen.add(key);
  const raw = row.question.match(/^\[([^\]]+)\]/)?.[1] ?? row.topic;
  const topic = topicOverrides[row.topic.toLowerCase()] ?? resolveSyllabusTopic(row.subject, raw) ?? resolveSyllabusTopic(row.subject, row.topic);
  const explanation = row.explanation.replace(/^>\s*/, "").trim();
  if (!topic) holds.push({ externalId: row.externalId, reason: "topic does not resolve to one official Physics syllabus area" });
  else if (row.options.length !== 4 || row.options.some((option) => !option.trim()) || new Set(row.options.map(normaliseOption)).size !== 4) holds.push({ externalId: row.externalId, reason: "option structure is not four distinct non-empty choices" });
  else if (!Number.isInteger(row.answerIndex) || row.answerIndex < 0 || row.answerIndex > 3) holds.push({ externalId: row.externalId, reason: "answer index is outside the four choices" });
  else if (!explanation || explanation.split(/\r?\n/).filter((line) => line.trim()).length > 5) holds.push({ externalId: row.externalId, reason: "explanation is missing or exceeds five non-empty lines" });
  else staged.push({ ...row, topic, explanation, sourceLabel, permissionNote });
}
const report = { parsed: input.length, releaseReady: staged.length, held: holds.length, byTopic: Object.fromEntries([...new Set(staged.map((row) => row.topic))].map((topic) => [topic, staged.filter((row) => row.topic === topic).length])), holdReasons: Object.fromEntries([...new Set(holds.map((row) => row.reason))].map((reason) => [reason, holds.filter((row) => row.reason === reason).length])) };
await writeFile("/home/ubuntu/jamb-import-staging/physics_jamb_2000.staged.json", `${JSON.stringify(staged, null, 2)}\n`);
await writeFile("/home/ubuntu/jamb-quiz-game/reports/physics_jamb_2000_stage_audit.json", `${JSON.stringify({ ...report, holds }, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
