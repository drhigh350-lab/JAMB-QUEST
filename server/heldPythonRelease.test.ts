import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type ReleaseReceipt = {
  parsedAsInertLiteralData: boolean;
  totalSupplied: number;
  released: number;
  held: number;
  modelQuestionsUpdated: number;
  authorisedQuestionsUpdated: number;
};

describe("rectified Python explanation release", () => {
  it("records the gated release without changing the question count", () => {
    const receipt = JSON.parse(readFileSync("reports/rectified_batches_release_receipt.json", "utf8")) as ReleaseReceipt;
    const bank = JSON.parse(readFileSync("/home/ubuntu/webdev-static-assets/jamb_high_yield_practice_bank_1000_explanations_batches2_7_plus_batch9_model_v3_rectified.json", "utf8")) as { questions?: unknown[] };

    expect(receipt.parsedAsInertLiteralData).toBe(true);
    expect(receipt.totalSupplied).toBe(400);
    expect(receipt.released).toBe(371);
    expect(receipt.held).toBe(29);
    expect(receipt.modelQuestionsUpdated).toBe(109);
    expect(receipt.authorisedQuestionsUpdated).toBe(262);
    expect(bank.questions).toHaveLength(1000);
  });
});
