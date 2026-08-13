import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { sql } from "drizzle-orm";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";

const fixture = process.env.MARKDOWN_FIXTURE ?? "/home/ubuntu/jamb-import-staging/TechMed_Complete_Question_Bank.validated.json";
const importer = "scripts/importStagedMarkdownSource.mts";
const db = await getDb();
if (!db) throw new Error("Managed database is unavailable");
const [{ before }] = await db.select({ before: sql<number>`count(*)` }).from(questionItems);
const run = (label: string) => {
  const output = execFileSync("pnpm", ["tsx", importer, fixture], { cwd: process.cwd(), encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
  const parsed = JSON.parse(output) as { receipt: Array<{ status: string; questionCount: number }> };
  if (!parsed.receipt.length || parsed.receipt.some((entry) => entry.status !== "skipped")) {
    throw new Error(`${label} was not idempotent: ${output}`);
  }
  return parsed.receipt.reduce((sum, entry) => sum + entry.questionCount, 0);
};
const firstRunRecords = run("First rerun");
const [{ afterFirst }] = await db.select({ afterFirst: sql<number>`count(*)` }).from(questionItems);
const secondRunRecords = run("Second rerun");
const [{ afterSecond }] = await db.select({ afterSecond: sql<number>`count(*)` }).from(questionItems);
const expectedLabels = new Map([
  ["Owner-provided Markdown · TechMed_Complete_Question_Bank.md · Biology", 93],
  ["Owner-provided Markdown · TechMed_Complete_Question_Bank.md · Chemistry", 83],
  ["Owner-provided Markdown · TechMed_Complete_Question_Bank.md · Physics", 42],
]);
const observedLabels = await db.select({ label: questionSources.label, count: sql<number>`count(*)` })
  .from(questionSources).innerJoin(questionItems, sql`${questionItems.sourceId} = ${questionSources.id}`)
  .where(sql`${questionSources.label} in (${sql.join([...expectedLabels.keys()].map((label) => sql`${label}`), sql`, `)})`)
  .groupBy(questionSources.label);
for (const [label, expectedCount] of expectedLabels) {
  const observedCount = Number(observedLabels.find((row) => row.label === label)?.count ?? 0);
  if (observedCount !== expectedCount) throw new Error(`Unexpected source label count for ${label}: ${observedCount}, expected ${expectedCount}`);
}
const duplicateIds = await db.execute(sql`SELECT sourceId, externalId, COUNT(*) AS copies FROM questionItems GROUP BY sourceId, externalId HAVING COUNT(*) > 1`);
const duplicateRows = Array.isArray(duplicateIds) ? duplicateIds[0] : [];
if (Number(before) !== Number(afterFirst) || Number(afterFirst) !== Number(afterSecond)) throw new Error(`Question count changed across reruns: ${before} -> ${afterFirst} -> ${afterSecond}`);
if (duplicateRows.length) throw new Error(`Duplicate question items remain after reruns: ${JSON.stringify(duplicateRows)}`);
const sourceCount = await db.select({ count: sql<number>`count(*)` }).from(questionSources);
console.log(JSON.stringify({ verified: true, fixture, firstRunRecords, secondRunRecords, playableCount: Number(afterSecond), sourceCount: Number(sourceCount[0]?.count ?? 0), expectedSourceLabels: Object.fromEntries(expectedLabels), duplicateExternalIdsWithinSource: 0 }, null, 2));
process.exit(0);
