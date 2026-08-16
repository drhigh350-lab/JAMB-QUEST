import { and, eq } from "drizzle-orm";
import { writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";
import { resolveSyllabusTopic, type SyllabusSubject } from "../shared/syllabusTopicMap";

const db = await getDb();
if (!db) throw new Error("Database unavailable");
const rows = await db.select({ id: questionItems.id, topic: questionItems.topic, status: questionItems.explanationStatus, question: questionItems.questionText, source: questionSources.label }).from(questionItems).innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id)).where(and(eq(questionSources.sourceType, "authorised"), eq(questionSources.isActive, 1), eq(questionItems.subject, "Chemistry")));
const unmapped = rows.filter((row) => !resolveSyllabusTopic("Chemistry" as SyllabusSubject, row.topic));
const report = { total: rows.length, mapped: rows.length - unmapped.length, unmapped: unmapped.length, records: unmapped };
await writeFile("reports/chemistry_topic_coverage_audit.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ total: report.total, mapped: report.mapped, unmapped: report.unmapped }, null, 2));
