import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("full question-bank audit CSV export", () => {
  it("uses a read-only question-and-source export and retains the current visual-hold audit flags", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/exportFullQuestionBankAuditCsv.mjs"), "utf8");
    expect(script).toContain("FROM questionItems qi");
    expect(script).toContain("LEFT JOIN questionSources qs ON qs.id = qi.sourceId");
    expect(script).toContain("--exclude-lekki-headmaster");
    expect(script).toContain("LOWER(COALESCE(qs.label, '')) LIKE '%lekki headmaster%'");
    expect(script).toContain("LOWER(qi.questionText) LIKE '%lekki headmaster%'");
    expect(script).toContain("explicit_diagram_asset_holds_20260825.json");
    expect(script).toContain("audit_explicit_visual_hold");
    expect(script).toContain("answer_index_zero_based");
    expect(script).toContain("option_e");
    expect(script).toContain("options_json");
    expect(script).toContain('replaceAll("\\n", "\\\\n")');
    expect(script).toContain("allFiveOptionRowsExposeOptionE");
    expect(script).toContain("physicalCsvRowsMatchHeaderPlusQuestions");
    expect(script).not.toContain("UPDATE questionItems");
    expect(script).not.toContain("INSERT INTO");
    expect(script).not.toContain("DELETE FROM");
  });
});
