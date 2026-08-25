import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const inventory = JSON.parse(await fs.readFile(path.join(projectRoot, "reports", "learner_diagram_inventory_20260825.json"), "utf8"));
const assetAudit = JSON.parse(await fs.readFile(path.join(projectRoot, "reports", "learner_diagram_asset_checks_20260825.json"), "utf8"));
const output = path.join(projectRoot, "reports", "learner_diagram_classification_20260825.json");

const assetById = new Map(assetAudit.checks.map((check) => [check.id, check]));
const explicitSourceFigure = /^\s*\[(?:DIAGRAM|Refers to)/i;
const explicitVisualWording = /\b(diagram|figure|graph|chart|illustration|shown above|shown below|following diagram|following figure|following graph|represented by|points? to)\b/i;
const sourceScreenCapture = /OWNER-(?:BIO|CHEM|PHY)-DIAGRAM/i;

function classify(record) {
  const text = String(record.questionText ?? "");
  const asset = assetById.get(record.id);
  if (record.diagramUrl) {
    const svg = asset?.contentType === "image/svg+xml" && asset?.httpStatus === 200;
    const small = asset?.status === "available" && (asset.width < 240 || asset.height < 160);
    const ownerCapture = sourceScreenCapture.test(record.externalId);
    if (svg) return { decision: "retain_svg", rationale: "HTTP-delivered SVG; browser sample rendered correctly." };
    if (small) return { decision: "review_small_asset", rationale: "Linked crop is too narrow or small for a reliable standalone learner visual." };
    if (asset?.status === "available" && ownerCapture) return { decision: "review_source_screenshot", rationale: "Original source screenshot may need framing/legibility review but is not automatically unsafe." };
    if (asset?.status === "available") return { decision: "retain_linked_asset", rationale: "Available linked instructional asset; no automatic answer leakage inferred." };
    return { decision: "verify_asset_delivery", rationale: "Needs browser-capable renderer verification before classification." };
  }
  if (explicitSourceFigure.test(text)) return { decision: "source_required_missing_visual", rationale: "The protected stem explicitly refers to a source figure; no visual can be fabricated." };
  if (explicitVisualWording.test(text)) return { decision: "visual_cue_review", rationale: "Visual wording is present but does not itself prove a required missing asset." };
  return { decision: "not_diagram_dependent", rationale: "Cue-only candidate without a linked asset or explicit source figure." };
}

const records = inventory.records.map((record) => ({ ...record, ...classify(record) }));
const byDecision = records.reduce((counts, record) => {
  counts[record.decision] = (counts[record.decision] ?? 0) + 1;
  return counts;
}, {});
const actionRecords = records.filter((record) => ["review_small_asset", "source_required_missing_visual", "verify_asset_delivery"].includes(record.decision));

const report = {
  generatedAt: new Date().toISOString(),
  scope: "Classification only. No question, option, key, topic, explanation, source, eligibility, or diagram mapping is changed by this report.",
  counts: { totalCandidates: records.length, byDecision },
  actionRecords,
  records,
};
await fs.writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ output, counts: report.counts, actionRecordCount: actionRecords.length }, null, 2));
