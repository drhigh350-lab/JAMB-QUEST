import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const receipt = JSON.parse(readFileSync("/home/ubuntu/jamb-quiz-game/reports/owner_batches_aug15_import_receipt.json", "utf8")) as {
  sourceLabel: string;
  released: number;
  imported: number;
  withheld: { structuralHolds: number; exactDuplicates: number; nearDuplicates: number; batchDuplicates: number };
};

describe("owner science batches · August 2026", () => {
  it("releases only audited unique four- and five-option records", () => {
    expect(receipt.sourceLabel).toContain("duplicate-safe");
    expect(receipt.released).toBe(242);
    expect(receipt.imported).toBe(242);
    expect(receipt.withheld).toEqual({ structuralHolds: 7, exactDuplicates: 6, nearDuplicates: 3, batchDuplicates: 0 });
  });
});
