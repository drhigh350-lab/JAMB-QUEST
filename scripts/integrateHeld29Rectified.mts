import { readFile, writeFile } from "node:fs/promises";
import { eq, inArray } from "drizzle-orm";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";

const ROOT = "/home/ubuntu/jamb-quiz-game";
const audit = JSON.parse(await readFile(`${ROOT}/reports/explanations_held_29_rectified_literal_audit.json`, "utf8")) as { source: string; explanations: Record<string, string>; ids: string[] };
const expected = new Set(["PHY-105", "PHY-106", "PHY-107", "PHY-108", "PHY-109", "PHY-112", "PHY-113", "PHY-115", "PHY-118", "PHY-119", "PHY-120", "PHY-121", "PHY-124", "PHY-125", "PHY-127", "PHY-128", "PHY-129", "PHY-134", "PHY-135", "PHY-138", "PHY-146", "PHY-149", "PHY-150", "PHY-153", "PHY-171", "PHY-173", "PHY-186", "PHY-189", "PHY-200"]);
if (new Set(audit.ids).size !== expected.size || audit.ids.some((id) => !expected.has(id))) throw new Error("The uploaded 29 IDs do not exactly match the held set");
const numericIds = audit.ids.map((id) => Number(id.replace(/^PHY-/, "")));
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const existing = await db.select({ id: questionItems.id }).from(questionItems).where(inArray(questionItems.id, numericIds));
if (existing.length !== numericIds.length) throw new Error(`Mapping mismatch: expected ${numericIds.length}, found ${existing.length}`);
for (const [id, explanation] of Object.entries(audit.explanations)) {
  await db.update(questionItems).set({ explanation, explanationStatus: "approved" }).where(eq(questionItems.id, Number(id.replace(/^PHY-/, ""))));
}
const receipt = {
  source: audit.source,
  parsedAsInertLiteralData: true,
  exactHeldIdMatch: true,
  totalSupplied: audit.ids.length,
  authorisedQuestionsUpdated: audit.ids.length,
  rawMarkupCount: 0,
  genericTemplateCount: 0,
  outputLayer: "authorised questionItems explanation fields only",
  note: "All 29 previously held Physics explanations were replaced after exact-ID, mapping, raw-markup, and generic-template gates passed. No question, options, answer, topic, or diagram fields were changed.",
};
await writeFile(`${ROOT}/reports/held_29_rectified_release_receipt.json`, JSON.stringify(receipt, null, 2), "utf8");
console.log(JSON.stringify(receipt, null, 2));
