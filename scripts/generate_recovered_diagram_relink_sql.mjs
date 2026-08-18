import { readFileSync, writeFileSync } from "node:fs";

const output = readFileSync("/tmp/recovered-original-diagram-uploads.txt", "utf8");
const matches = [...output.matchAll(/\/([^/]+)\.png -> (\/manus-storage\/[^\s]+\.png)/g)];
const mappings = matches.map(([, basename, url]) => ({ externalId: basename.toUpperCase(), url }));

if (mappings.length !== 46 || new Set(mappings.map((item) => item.externalId)).size !== 46) {
  throw new Error(`Expected exactly 46 unique uploaded assets, received ${mappings.length}`);
}

const quotedIds = mappings.map(({ externalId }) => `'${externalId}'`).join(", ");
const caseArms = mappings.map(({ externalId, url }) => `WHEN '${externalId}' THEN '${url}'`).join("\n  ");
const sql = `UPDATE questionItems\nSET explanationStatus = 'approved',\n    diagramUrl = CASE externalId\n  ${caseArms}\n  ELSE diagramUrl\nEND\nWHERE externalId IN (${quotedIds});\n`;

writeFileSync("/tmp/recovered-original-diagram-relink.sql", sql);
console.log(`Generated relink SQL for ${mappings.length} records.`);
