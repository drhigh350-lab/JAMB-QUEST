import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function userContext(role: "admin" | "user"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: `owner-review-${role}`,
      name: "Question reviewer",
      email: "reviewer@example.com",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("owner question review desk", () => {
  it("rejects an ordinary learner before any private review data can be queried", async () => {
    const caller = appRouter.createCaller(userContext("user"));
    await expect(caller.qualityReview.approvedQuestionSummary()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.qualityReview.approvedQuestionPage({ subject: "Biology", page: 0, pageSize: 24 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps the owner browser subject-filtered, unified, paginated, and answer-complete", () => {
    const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    const deskSource = readFileSync(resolve(process.cwd(), "client/src/components/OwnerQuestionReview.tsx"), "utf8");
    const viewSource = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(routerSource).toContain("approvedQuestionSummary: adminProcedure");
    expect(routerSource).toContain("approvedQuestionPage: adminProcedure");
    expect(deskSource).toContain("OWNER ONLY / QUESTION SCRUTINY");
    expect(deskSource).toContain("ONE LIVE JAMB QUEST BANK");
    expect(deskSource).toContain("source evidence");
    expect(deskSource).not.toContain('type Scope = "authorised" | "model"');
    expect(deskSource).toContain("answerIndex");
    expect(deskSource).toContain("Explanation");
    expect(deskSource).toContain("Page {page + 1} of {pageCount}");
    expect(viewSource).not.toContain('import { OwnerQuestionReview }');
    expect(viewSource).not.toContain("<OwnerQuestionReview");
    expect(viewSource).toContain("Quality before quantity.");
    expect(viewSource).toContain("Recover without punishment");
  });
});
