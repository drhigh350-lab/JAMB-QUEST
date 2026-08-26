import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const inputPath = path.join(projectRoot, "reports", "nonessential_diagram_link_audit_20260826.json");
const outputPath = path.join(projectRoot, "reports", "nonessential_diagram_link_removal_classification_20260826.json");
const semanticVisualDependency = /\b(?:from|in|on|use)\s+(?:the\s+)?(?:diagram|figure|table|graph|chart)\b|\b(?:diagram|figure|table|graph|chart)\s+(?:shows?|above|below|illustrat(?:es|ed|ion))\b|\bsolubility\s+graph\b|\bformula\s+table\b|\bthe\s+(?:plant|experiment)\s+(?:diagram\s+)?(?:shows?|demonstrates|is\s+set\s+up)\b|\bmagnetic\s+field\s+due\s+to\s+a\b|\b(?:F1|F2)\s+generation\b|\bgenotypic\s+ratio\b/i;

const audit = JSON.parse(await fs.readFile(inputPath, "utf8"));
const candidates = audit.records
  .filter((record) => record.disposition === "candidate_remove_nonessential_link")
  .map((record) => {
    const semanticMatch = record.questionText.match(semanticVisualDependency)?.[0] ?? null;
    return {
      ...record,
      semanticVisualDependency: Boolean(semanticMatch),
      semanticMatch,
      disposition: semanticMatch ? "retain_semantic_visual_dependency" : "safe_for_guarded_link_removal",
    };
  });
const summary = candidates.reduce((result, record) => {
  result[record.disposition] = (result[record.disposition] ?? 0) + 1;
  return result;
}, {});
const report = {
  generatedAt: new Date().toISOString(),
  mode: "Read-only second-pass classification. A safe-for-removal record has no direct/implicit visual anchor and no visual meaning hidden in terms such as graph, table, experiment, magnetic field, or genetic generation.",
  summary,
  safeForGuardedRemoval: candidates.filter((record) => record.disposition === "safe_for_guarded_link_removal"),
  retainedForVisualMeaning: candidates.filter((record) => record.disposition === "retain_semantic_visual_dependency"),
};
await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, summary, safeIds: report.safeForGuardedRemoval.map((record) => record.id), retainedIds: report.retainedForVisualMeaning.map((record) => record.id) }, null, 2));
