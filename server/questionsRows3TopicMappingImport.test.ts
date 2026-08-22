import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("questions_rows(3) official-topic mapping release", () => {
  it("imports only deterministically mapped records and preserves unsafe holds", () => {
    const receipt = JSON.parse(readFileSync("reports/questions_rows3_topic_mapping_import_receipt.json", "utf8")) as {
      inputMapped: number; imported: number; held: number; heldByReason: Record<string, number>; skippedExisting: string[];
    };
    expect(receipt.inputMapped).toBe(273);
    expect(receipt.imported).toBe(273);
    expect(receipt.skippedExisting).toEqual([]);
    expect(receipt.held).toBe(31);
    expect(receipt.heldByReason.placeholder_or_missing_context).toBe(8);
    expect(receipt.heldByReason.diagram_or_label_reference_needs_asset_check).toBe(23);
  });
});
