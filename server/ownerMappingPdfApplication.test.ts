import { describe, expect, it } from "vitest";

const ownerPdfSafeReplacements = [
  "OWNER-PHY-DIAGRAM-2026-009",
  "OWNER-PHY-DIAGRAM-2026-013",
  "OWNER-BIO-DIAGRAM-2026-004",
  "OWNER-PHY-DIAGRAM-2026-012",
  "OWNER-PHY-DIAGRAM-2026-015",
  "OWNER-BIO-DIAGRAM-2026-006",
  "biology_1111",
];

const ownerPdfHeldForKeyReview = [
  "OWNER-PHY-DIAGRAM-2026-003",
  "OWNER-PHY-DIAGRAM-2026-010",
  "OWNER-BIO-DIAGRAM-2026-007",
  "OWNER-BIO-DIAGRAM-2026-009",
];

const orderedOwnerChemistryImages = [
  ["361452.png", "OWNER-CHEM-DIAGRAM-2026-002"],
  ["361425.png", "OWNER-CHEM-DIAGRAM-2026-004"],
  ["361472.png", "OWNER-CHEM-DIAGRAM-2026-008"],
  ["362228.png", "OWNER-CHEM-DIAGRAM-2026-009"],
] as const;

describe("Question-to-image mapping PDF safeguards", () => {
  it("preserves the owner-given four-image order", () => {
    expect(orderedOwnerChemistryImages).toEqual([
      ["361452.png", "OWNER-CHEM-DIAGRAM-2026-002"],
      ["361425.png", "OWNER-CHEM-DIAGRAM-2026-004"],
      ["361472.png", "OWNER-CHEM-DIAGRAM-2026-008"],
      ["362228.png", "OWNER-CHEM-DIAGRAM-2026-009"],
    ]);
  });

  it("keeps direct owner image files separate from old website links", () => {
    expect(orderedOwnerChemistryImages.every(([file]) => /^\d+\.png$/.test(file))).toBe(true);
  });

  it("keeps direct, unambiguous replacements separate from key conflicts", () => {
    expect(ownerPdfSafeReplacements).toHaveLength(7);
    expect(new Set([...ownerPdfSafeReplacements, ...ownerPdfHeldForKeyReview]).size).toBe(11);
  });

  it("never includes a Lekki Headmaster record in this diagram mapping batch", () => {
    expect([...ownerPdfSafeReplacements, ...ownerPdfHeldForKeyReview].some((id) => /lekki/i.test(id))).toBe(false);
  });
});
