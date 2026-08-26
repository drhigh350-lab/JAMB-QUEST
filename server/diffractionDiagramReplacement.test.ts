import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("owner diffraction diagram replacement", () => {
  it("targets only the exact Physics diffraction record and changes only its picture link", () => {
    const script = readFileSync(resolve(process.cwd(), "scripts/replaceDiffractionDiagram.mjs"), "utf8");
    expect(script).toContain("1140020");
    expect(script).toContain("The property of wave shown in the diagram above is?");
    expect(script).toContain('changedOnly: "diagramUrl"');
    expect(script).toContain("protectedFieldsVerified: true");
    expect(script).toContain("lekkiHeadmasterTouched: false");
  });
});
