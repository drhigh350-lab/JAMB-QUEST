import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("four owner-requested diagram replacements", () => {
  it("targets only the exact four records and protects all other fields", () => {
    const script = readFileSync(resolve(process.cwd(), "scripts/applyFourOwnerRequestedReplacements.mjs"), "utf8");
    for (const id of [
      "OWNER-BIO-DIAGRAM-2025-004",
      "OWNER-BIO-DIAGRAM-2025-003",
      "kairo-csv-chemistry_ea3781",
      "kairo-csv-chemistry_bcfca8",
    ]) expect(script).toContain(id);
    expect(script).toContain('changedOnly: "diagramUrl"');
    expect(script).toContain("protectedFieldsVerified: true");
    expect(script).toContain("lekkiHeadmasterTouched: false");
  });
});
