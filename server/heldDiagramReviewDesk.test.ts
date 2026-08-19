import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("./", import.meta.url);
const read = (relativePath: string) => readFileSync(new URL(relativePath, root), "utf8");

describe("held diagram review desk", () => {
  it("keeps figure-dependent records without original visuals in a read-only owner query", () => {
    const db = read("db.ts");
    const router = read("routers.ts");

    expect(db).toContain("export async function getOwnerHeldDiagramRecords()");
    expect(db).toContain("isNull(questionItems.diagramUrl)");
    expect(db).toContain("requiresDiagramAsset(normaliseQuestionStem(record.questionText))");
    expect(router).toContain("heldDiagramRecords: adminProcedure.query(() => getOwnerHeldDiagramRecords())");
  });

  it("shows the desk only to the owner and provides no learner-bank release control", () => {
    const app = read("../client/src/App.tsx");
    const home = read("../client/src/pages/Home.tsx");

    expect(app).toContain('heldDiagramRecords.useQuery(undefined, { enabled: user?.role === "admin"');
    expect(home).toContain("HELD DIAGRAM DESK");
    expect(home).toContain("Held — reconstruction safety review required");
    expect(home).toContain("Read-only safety queue");
    expect(home).toContain("neutral diagram can pass reconstruction and answer-safety review");
    expect(home).not.toMatch(/heldDiagramRecords[\s\S]{0,260}(?:release|publish|approve)/i);
  });
});
