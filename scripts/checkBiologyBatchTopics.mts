import { readFile } from "node:fs/promises";
import { resolveSyllabusTopic } from "../shared/syllabusTopicMap";
const batch = process.argv[2] ?? "002";
const records = JSON.parse(await readFile(`reports/biology_explanation_batch_${batch}_staged.json`, "utf8"));
console.log(records.map((record: any) => ({ externalId: record.externalId, topic: record.topic, resolved: resolveSyllabusTopic("Biology", record.topic) })));
