import { describe, expect, it } from "vitest";
import { formatLearnerText } from "../client/src/game/learnerText";

describe("learner text formatting", () => {
  it("renders numerical scientific exponents in readable Unicode notation", () => {
    expect(formatLearnerText("F^6 = 64 and H2O^2- is charged.")).toBe("F⁶ = 64 and H2O²⁻ is charged.");
  });

  it("formats exponents after grouped expressions without changing ordinary source text", () => {
    expect(formatLearnerText("(x + y)^2 while a^n remains symbolic.")).toBe("(x + y)² while a^n remains symbolic.");
  });

  it("renders common Physics variables and grouped exponents without raw underscore or caret notation", () => {
    expect(formatLearnerText("I_rms = V_rms / R and Vc(t=τ) = V_final(1 − e^-1).")).toBe("Iᵣₘₛ = Vᵣₘₛ / R and Vc(t=τ) = V(final)(1 − e⁻¹).");
    expect(formatLearnerText("A = A₀(1/2)^(t/T½) and e^{−t/RC}.")).toBe("A = A₀(1/2)⁽ᵗ⁄ᵀ½⁾ and e⁻ᵗ⁄ᴿᶜ.");
    expect(formatLearnerText("ρ_object / μ_s = f_max")).toBe("ρ(object) / μₛ = fₘₐₓ");
    expect(formatLearnerText("A = A₀(1/2)^(t/T½).")).toBe("A = A₀(1/2)⁽ᵗ⁄ᵀ½⁾.");
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
    expect(formatLearnerText("A \\equiv B and y \\propto x")).toBe("A ≡ B and y ∝ x");
  });

  it("preserves currency while repairing a malformed lost-subscript marker", () => {
    expect(formatLearnerText("Between $100 and $200")).toBe("Between $100 and $200");
    expect(formatLearnerText("Na₂CO₃·10H�2O")).toBe("Na₂CO₃·10H₂O");
  });
});
