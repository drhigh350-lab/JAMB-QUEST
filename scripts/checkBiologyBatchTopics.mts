import { readFile } from "node:fs/promises";
import { resolveSyllabusTopic } from "../shared/syllabusTopicMap";
const records = JSON.parse(await readFile("reports/biology_explanation_batch_002_staged.json", "utf8"));
console.log(records.map((record: any) => ({ externalId: record.externalId, topic: record.topic, resolved: resolveSyllabusTopic("Biology", record.topic) })));
