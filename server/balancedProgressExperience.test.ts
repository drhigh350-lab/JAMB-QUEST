import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("balanced Progress experience", () => {
  it("uses a core-subject focus for the main recommendation while keeping optional novel recovery out of the Home dashboard", () => {
    const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

    expect(app).toContain("coreSubjectFocus={dashboardQuery.data?.performance.coreSubjectFocus ?? null}");
    expect(home).toContain("const balancedCoreFocus");
    expect(home).toContain("const coreWeakTopics");
    expect(home).toContain("Strengthen ${balancedCoreFocus.subject}");
    expect(home).not.toContain("Optional Lekki recovery");
    expect(home).not.toContain('data-testid="lekki-palette"');
    expect(home).toContain("coreWeakTopics.find");
  });
});
