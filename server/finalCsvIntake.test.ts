import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("final Kairo CSV intake", () => {
  it("records a duplicate-safe, two-batch import that clears the 5,000 playable-question milestone", () => {
    const stage = JSON.parse(readFileSync(resolve(root, "reports/final_csv_stage_audit_aug16.json"), "utf8"));
    const receipt = JSON.parse(readFileSync(resolve(root, "reports/final_csv_import_receipt_aug16.json"), "utf8"));
    const runtime = JSON.parse(readFileSync(resolve(root, "reports/subject_breakdown_aug17.json"), "utf8"));
    expect(stage.releaseReady).toBe(585);
    expect(stage.duplicateRows).toBe(1319);
    expect(receipt.releaseAfterRecheck).toBe(585);
    expect(receipt.imported).toBe(585);
    expect(receipt.holds).toEqual([]);
    expect(receipt.chunks.map((chunk: { imported: number }) => chunk.imported)).toEqual([500, 85]);
    expect(runtime.learnerFacingTotal).toBe(5849);
  });
});
