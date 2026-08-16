import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("supplied answer-key pair intake", () => {
  it("records the validated release and protected hold counts", () => {
    const audit = JSON.parse(readFileSync(resolve(root, "reports/supplied_answer_key_pair_stage_audit.json"), "utf8"));
    const receipt = JSON.parse(readFileSync(resolve(root, "reports/supplied_answer_key_pair_import_receipt.json"), "utf8"));
    expect(audit.parsedRecords).toBe(125);
    expect(audit.releaseReady).toBe(86);
    expect(audit.duplicates).toHaveLength(38);
    expect(audit.holds).toEqual([{ externalId: "supplied-keyed-2004-biology-016", subject: "Biology", sourceQuestionNumber: 16, reason: "no safe official syllabus mapping" }]);
    expect(audit.bySubject).toEqual({ "Use of English": 24, Biology: 49, Chemistry: 13, Physics: 0 });
    expect(receipt.imported).toBe(86);
    expect(receipt.skippedExistingSource).toBe(false);
  });
});
