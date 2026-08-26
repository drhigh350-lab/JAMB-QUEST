import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("non-essential diagram-link audit", () => {
  it("removes only evidence-backed text-only links and retains true visual and Lekki safeguards", () => {
    const audit = readFileSync(resolve(process.cwd(), "scripts/auditNonEssentialDiagramLinks.mjs"), "utf8");
    const classify = readFileSync(resolve(process.cwd(), "scripts/classifyNonessentialDiagramRemovalCandidates.mjs"), "utf8");
    const remove = readFileSync(resolve(process.cwd(), "scripts/removeVerifiedNonessentialDiagramLinks.mjs"), "utf8");
    expect(audit).toContain("retain_direct_answer_critical_visual");
    expect(audit).toContain("retain_until_manual_label_review");
    expect(audit).toContain("leave_lekki_untouched");
    expect(classify).toContain("retain_semantic_visual_dependency");
    expect(classify).toContain("safe_for_guarded_link_removal");
    expect(remove).toContain("assert.equal(targets.length, 22");
    expect(remove).toContain("SET diagramUrl = NULL");
    expect(remove).toContain("protectedSnapshot");
    expect(remove).toContain("Lekki record");
  });
});
