import { readFile, writeFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";

type Candidate = { id: string; subject: string; topic: string; question: string };
const normalise = (value: string) => value.toLocaleLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
const payload = JSON.parse(await readFile("reports/questions_rows3_clean_supported_payload.json", "utf8")) as { records: Candidate[] };
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const rows = await db.select({ externalId: questionItems.externalId, questionText: questionItems.questionText, sourceLabel: questionSources.label })
  .from(questionItems)
  .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id));
const imported = new Set(rows.filter((row) => row.sourceLabel.startsWith("Owner CSV questions_rows(3) · Clean supported release")).map((row) => row.externalId?.toLowerCase()).filter(Boolean) as string[]);
const nonNewStemKeys = new Set(rows.filter((row) => !row.sourceLabel.startsWith("Owner CSV questions_rows(3) · Clean supported release")).map((row) => normalise(row.questionText)));
const held = payload.records.filter((record) => !imported.has(record.id.toLowerCase()) && !nonNewStemKeys.has(normalise(record.question)));
const topicGroups = Object.entries(held.reduce<Record<string, { subject: string; count: number; ids: string[]; examples: string[] }>>((acc, record) => {
  const key = `${record.subject}::${record.topic}`;
  const entry = acc[key] ?? { subject: record.subject, count: 0, ids: [], examples: [] };
  entry.count += 1;
  entry.ids.push(record.id);
  if (entry.examples.length < 3) entry.examples.push(record.question);
  acc[key] = entry;
  return acc;
}, {})).map(([key, value]) => ({ key, topic: key.split("::")[1], ...value })).sort((a, b) => a.subject.localeCompare(b.subject) || a.topic.localeCompare(b.topic));
const report = { heldCount: held.length, topicGroups, held }; 
await writeFile("reports/questions_rows3_topic_hold_inventory.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ heldCount: held.length, topicGroups }, null, 2));
process.exit(0);
