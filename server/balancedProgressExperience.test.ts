import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("balanced Progress experience", () => {
  it("uses a core-subject focus for the main recommendation while retaining optional Lekki recovery separately", () => {
    const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

    expect(app).toContain("coreSubjectFocus={dashboardQuery.data?.performance.coreSubjectFocus ?? null}");
    expect(home).toContain("const balancedCoreFocus");
    expect(home).toContain("const coreWeakTopics");
    expect(home).toContain("const optionalNovelWeakTopics");
    expect(home).toContain("Strengthen ${balancedCoreFocus.subject}");
    expect(home).toContain("Optional Lekki recovery");
    expect(home).toContain("coreWeakTopics.find");
  });
});
