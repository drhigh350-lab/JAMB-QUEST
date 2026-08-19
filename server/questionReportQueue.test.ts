import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("private learner question-report queue", () => {
  it("accepts only the approved report reasons through an authenticated learner procedure", () => {
    const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    expect(router).toContain("reportQuestion: protectedProcedure");
    expect(router).toContain('"wrong_answer"');
    expect(router).toContain('"missing_context"');
    expect(router).toContain('"broken_diagram"');
    expect(router).toContain('"confusing_wording"');
    expect(router).toContain('"other"');
  });

  it("stores reports in a private duplicate-safe queue and exposes an in-question report receipt", () => {
    const schema = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
    const database = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
    const card = readFileSync(resolve(process.cwd(), "client/src/components/QuestionCard.tsx"), "utf8");
    expect(schema).toContain('learnerQuestionReports');
    expect(schema).toContain('reportKey: varchar("reportKey", { length: 320 }).notNull().unique()');
    expect(schema).toContain('mysqlEnum("status", ["open", "reviewing", "resolved", "dismissed"])');
    expect(schema).toContain('statusUpdatedAt: timestamp("statusUpdatedAt")');
    expect(database).toContain("reportLearnerQuestion");
    expect(database).toContain('onDuplicateKeyUpdate({ set: { note, status: "open", resolvedByUserId: null');
    expect(database).toContain("getLearnerQuestionReportReceipts");
    expect(database).toContain("getOwnerQuestionReports");
    expect(database).toContain("updateOwnerQuestionReportStatus");
    expect(card).toContain("QUALITY REPORT / PRIVATE");
    expect(card).toContain("Only you and the JAMB Quest owner can see this report");
    expect(card).toContain("Its status appears in your Profile.");
  });

  it("keeps learner receipts protected while gating review actions to an admin procedure", () => {
    const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(router).toContain("myQuestionReports: protectedProcedure");
    expect(router).toContain("questionReports: adminProcedure");
    expect(router).toContain("updateQuestionReportStatus: adminProcedure");
    expect(home).toContain("Only you and the JAMB Quest owner can see these receipts.");
    expect(home).toContain("OWNER REVIEW QUEUE");
  });
});
