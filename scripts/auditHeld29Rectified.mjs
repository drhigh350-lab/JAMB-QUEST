import { readFile } from "node:fs/promises";
const held = JSON.parse(await readFile("/home/ubuntu/jamb-quiz-game/reports/rectified_batches_gate_audit.json", "utf8")).genericIds.sort();
const current = JSON.parse(await readFile("/home/ubuntu/jamb-quiz-game/reports/explanations_held_29_rectified_literal_audit.json", "utf8"));
const ids = current.ids.sort();
const raw = /\\(?:frac|text|sqrt|times|cdot|leq|geq|rightarrow|left|right|circ|alpha|beta|gamma|Delta)|\$[^$]+\$/;
const generic = /compare each option with the exact condition|other options do not satisfy the same relationship|main skill tested is identifying the governing physical relationship/i;
console.log(JSON.stringify({
  uploadedCount: ids.length,
  heldCount: held.length,
  exactIdMatch: JSON.stringify(ids) === JSON.stringify(held),
  missingIds: held.filter((id) => !ids.includes(id)),
  unexpectedIds: ids.filter((id) => !held.includes(id)),
  rawMarkupIds: Object.entries(current.explanations).filter(([, text]) => raw.test(text)).map(([id]) => id),
  genericResidueIds: Object.entries(current.explanations).filter(([, text]) => generic.test(text)).map(([id]) => id),
  allExplanationStrings: Object.values(current.explanations).every((text) => typeof text === "string" && text.trim().length > 0),
}, null, 2));
