import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../client/src");

describe("JAMB Quest opening sequence", () => {
  it("uses the official four-part mark and system-led copy with a skip control", () => {
    const component = readFileSync(resolve(root, "components/QuestOpening.tsx"), "utf8");
    expect(component).toContain("Build your system.");
    expect(component).toContain("Win JAMB.");
    expect(component).toContain("Skip intro");
    expect(component).toContain("quest-opening-mark");
    const styles = readFileSync(resolve(root, "index.css"), "utf8");
    expect(styles).toContain("prefers-reduced-motion");
  });

  it("mounts the opening sequence above the original application shell", () => {
    const app = readFileSync(resolve(root, "App.tsx"), "utf8");
    expect(app).toContain("QuestOpening");
    expect(app).toContain("showOpening");
  });
});
