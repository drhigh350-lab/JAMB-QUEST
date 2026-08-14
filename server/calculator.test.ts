import { describe, expect, it } from "vitest";
import { calculateExpression, formatCalculation } from "../client/src/game/calculator";

describe("JAMB calculator engine", () => {
  it("evaluates standard arithmetic with brackets and precedence", () => {
    expect(calculateExpression("2+3*4")).toBe(14);
    expect(calculateExpression("(2+3)*4")).toBe(20);
    expect(calculateExpression("-8/2+5")).toBe(1);
  });

  it("formats decimals and rejects unsafe or incomplete expressions", () => {
    expect(formatCalculation(calculateExpression("1/3"))).toBe("0.333333333333");
    expect(() => calculateExpression("4/0")).toThrow("Cannot divide by zero");
    expect(() => calculateExpression("2+alert(1)")).toThrow("Unsupported input");
    expect(() => calculateExpression("(2+3")).toThrow("Check brackets");
  });
});
