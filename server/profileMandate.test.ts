import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("380 Mandate profile section", () => {
  it("keeps the three owner-defined pledges visible in the Profile tab", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(source).toContain('data-testid="mandate-section"');
    expect(source).toContain("The Error Audit Pledge");
    expect(source).toContain("Never Miss Twice");
    expect(source).toContain("The 100% Correction Mandate");
  });

  it("keeps the mandate panel mobile-readable in the profile stylesheet", () => {
    const styles = readFileSync(resolve(process.cwd(), "client/src/profile.css"), "utf8");
    expect(styles).toContain(".mandate-section");
    expect(styles).toContain(".mandate-pledges");
    expect(styles).toContain(".mandate-benchmarks");
  });
});
