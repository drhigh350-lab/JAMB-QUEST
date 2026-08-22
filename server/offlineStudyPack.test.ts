import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("downloadable offline study pack", () => {
  it("stores authorised questions and same-origin diagram assets outside the disposable shell cache", () => {
    const pack = readFileSync("client/src/lib/offlineStudyPack.ts", "utf8");
    const worker = readFileSync("client/public/sw.js", "utf8");
    expect(pack).toContain('const STUDY_PACK_CACHE = "jamb-quest-study-pack-v9"');
    expect(pack).toContain("downloadOfflineStudyPack");
    expect(pack).toContain("question.diagram_url");
    expect(pack).toContain("navigator.storage?.persist");
    expect(worker).toContain('const STUDY_PACK_CACHE = "jamb-quest-study-pack-v9"');
    expect(worker).toContain("key !== STUDY_PACK_CACHE");
  });

  it("exposes download, refresh, and removal controls from the installed-app panel", () => {
    const panel = readFileSync("client/src/components/OfflineStudyPackPanel.tsx", "utf8");
    expect(panel).toContain("Download full study bank");
    expect(panel).toContain("Update downloaded bank");
    expect(panel).toContain("Remove download");
    expect(panel).toContain("data-free practice");
  });
});
