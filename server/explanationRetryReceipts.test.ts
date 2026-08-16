import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const reports = resolve(import.meta.dirname, "../reports");

describe("held explanation batch retries", () => {
  it("records the successful four-line legacy batch 11 update", () => {
    const output = JSON.parse(readFileSync(resolve(reports, "legacy_explanation_batch_011_output.json"), "utf8"));
    const receipt = JSON.parse(readFileSync(resolve(reports, "legacy_explanation_batch_011_apply_receipt.json"), "utf8"));
    expect(output.readyCount).toBe(20);
    expect(output.holdCount).toBe(0);
    expect(receipt.updatedCount).toBe(20);
    expect(receipt.ids).toHaveLength(20);
  });

  it("keeps the previously held Biology batch 2 candidates out of import when all four are active-bank duplicates", () => {
    const receipt = JSON.parse(readFileSync(resolve(reports, "biology_explanation_batch_002_non_duplicate_import_receipt.json"), "utf8"));
    expect(receipt.intended).toBe(4);
    expect(receipt.releaseReady).toBe(0);
    expect(receipt.imported).toBe(0);
    expect(receipt.holds).toHaveLength(4);
    expect(receipt.holds.every((hold: { reason: string }) => hold.reason === "duplicate in active bank")).toBe(true);
  });
});
