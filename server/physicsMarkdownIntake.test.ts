import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("Physics JAMB 2000 Markdown intake", () => {
  it("keeps the supplied 37-card batch structurally safe and playable", () => {
    const stage = JSON.parse(readFileSync(resolve(root, "reports/physics_jamb_2000_stage_audit.json"), "utf8"));
    const receipt = JSON.parse(readFileSync(resolve(root, "reports/physics_jamb_2000_import_receipt.json"), "utf8"));
    const runtime = JSON.parse(readFileSync(resolve(root, "reports/subject_breakdown_aug17.json"), "utf8"));
    expect(stage.parsed).toBe(37);
    expect(stage.releaseReady).toBe(37);
    expect(stage.held).toBe(0);
    expect(receipt.releaseAfterRecheck).toBe(37);
    expect(receipt.imported).toBe(37);
    expect(receipt.holds).toEqual([]);
    expect(runtime.learnerFacingTotal).toBeGreaterThanOrEqual(5849);
  });
});
