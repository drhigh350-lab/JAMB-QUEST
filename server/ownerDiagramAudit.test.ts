import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { isReleasedFromOwnerDiagramAudit } from "./db";
import { appRouter } from "./routers";

function learnerContext(): TrpcContext {
  return { user: { id: 2, openId: "diagram-audit-learner", name: "Learner", email: "learner@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("owner-only diagram audit desk", () => {
  it("refuses ordinary learners before private diagram audit data can be read", async () => {
    const caller = appRouter.createCaller(learnerContext());
    await expect(caller.qualityReview.diagramAuditPage({ subject: "all", state: "all", search: "", page: 0, pageSize: 12 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("uses authoritative data and retains the learner eligibility boundary", () => {
    const db = readFileSync(resolve(import.meta.dirname, "./db.ts"), "utf8");
    const router = readFileSync(resolve(import.meta.dirname, "./routers.ts"), "utf8");
    const component = readFileSync(resolve(import.meta.dirname, "../client/src/components/OwnerDiagramAudit.tsx"), "utf8");
    const home = readFileSync(resolve(import.meta.dirname, "../client/src/pages/Home.tsx"), "utf8");
    expect(db).toContain("getOwnerDiagramAuditPage");
    expect(db).toContain("requiresDiagramAsset(stem)");
    expect(db).toContain("toPlayableAuthorisedQuestion");
    expect(db).toContain("isReleasedFromOwnerDiagramAudit");
    expect(db).toContain("OWNER-BIO-DIAGRAM-2025-007");
    expect(router).toContain("diagramAuditPage: adminProcedure");
    expect(component).toContain("data-testid=\"owner-diagram-audit\"");
    expect(component).toContain("Held from students");
    expect(home).toContain("<OwnerDiagramAudit isOwner={isOwner} />");
  });

  it("removes only the ready first-two-page records from the owner audit queue", () => {
    expect(isReleasedFromOwnerDiagramAudit("biology-dr-high-0012")).toBe(true);
    expect(isReleasedFromOwnerDiagramAudit("OWNER-BIO-DIAGRAM-2025-007")).toBe(true);
    expect(isReleasedFromOwnerDiagramAudit("OWNER-BIO-DIAGRAM-2025-008")).toBe(false);
    expect(isReleasedFromOwnerDiagramAudit("OWNER-PHY-DIAGRAM-2026-007")).toBe(false);
    expect(isReleasedFromOwnerDiagramAudit("lekki-headmaster-001")).toBe(false);
  });
});
