import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("questions_rows CSV duplicate-safe intake", () => {
  it("records every source row, excludes normalized duplicates, and stages only supported core-subject records", () => {
    const audit = JSON.parse(readFileSync("/home/ubuntu/jamb-quiz-game/reports/questions_rows_1_duplicate_audit.json", "utf8")) as {
      incoming: number; releaseReady: number; duplicates: unknown[]; holds: Array<{ reason: string }>;
    };
    expect(audit.incoming).toBe(1190);
    expect(audit.releaseReady).toBe(742);
    expect(audit.duplicates).toHaveLength(382);
    expect(audit.holds.filter((hold) => hold.reason.startsWith("unsupported subject: Mathematics"))).toHaveLength(30);
  });
});
