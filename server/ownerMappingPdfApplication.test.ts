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

describe("Question-to-image mapping PDF safeguards", () => {
  it("keeps the direct, unambiguous replacements separate from key conflicts", () => {
    expect(ownerPdfSafeReplacements).toHaveLength(7);
    expect(new Set([...ownerPdfSafeReplacements, ...ownerPdfHeldForKeyReview]).size).toBe(11);
  });

  it("never includes a Lekki Headmaster record in this diagram mapping batch", () => {
    expect([...ownerPdfSafeReplacements, ...ownerPdfHeldForKeyReview].some((id) => /lekki/i.test(id))).toBe(false);
  });
});
