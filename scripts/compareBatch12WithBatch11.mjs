import { readFile } from "node:fs/promises";
const batch12 = JSON.parse(await readFile("/home/ubuntu/jamb-quiz-game/reports/explanations_batch12_literal_audit.json", "utf8")).explanations;
const batch11 = JSON.parse(await readFile("/home/ubuntu/jamb-quiz-game/reports/explanations_batch11_rectified_literal_audit.json", "utf8")).explanations;
const changed = [];
for (const [id, explanation] of Object.entries(batch12)) {
  if (batch11[id] !== explanation) changed.push({ id, previous: batch11[id] ?? null, current: explanation });
}
console.log(JSON.stringify({ total: Object.keys(batch12).length, unchanged: Object.keys(batch12).length - changed.length, changedCount: changed.length, changedIds: changed.map((item) => item.id), samples: changed.slice(0, 3) }, null, 2));
