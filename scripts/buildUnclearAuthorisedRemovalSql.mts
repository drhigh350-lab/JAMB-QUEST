import { readFile, writeFile } from "node:fs/promises";

const outputFiles = [
  "authorised-biology-explanation-pilot.output.json",
  "authorised-biology-explanation-batch-2.output.json",
  "authorised-accelerated-500.output.json",
  "authorised-final-queue-1.output.json",
];
const ids = new Set<number>();
for (const file of outputFiles) {
  const records = JSON.parse(await readFile(file, "utf8")) as Array<{ id: string; needs_review: boolean }>;
  for (const record of records) {
    if (!record.needs_review) continue;
    const id = Number(record.id.replace(/^authorised-/, ""));
    if (!Number.isInteger(id)) throw new Error(`Invalid ID ${record.id} in ${file}`);
    ids.add(id);
  }
}
const sortedIds = [...ids].sort((a, b) => a - b);
if (sortedIds.length !== 75) throw new Error(`Expected 75 unclear records; found ${sortedIds.length}`);
const sql = `DELETE FROM questionItems WHERE id IN (${sortedIds.join(",")});`;
await writeFile("unclear-authorised-record-removal.sql", `${sql}\n`);
console.log(JSON.stringify({ recordsForRemoval: sortedIds.length, minId: sortedIds[0], maxId: sortedIds.at(-1), output: "unclear-authorised-record-removal.sql" }, null, 2));
