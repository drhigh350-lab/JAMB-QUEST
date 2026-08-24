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
    expect(home).toContain("Core focus: ${balancedCoreFocus.subject}");
    expect(home).toContain("It updates after completed attempts.");
    expect(home).toContain('data-testid="daily-report-sheet"');
    expect(home).toContain("This sheet uses today’s saved questions, correct answers, goal progress, and XP only.");
    expect(home).toContain("Repair topics first, then Building. Based only on saved attempts.");
    expect(home).toContain('className="progress-chart-desk"');
    expect(home).not.toContain("Optional Lekki recovery");
    expect(home).not.toContain('data-testid="lekki-palette"');
    expect(home).toContain("coreWeakTopics.slice(0, 4)");
  });
});
