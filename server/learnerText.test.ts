import { describe, expect, it } from "vitest";
import { formatLearnerText } from "../client/src/game/learnerText";

describe("learner text formatting", () => {
  it("renders numerical scientific exponents in readable Unicode notation", () => {
    expect(formatLearnerText("F^6 = 64 and H2O^2- is charged.")).toBe("F⁶ = 64 and H2O²⁻ is charged.");
  });

  it("formats exponents after grouped expressions without changing ordinary source text", () => {
    expect(formatLearnerText("(x + y)^2 while a^n remains symbolic.")).toBe("(x + y)² while a^n remains symbolic.");
  });

  it("keeps already-formatted and unavailable text safe", () => {
    expect(formatLearnerText("F⁶")).toBe("F⁶");
    expect(formatLearnerText(undefined)).toBe("");
  });

  it("converts raw LaTeX temperatures, units, and chemistry indices into readable learner text", () => {
    expect(formatLearnerText("25^\\circ\\text{C} and 1\\text{atm}")).toBe("25°C and 1atm");
    expect(formatLearnerText("100^\\circ\\text{C} and 760\\text{ mmHg}")).toBe("100°C and 760 mmHg");
    expect(formatLearnerText("H_2\\text{O} + SO_4^{2-}")).toBe("H₂O + SO₄²⁻");
  });

  it("converts common equation markup without exposing raw command syntax", () => {
    expect(formatLearnerText("\\frac{1}{2}\\pi r^2 \\times 4")).toBe("1/2π r² × 4");
    expect(formatLearnerText("\\Delta H \\rightleftharpoons \\infty")).toBe("Δ H ⇌ ∞");
  });
});
