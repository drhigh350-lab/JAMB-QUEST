import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("diagram preview navigation", () => {
  it("uses in-page viewing and retry controls", () => {
    const component = readFileSync(resolve(process.cwd(), "client/src/components/OwnerDiagramAudit.tsx"), "utf8");
    expect(component).toContain("owner-diagram-lightbox");
    expect(component).toContain("Try again");
    expect(component).toContain("View picture larger");
    expect(component).toContain("diagramRetry");
    expect(component).toContain("setReloadToken");
    expect(component).not.toContain('target="_blank"');
    expect(component).not.toContain("href={src}");
  });
});
