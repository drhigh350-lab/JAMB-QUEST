import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("./", import.meta.url);
const read = (relativePath: string) => readFileSync(new URL(relativePath, root), "utf8");

describe("held diagram safety boundary", () => {
  it("keeps figure-dependent records without original visuals in a read-only owner query", () => {
    const db = read("db.ts");
    const router = read("routers.ts");

    expect(db).toContain("export async function getOwnerHeldDiagramRecords()");
    expect(db).toContain("isNull(questionItems.diagramUrl)");
    expect(db).toContain("requiresDiagramAsset(normaliseQuestionStem(record.questionText))");
    expect(router).toContain("heldDiagramRecords: adminProcedure.query(() => getOwnerHeldDiagramRecords())");
  });

  it("keeps the internal safety query out of the visible Profile experience", () => {
    const app = read("../client/src/App.tsx");
    const home = read("../client/src/pages/Home.tsx");
    const css = read("../client/src/field-notes-overrides.css");

    expect(app).not.toContain("heldDiagramRecords.useQuery");
    expect(home).not.toContain("HELD DIAGRAM DESK");
    expect(home).not.toContain("Held — reconstruction safety review required");
    expect(home).not.toContain("ownerHeldDiagramRecords");
    expect(css).not.toContain("owner-diagram-desk");
  });
});
