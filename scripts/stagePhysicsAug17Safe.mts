import { readFileSync, writeFileSync } from "node:fs";
import { getPlayableAuthorisedQuestions } from "../server/db";

const upload = "/home/ubuntu/upload";
const files = Array.from({ length: 7 }, (_, index) => index === 0 ? "pasted_content.txt" : `pasted_content_${index + 1}.txt`);
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function recoverCompleteObjects(text: string): Record<string, unknown>[] {
  try { return JSON.parse(text) as Record<string, unknown>[]; } catch {
    const records: Record<string, unknown>[] = [];
    let depth = 0, start = -1, inString = false, escaped = false;
    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (inString) { if (escaped) escaped = false; else if (character === "\\") escaped = true; else if (character === '"') inString = false; continue; }
      if (character === '"') { inString = true; continue; }
      if (character === "{") { if (depth === 0) start = index; depth += 1; }
      if (character === "}") { depth -= 1; if (depth === 0 && start >= 0) { records.push(JSON.parse(text.slice(start, index + 1)) as Record<string, unknown>); start = -1; } }
    }
    return records;
  }
}

const audit = JSON.parse(readFileSync("reports/physics_aug17_intake_audit.json", "utf8")) as { records: Array<{ intakeFile: string; intakeIndex: number; status: "candidate" | "hold" }> };
const approvedKeys = new Set(audit.records.filter((record) => record.status === "candidate").map((record) => `${record.intakeFile}#${record.intakeIndex}`));
const livePrompts = new Set((await getPlayableAuthorisedQuestions()).map((record) => normalize(record.question)));
const staged: Array<{ externalId: string; subject: "Physics"; topic: string; difficulty: "medium"; question: string; options: string[]; answerIndex: number; explanation: string; sourceUrl: string }> = [];
const heldDuplicates: Array<{ intakeFile: string; intakeIndex: number; question: string }> = [];
const seen = new Set<string>();

for (const file of files) {
  for (const [offset, raw] of recoverCompleteObjects(readFileSync(`${upload}/${file}`, "utf8")).entries()) {
    const intakeIndex = offset + 1;
    if (!approvedKeys.has(`${file}#${intakeIndex}`)) continue;
    const question = String(raw.question ?? "").trim();
    const fingerprint = normalize(question);
    if (seen.has(fingerprint) || livePrompts.has(fingerprint)) { heldDuplicates.push({ intakeFile: file, intakeIndex, question }); continue; }
    seen.add(fingerprint);
    const options = [raw.option_a, raw.option_b, raw.option_c, raw.option_d].map((option) => String(option ?? "").trim());
    const answerIndex = "ABCD".indexOf(String(raw.answer ?? ""));
    if (answerIndex < 0 || options.some((option) => !option)) throw new Error(`Unexpected malformed staged record ${file}#${intakeIndex}`);
    const sourceId = String(raw.source_url ?? `${file}-${intakeIndex}`).match(/physics\/(\d+)/)?.[1] ?? `${file.replace(/\W/g, "-")}-${intakeIndex}`;
    staged.push({
      externalId: `OWNER-PHY-AUG17-${sourceId}`,
      subject: "Physics",
      topic: String(raw.topic ?? "Physics"),
      difficulty: "medium",
      question,
      options,
      answerIndex,
      explanation: String(raw.explanation ?? "").trim(),
      sourceUrl: String(raw.source_url ?? ""),
    });
  }
}

const receipt = { batch: "owner-supplied Physics 2020–2023 pasted content", status: "staged-pending-import", stagedCount: staged.length, heldDuplicates, questions: staged };
writeFileSync("reports/physics_aug17_safe_stage.json", `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ stagedCount: staged.length, heldDuplicateCount: heldDuplicates.length }, null, 2));
