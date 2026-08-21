import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type Receipt = {
  parsedAsInertLiteralData: boolean;
  totalSupplied: number;
  authorisedQuestionsUpdated: number;
  batch12ReplacementCount: number;
  batch12WasNotDuplicated: boolean;
  batch13NewCount: number;
  batch14NewCount: number;
};

describe("Batch 12–14 explanation release", () => {
  it("records 300 mapped explanation updates and treats Batch 12 as replacements", () => {
    const receipt = JSON.parse(readFileSync("reports/batches12_14_release_receipt.json", "utf8")) as Receipt;
    expect(receipt.parsedAsInertLiteralData).toBe(true);
    expect(receipt.totalSupplied).toBe(300);
    expect(receipt.authorisedQuestionsUpdated).toBe(300);
    expect(receipt.batch12ReplacementCount).toBe(100);
    expect(receipt.batch12WasNotDuplicated).toBe(true);
    expect(receipt.batch13NewCount).toBe(100);
    expect(receipt.batch14NewCount).toBe(100);
  });
});
