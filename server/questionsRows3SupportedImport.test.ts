import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("questions_rows(3) supported import receipt", () => {
  it("records only the approved supported-subject release", () => {
    const receipt = JSON.parse(readFileSync("reports/questions_rows3_supported_import_receipt.json", "utf8")) as {
      imported: number;
      held: number;
      batches: Array<{ imported: number }>;
      heldByReason: Record<string, number>;
    };
    expect(receipt.imported).toBe(1573);
    expect(receipt.held).toBe(700);
    expect(receipt.batches.reduce((sum, batch) => sum + batch.imported, 0)).toBe(1573);
    expect(receipt.heldByReason.topic_not_mapped_to_syllabus).toBe(304);
  });
});
