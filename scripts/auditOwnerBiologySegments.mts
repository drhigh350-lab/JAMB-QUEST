import { readFile, writeFile } from "node:fs/promises";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";

const FILES = ["/home/ubuntu/upload/pasted_content_6.txt", "/home/ubuntu/upload/pasted_content_7.txt", "/home/ubuntu/upload/pasted_content_8.txt"] as const;
const STAGED_PATH = "/home/ubuntu/jamb-import-staging/owner_biology_segments_1_25_51_75_76_100_eligible.json";
const REPORT_PATH = "/home/ubuntu/jamb-quiz-game/reports/owner_biology_segments_audit.json";
const MODEL_BANK_URL = "https://jambquiz-kmqgtf9m.manus.space/manus-storage/jamb_high_yield_practice_bank_1000_explanations_batches2_7_plus_batch9_model_v3_rectified_167c6b81.json";
type Candidate = { number: number; category: string; question: string; options: string[]; answerIndex: number; explanation: string; sourceFile: string };
type Hold = { externalId: string; questionNumber: number; reason: string; question: string };
const clean = (value: string) => value.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
const norm = (value: string) => clean(value).toLowerCase().replace(/[–—]/g, "-").replace(/[^a-z0-9]+/g, " ").trim();
const fingerprint = (question: string, options: string[]) => `${norm(question)}\u0000${options.map(norm).join("\u0001")}`;
const compact = (value: string) => clean(value).split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 4).join(" ");
function topicFor(n: number, category: string, question: string) {
  const value = `${category} ${question}`.toLowerCase();
  if (n <= 6 || n === 13) return "Living organisms and organization";
  if (n >= 7 && n <= 12) return "Transport";
  if (n >= 14 && n <= 25) return "Nutrition and digestion";
  if (n >= 51 && n <= 55) return "Support and movement";
  if (n >= 56 && n <= 64) return "Reproduction";
  if (n >= 65 && n <= 67) return "Growth";
  if (n === 70) return "Factors affecting distribution";
  if (n >= 68 && n <= 80) return "Natural habitats";
  if (n >= 81 && n <= 82) return "Population ecology";
  if (n >= 83 && n <= 89) return "Humans and environment";
  if (n >= 90 && n <= 96) return "Heredity";
  if (n === 97) return "Variation";
  if (value.includes("adapt")) return "Adaptations of organisms";
  if (value.includes("evolution") || value.includes("natural selection")) return "Theories of evolution";
  return "Humans and environment";
}
function parse(text: string, sourceFile: string): Candidate[] {
  const headers = [...text.matchAll(/^###[ \t]+(\d+)\.[ \t]*(.*)$/gm)];
  return headers.flatMap((header, index) => {
    const number = Number(header[1]); const category = clean(header[2]);
    const block = text.slice(header.index! + header[0].length, headers[index + 1]?.index ?? text.length);
    const options = [...block.matchAll(/^([A-D])\.\s+(.+?)\s*$/gm)]; const answer = block.match(/\*\*Correct answer:\s*([A-D])/i); const explanation = block.match(/\*\*Explanation:\*\*\s*([\s\S]*?)(?=\n\s*\*\*\*|$)/i);
    if (options.length !== 4 || !answer || !explanation) return [];
    return [{ number, category, question: clean(block.slice(0, options[0].index)), options: options.map((option) => clean(option[2])), answerIndex: "ABCD".indexOf(answer[1].toUpperCase()), explanation: compact(explanation[1]), sourceFile }];
  });
}
const sourceText = await Promise.all(FILES.map(async (file) => ({ file: file.split("/").pop()!, text: await readFile(file, "utf8") })));
const parsed = sourceText.flatMap(({ file, text }) => parse(text, file));
const seen = new Set<string>(); const duplicates: Candidate[] = []; const unique = parsed.filter((candidate) => { const key = fingerprint(candidate.question, candidate.options); if (seen.has(key)) { duplicates.push(candidate); return false; } seen.add(key); return true; });
const modelResponse = await fetch(MODEL_BANK_URL); if (!modelResponse.ok) throw new Error(`Model duplicate screen failed (${modelResponse.status}).`);
const model = await modelResponse.json() as { questions?: Array<{ subject?: string; question?: string; options?: string[] }> };
const modelFingerprints = new Set((model.questions ?? []).filter((item) => item.subject === "Biology" && typeof item.question === "string" && Array.isArray(item.options)).map((item) => fingerprint(item.question!, item.options!)));
const db = await getDb(); if (!db) throw new Error("Database unavailable for Biology duplicate screen.");
const rows = await db.select({ questionText: questionItems.questionText, optionsJson: questionItems.optionsJson }).from(questionItems);
const ledgerFingerprints = new Set(rows.flatMap((item) => { try { const options = JSON.parse(item.optionsJson); return Array.isArray(options) ? [fingerprint(item.questionText, options)] : []; } catch { return []; } }));
const holds: Hold[] = []; const eligible = unique.flatMap((candidate) => { const externalId = `BIO-OWNER-20260822-${String(candidate.number).padStart(3, "0")}`; if (modelFingerprints.has(fingerprint(candidate.question, candidate.options)) || ledgerFingerprints.has(fingerprint(candidate.question, candidate.options))) { holds.push({ externalId, questionNumber: candidate.number, reason: "Duplicate hold: the full question-and-option fingerprint already exists in the model bank or authorised ledger.", question: candidate.question }); return []; } if (candidate.answerIndex < 0 || candidate.answerIndex >= 4 || !candidate.explanation) { holds.push({ externalId, questionNumber: candidate.number, reason: "Structural hold: no usable answer target, four-option set, or compact explanation.", question: candidate.question }); return []; } return [{ externalId, subject: "Biology", topic: topicFor(candidate.number, candidate.category, candidate.question), difficulty: "medium", question: candidate.question, options: candidate.options, answerIndex: candidate.answerIndex, explanation: candidate.explanation, sourceLabel: "Owner-supplied Biology segments · 22 Aug 2026", permissionNote: "Owner-supplied study content. Imported as authorised JAMB Quest practice material; source wording and answer key remain attributable to the owner-supplied batch." }]; });
const report = { sourceFiles: FILES.map((file) => file.split("/").pop()), declaredRanges: ["1–25", "51–75", "76–100"], explicitlyMissingRange: "26–50", parsedCount: parsed.length, uniqueParsedCount: unique.length, internalDuplicateCount: duplicates.length, eligibleCount: eligible.length, heldCount: holds.length, held: holds, stagedPath: STAGED_PATH };
await writeFile(STAGED_PATH, `${JSON.stringify(eligible, null, 2)}\n`); await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`); console.log(JSON.stringify(report, null, 2));
