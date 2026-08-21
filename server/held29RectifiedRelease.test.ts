import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type Receipt = {
  parsedAsInertLiteralData: boolean;
  exactHeldIdMatch: boolean;
  totalSupplied: number;
  authorisedQuestionsUpdated: number;
  rawMarkupCount: number;
  genericTemplateCount: number;
};

describe("held 29 rectified Physics release", () => {
  it("records the exact held-set replacement with clean explanations", () => {
    const receipt = JSON.parse(readFileSync("reports/held_29_rectified_release_receipt.json", "utf8")) as Receipt;
    expect(receipt.parsedAsInertLiteralData).toBe(true);
    expect(receipt.exactHeldIdMatch).toBe(true);
    expect(receipt.totalSupplied).toBe(29);
    expect(receipt.authorisedQuestionsUpdated).toBe(29);
    expect(receipt.rawMarkupCount).toBe(0);
    expect(receipt.genericTemplateCount).toBe(0);
  });
});
