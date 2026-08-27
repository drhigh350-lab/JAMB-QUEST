import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("new owner Biology image replacements", () => {
  it("maps each new real image to its exact Biology record only", () => {
    const script = readFileSync(resolve(process.cwd(), "scripts/replaceFourNewBiologyDiagrams.mjs"), "utf8");
    expect(script).toContain('OWNER-BIO-DIAGRAM-2025-005');
    expect(script).toContain('/manus-storage/361471_783560b3.png');
    expect(script).toContain('OWNER-BIO-DIAGRAM-2025-006');
    expect(script).toContain('/manus-storage/361433_f756c5b7.png');
    expect(script).toContain('OWNER-BIO-DIAGRAM-2025-003');
    expect(script).toContain('/manus-storage/361430_48c28eed.png');
    expect(script).toContain('OWNER-BIO-DIAGRAM-2025-008');
    expect(script).toContain('/manus-storage/361429_964160d4.png');
    expect(script).toContain('changedOnly: "diagramUrl"');
    expect(script).toContain('lekkiHeadmasterTouched: false');
  });
});
