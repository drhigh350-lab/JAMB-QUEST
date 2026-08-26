import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("owner fourteen-image diagram queue", () => {
  it("records all 14 supplied image files", () => {
    const queue = readFileSync(resolve(process.cwd(), "reports/owner_fourteen_diagram_mapping_queue_20260826.md"), "utf8");
    for (const id of [
      "owner-chem-diagram-2026-001",
      "owner-chem-diagram-2026-002",
      "owner-chem-diagram-2026-003",
      "owner-chem-diagram-2026-004",
      "owner-chem-diagram-2026-008",
      "owner-bio-diagram-2025-002",
      "owner-bio-diagram-2025-003",
      "owner-bio-diagram-2025-004",
      "owner-bio-diagram-2025-005",
      "owner-bio-diagram-2025-006",
      "owner-bio-diagram-2025-007",
      "owner-bio-diagram-2025-008",
      "owner-bio-diagram-2025-009",
      "chemistry-ideal-gas-schoolngr-original_002271ae.png",
    ]) expect(queue).toContain(id);
  });

  it("keeps the new Kairo targets queued until owner approval", () => {
    const targets = readFileSync(resolve(process.cwd(), "reports/kairo_picture_targets_20260826.md"), "utf8");
    expect(targets).toContain("kairo-csv-chemistry_30bd42");
    expect(targets).toContain("kairo-csv-chemistry_20650b");
    expect(targets).toContain("Keep the new owner image queued");
    expect(targets).toContain("kairo-csv-chemistry_1ea741");
  });
});
