import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("keyed master-bank PDF intake", () => {
  it("releases only the duplicate-safe, official-topic-mapped records and retains documented holds", () => {
    const audit = JSON.parse(readFileSync(resolve(root, "reports/jamb_500_master_bank_pdf_audit.json"), "utf8"));
    expect(audit.parsedKeyedRecords).toBe(400);
    expect(audit.releaseReady).toBe(393);
    expect(audit.duplicates).toHaveLength(4);
    expect(audit.holds).toEqual(expect.arrayContaining([
      expect.objectContaining({ externalId: "jamb-500-master-english-023", reason: "no safe official syllabus mapping" }),
      expect.objectContaining({ externalId: "jamb-500-master-english-038", reason: "no safe official syllabus mapping" }),
      expect.objectContaining({ externalId: "jamb-500-master-english-060", reason: "duplicate option text" }),
    ]));
    expect(audit.bySubject).toEqual({ "Use of English": 95, Biology: 99, Chemistry: 100, Physics: 99 });
  });
});
