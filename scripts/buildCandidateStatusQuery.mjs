import fs from "node:fs";
import path from "node:path";
const root = path.resolve(new URL("..", import.meta.url).pathname);
const audit = JSON.parse(fs.readFileSync(path.join(root, "reports/diagram_candidate_audit.json"), "utf8"));
const ids = audit.records.map((record) => String(record.externalId).replaceAll("'", "''"));
const list = ids.map((id) => `'${id}'`).join(", ");
const query = `SELECT qi.externalId, qi.subject, qi.explanationStatus, qs.isActive FROM questionItems qi JOIN questionSources qs ON qs.id = qi.sourceId WHERE qi.externalId IN (${list}) LIMIT 100;`;
fs.writeFileSync(path.join(root, "reports/withheld_diagram_candidate_status_query.sql"), query + "\n");
console.log(query);
