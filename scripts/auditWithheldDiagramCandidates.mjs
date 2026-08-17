import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const audit = JSON.parse(fs.readFileSync(path.join(root, "reports/diagram_candidate_audit.json"), "utf8"));
const records = audit.records;
const sourceFigureTerms = /labelled|labelled|arrow|shown|diagram|figure|apparatus above|apparatus below|illustration/i;
const safeOptionalTerms = /food chain|nitrogen fixation|earthworm|hibiscus|skeletal material|reproductive system|bone|humidity|osmosis|epiglottis|double fertilization|brain|malpighian|carbon cycle|iris|ovary|photic|germination|ecotone|pollination|pollen|gamete|biome|fertilization|insects|incomplete dominance|diffusion|tooth decay|petroleum|haloalkane|cracking|galvanization|benzene|tin|ozone|electrolyte/i;
const rows = records.map((record) => {
  const requiresOriginal = sourceFigureTerms.test(record.question) && !safeOptionalTerms.test(record.question);
  return { ...record, classification: requiresOriginal ? "requires-original-source-figure" : "safe-optional-schematic" };
});
const bySubject = Object.fromEntries(["Biology", "Chemistry", "Physics", "Use of English"].map((subject) => {
  const subjectRows = rows.filter((row) => row.subject === subject);
  return [subject, { total: subjectRows.length, safeOptionalSchematic: subjectRows.filter((row) => row.classification === "safe-optional-schematic").length, requiresOriginalSourceFigure: subjectRows.filter((row) => row.classification === "requires-original-source-figure").length }];
}));
const report = { generatedAt: new Date().toISOString(), candidateCount: rows.length, bySubject, classifications: rows };
fs.writeFileSync(path.join(root, "reports/withheld_diagram_candidate_classification_aug17.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ candidateCount: report.candidateCount, bySubject: report.bySubject }, null, 2));
