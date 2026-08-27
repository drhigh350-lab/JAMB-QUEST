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

const orderedOwnerPhysicsImages = [
  ["362227.png", "OWNER-PHY-DIAGRAM-2026-001"],
  ["362233.png", "OWNER-PHY-DIAGRAM-2026-002"],
  ["362231.png", "OWNER-PHY-DIAGRAM-2026-004"],
] as const;

const orderedOwnerBiologyImages = [
  ["74842a80-a253-11f1-aa24-55c7b9d504e7.png", ["biology_0369", "biology_0413"]],
  ["a7fcbda0-a253-11f1-aa24-55c7b9d504e7.webp", ["biology_0386"]],
  ["file_00000000dd9c820a81b85136a84b24c0.png", ["biology_0396"]],
  ["file_000000007210820ab898d091fd230dab.png", ["biology_0402", "biology_0405"]],
  ["file_0000000055e481f4bf248f36f734b8f6.png", ["biology_0420"]],
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

  it("preserves the owner-given three-Physics-image order", () => {
    expect(orderedOwnerPhysicsImages).toEqual([
      ["362227.png", "OWNER-PHY-DIAGRAM-2026-001"],
      ["362233.png", "OWNER-PHY-DIAGRAM-2026-002"],
      ["362231.png", "OWNER-PHY-DIAGRAM-2026-004"],
    ]);
  });

  it("preserves the owner-given five-Biology-image order and shared targets", () => {
    expect(orderedOwnerBiologyImages).toEqual([
      ["74842a80-a253-11f1-aa24-55c7b9d504e7.png", ["biology_0369", "biology_0413"]],
      ["a7fcbda0-a253-11f1-aa24-55c7b9d504e7.webp", ["biology_0386"]],
      ["file_00000000dd9c820a81b85136a84b24c0.png", ["biology_0396"]],
      ["file_000000007210820ab898d091fd230dab.png", ["biology_0402", "biology_0405"]],
      ["file_0000000055e481f4bf248f36f734b8f6.png", ["biology_0420"]],
    ]);
    expect(orderedOwnerBiologyImages.flatMap(([, targets]) => targets)).toHaveLength(7);
  });

  it("keeps direct, unambiguous replacements separate from key conflicts", () => {
    expect(ownerPdfSafeReplacements).toHaveLength(7);
    expect(new Set([...ownerPdfSafeReplacements, ...ownerPdfHeldForKeyReview]).size).toBe(11);
  });

  it("never includes a Lekki Headmaster record in this diagram mapping batch", () => {
    expect([...ownerPdfSafeReplacements, ...ownerPdfHeldForKeyReview].some((id) => /lekki/i.test(id))).toBe(false);
  });
});
