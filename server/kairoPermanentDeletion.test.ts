import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("permanent removal of Kairo Chemistry 1ea741", () => {
  it("uses an exact identity and safety guard", () => {
    const receipt = readFileSync(resolve(process.cwd(), "reports/kairo_1ea741_permanent_deletion_receipt_20260826.json"), "utf8");
    expect(receipt).toContain("kairo-csv-chemistry_1ea741");
    expect(receipt).toContain("1050117");
    expect(receipt).toContain("foreignKeyReferencesFound");
    expect(receipt).toContain("lekkiHeadmasterTouched");
    const verify = readFileSync(resolve(process.cwd(), "scripts/verifyKairoPermanentDeletion.mjs"), "utf8");
    expect(verify).toContain("kairo-csv-chemistry_1ea741");
  });
});
