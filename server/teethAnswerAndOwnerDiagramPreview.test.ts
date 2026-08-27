import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("teeth answer and owner diagram preview fixes", () => {
  it("guards the exact teeth record and changes the saved answer to option III", () => {
    const script = readFileSync(resolve(process.cwd(), "scripts/correctTeethDiagramAnswerToIII.mjs"), "utf8");
    expect(script).toContain("OWNER-BIO-DIAGRAM-2025-007");
    expect(script).toContain("newAnswerIndex: 1");
    expect(script).toContain("labelled III");
    expect(script).toContain('changedFields: ["answerIndex", "explanation"]');
    expect(script).toContain("lekkiHeadmasterTouched: false");
  });

  it("shows more audit records and handles a preview image failure safely", () => {
    const component = readFileSync(resolve(process.cwd(), "client/src/components/OwnerDiagramAudit.tsx"), "utf8");
    const styles = readFileSync(resolve(process.cwd(), "client/src/components/owner-diagram-audit.css"), "utf8");
    expect(component).toContain("const pageSize = 20;");
    expect(component).toContain("onError={() => setFailed(true)}");
    expect(component).toContain("This picture could not open");
    expect(styles).toContain("max-height: 220px");
  });
});
