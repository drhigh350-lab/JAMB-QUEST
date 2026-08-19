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
});
