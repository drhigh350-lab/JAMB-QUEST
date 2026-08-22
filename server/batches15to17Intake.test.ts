import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Batch 15–17 explanation intake", () => {
  it("holds generic residue and limits the release to gate-cleared explanation fields", () => {
    const gateScript = readFileSync("scripts/auditBatches15to17.mts", "utf8");
    const releaseScript = readFileSync("scripts/integrateBatches15to17Eligible.mts", "utf8");
    const gateReceipt = JSON.parse(readFileSync("reports/batches15_17_gate_audit.json", "utf8")) as {
      totalRecords: number;
      eligibleIds: string[];
      heldIds: string[];
      genericFindings: unknown[];
      missingDatabaseIds: string[];
    };
    const releaseReceipt = JSON.parse(readFileSync("reports/batches15_17_release_receipt.json", "utf8")) as {
      authorisedQuestionsUpdated: number;
      heldByQualityGate: number;
      updatedFields: string[];
      protectedFieldsPreserved: string[];
    };

    expect(gateScript).toContain("generic-deciding-feature-tail");
    expect(gateScript).toContain("rawMarkup");
    expect(gateReceipt.totalRecords).toBe(299);
    expect(gateReceipt.eligibleIds).toHaveLength(11);
    expect(gateReceipt.heldIds).toHaveLength(288);
    expect(gateReceipt.genericFindings.length).toBeGreaterThan(0);
    expect(gateReceipt.missingDatabaseIds).toEqual([]);

    expect(releaseScript).toContain('set({ explanation: entry.explanation, explanationStatus: "approved" })');
    expect(releaseReceipt.authorisedQuestionsUpdated).toBe(11);
    expect(releaseReceipt.heldByQualityGate).toBe(288);
    expect(releaseReceipt.updatedFields).toEqual(["explanation", "explanationStatus"]);
    expect(releaseReceipt.protectedFieldsPreserved).toEqual([
      "questionText",
      "optionsJson",
      "answerIndex",
      "topic",
      "diagramUrl",
      "source metadata",
    ]);
  });
});
