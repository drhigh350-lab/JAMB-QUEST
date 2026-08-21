import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type ReleaseReceipt = {
  uploadedFilesParsedAsInertLiteralData: boolean;
  modelQuestionsUpdated: number;
  authorisedQuestionsUpdated: number;
  batch9GenericTemplateRecordsReleasedByExplicitUserInstruction: number;
};

describe("held Python explanation release", () => {
  it("records the complete explicit release without changing the question count", () => {
    const receipt = JSON.parse(readFileSync("reports/held_python_explanations_release_receipt.json", "utf8")) as ReleaseReceipt;
    const bank = JSON.parse(readFileSync("/home/ubuntu/webdev-static-assets/jamb_high_yield_practice_bank_1000_explanations_batches2_7_plus_batch9_model_v2.json", "utf8")) as { questions?: unknown[] };

    expect(receipt.uploadedFilesParsedAsInertLiteralData).toBe(true);
    expect(receipt.modelQuestionsUpdated).toBe(138);
    expect(receipt.authorisedQuestionsUpdated).toBe(62);
    expect(receipt.batch9GenericTemplateRecordsReleasedByExplicitUserInstruction).toBe(46);
    expect(bank.questions).toHaveLength(1000);
  });
});
