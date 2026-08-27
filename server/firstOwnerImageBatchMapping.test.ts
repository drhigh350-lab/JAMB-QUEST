import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("first owner image batch mapping receipt", () => {
  it("records the four strong matches and six safely held images", () => {
    const report = readFileSync(resolve(process.cwd(), "reports/first_owner_image_batch_mapping_20260827.md"), "utf8");
    expect(report).toContain("drive-1ztKF6fSA5WpO1vjuQuNHO9HvM4Z188KR-q-7-12");
    expect(report).toContain("OWNER-PHY-DIAGRAM-2026-012");
    expect(report).toContain("OWNER-PHY-DIAGRAM-2026-013");
    expect(report).toContain("OWNER-PHY-DIAGRAM-2026-009");
    expect(report).toContain("Held — two candidates");
    expect(report).toContain("No database picture was changed");
  });
});
