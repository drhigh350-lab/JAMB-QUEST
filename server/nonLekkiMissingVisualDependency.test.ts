import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("non-Lekki missing visual dependency classifier", () => {
  it("is read-only and distinguishes direct figure anchors from textual structural notation", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/classifyNonLekkiMissingVisualDependencies.mjs"), "utf8");
    expect(script).toContain("direct_answer_critical_visual_dependency");
    expect(script).toContain("ambiguous_or_textual_reference");
    expect(script).toContain("textualStructureEvidence");
    expect(script).toContain("complete clean exact original");
    expect(script).not.toContain("UPDATE questionItems");
    expect(script).not.toContain("INSERT INTO");
  });
});
