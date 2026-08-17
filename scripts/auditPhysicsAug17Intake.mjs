import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const upload = "/home/ubuntu/upload";
const jsonFiles = Array.from({ length: 7 }, (_, index) => index === 0 ? "pasted_content.txt" : `pasted_content_${index + 1}.txt`);
const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const ambiguity = /\b(wait|actually|i(?:'|’)ll|i think|perhaps|maybe|typical|likely|not match|tricky|closest)\b/i;
const figureDependent = /\b(diagram|figure|shown above|circuit above|graph above|tube equal|pear shaped|solenoid above|mirror.*arranged)\b/i;

function recoverCompleteObjects(text) {
  try {
    return { records: JSON.parse(text), trailingFragment: false };
  } catch {
    const records = [];
    let depth = 0;
    let start = -1;
    let inString = false;
    let escaped = false;
    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') inString = false;
        continue;
      }
      if (character === '"') { inString = true; continue; }
      if (character === "{") { if (depth === 0) start = index; depth += 1; }
      if (character === "}") {
        depth -= 1;
        if (depth === 0 && start >= 0) {
          records.push(JSON.parse(text.slice(start, index + 1)));
          start = -1;
        }
      }
    }
    return { records, trailingFragment: depth !== 0 || start >= 0 };
  }
}

const intakeBoundaries = [];
const records = jsonFiles.flatMap((file) => {
  const recovered = recoverCompleteObjects(readFileSync(resolve(upload, file), "utf8"));
  intakeBoundaries.push({ file, completeRecords: recovered.records.length, trailingFragment: recovered.trailingFragment });
  return recovered.records.map((record, index) => ({ ...record, intakeFile: file, intakeIndex: index + 1 }));
});

const seen = new Map();
const checked = records.map((record) => {
  const options = [record.option_a, record.option_b, record.option_c, record.option_d];
  const issues = [];
  if (record.subject !== "Physics") issues.push("non-Physics subject");
  if (!record.question?.trim()) issues.push("missing question text");
  if (options.some((option) => typeof option !== "string" || !option.trim())) issues.push("missing option");
  if (new Set(options.map(normalize)).size !== 4) issues.push("duplicate option text");
  const answerIndex = "ABCD".indexOf(record.answer);
  if (answerIndex < 0) issues.push("invalid A-D answer key");
  if (ambiguity.test(record.explanation ?? "")) issues.push("self-contradictory or tentative explanation");
  if (figureDependent.test(record.question ?? "") && !record.diagram_url) issues.push("requires supplied figure or answer-aligned replacement visual");
  const fingerprint = normalize(record.question ?? "");
  const first = seen.get(fingerprint);
  if (first) issues.push(`duplicate prompt of ${first.intakeFile}#${first.intakeIndex}`);
  else seen.set(fingerprint, record);
  return {
    intakeFile: record.intakeFile,
    intakeIndex: record.intakeIndex,
    year: record.year,
    prompt: record.question,
    sourceUrl: record.source_url,
    topic: record.topic,
    answer: record.answer,
    issues,
    status: issues.length ? "hold" : "candidate",
  };
});

const markdownFiles = ["physics_jamb_2004.md", "physics_jamb_2005.md"];
const markdownInventory = markdownFiles.map((file) => {
  const text = readFileSync(resolve(upload, file), "utf8");
  return {
    file,
    declaredUsable: Number(text.match(/Only (\d+) of \d+ questions usable/)?.[1] ?? 0),
    extractedBlocks: (text.match(/^\*\*\d+\. \[/gm) ?? []).length,
  };
});

const report = {
  batch: "owner-supplied Physics August 17 2026",
  generatedAt: new Date().toISOString(),
  jsonRecordCount: checked.length,
  jsonCandidateCount: checked.filter((record) => record.status === "candidate").length,
  jsonHoldCount: checked.filter((record) => record.status === "hold").length,
  figureDependentCount: checked.filter((record) => record.issues.some((issue) => issue.includes("figure"))).length,
  ambiguousExplanationCount: checked.filter((record) => record.issues.some((issue) => issue.includes("tentative"))).length,
  intakeBoundaries,
  markdownInventory,
  records: checked,
};

writeFileSync("reports/physics_aug17_intake_audit.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  jsonRecordCount: report.jsonRecordCount,
  jsonCandidateCount: report.jsonCandidateCount,
  jsonHoldCount: report.jsonHoldCount,
  figureDependentCount: report.figureDependentCount,
  ambiguousExplanationCount: report.ambiguousExplanationCount,
  intakeBoundaries,
  markdownInventory,
}, null, 2));
