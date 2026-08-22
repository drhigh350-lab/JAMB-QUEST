import { readFile, writeFile } from "node:fs/promises";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";
import { withUseOfEnglishInstruction } from "../shared/useOfEnglishInstructions";

const INPUT_FILES = [
  "/home/ubuntu/upload/pasted_content.txt",
  "/home/ubuntu/upload/pasted_content_2.txt",
  "/home/ubuntu/upload/pasted_content_3.txt",
  "/home/ubuntu/upload/pasted_content_4.txt",
  "/home/ubuntu/upload/pasted_content_5.txt",
] as const;
const STAGED_PATH = "/home/ubuntu/jamb-import-staging/owner_english_continuation_126_to_250_eligible.json";
const REPORT_PATH = "/home/ubuntu/jamb-quiz-game/reports/owner_english_continuation_126_to_250_audit.json";
const MODEL_BANK_URL = "https://jambquiz-kmqgtf9m.manus.space/manus-storage/jamb_high_yield_practice_bank_1000_explanations_batches2_7_plus_batch9_model_v3_rectified_167c6b81.json";

type Candidate = { number: number; category: string; rawPrompt: string; options: string[]; answerIndex: number; explanation: string; sourceFile: string };
type Hold = { externalId: string; questionNumber: number; reason: string; question: string };

const entrepreneurPassage = "Read the passage and answer the question. Many young people want to become successful entrepreneurs, but enthusiasm alone is not enough. A business may begin with an exciting idea and still fail if the owner does not understand the needs of potential customers. Before investing money, an entrepreneur should investigate the market, identify competitors, estimate costs, and determine whether people are willing to pay for the proposed product or service. Planning does not eliminate every risk, but it helps the business owner make informed decisions. A good plan should state the business objectives, explain how they will be achieved, and identify possible difficulties. It should also be flexible because circumstances may change. For example, the price of materials may rise, new competitors may appear, or customers may develop different preferences. Another important quality is financial discipline. Some new business owners spend their first profits on personal luxuries instead of improving the business. This may prevent the enterprise from expanding or surviving difficult periods. Successful entrepreneurs usually separate business money from personal money and keep accurate records of income and expenditure. Finally, entrepreneurs need patience. A business may take time to attract customers and become profitable. Failure in one attempt should not automatically be regarded as the end of one’s career. It can provide useful information about poor decisions and help the entrepreneur improve future efforts. Success is more likely when creativity is combined with research, planning, discipline, and persistence.";

function clean(value: string) { return value.replace(/\*\*/g, "").replace(/\s+/g, " ").trim(); }
function normalise(value: string) { return clean(value).toLowerCase().replace(/[–—]/g, "-").replace(/[^a-z0-9]+/g, " ").trim(); }
function fingerprint(question: string, options: string[]) {
  const stem = question.includes("Question:") ? question.split("Question:").at(-1)! : question;
  return `${normalise(stem)}\u0000${options.map(normalise).join("\u0001")}`;
}
function compactExplanation(value: string) { return clean(value).split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 4).join(" "); }
function topicFor(number: number, category: string, prompt: string) {
  if (number >= 226 && number <= 235) return "Comprehension passages";
  const value = `${category} ${prompt}`.toLowerCase();
  if (value.includes("synonym")) return "Synonyms";
  if (value.includes("antonym")) return "Antonyms";
  if (value.includes("sentence interpretation") || value.includes("lexis")) return "Sentence meaning";
  if (value.includes("punctuation") || value.includes("spelling") || value.includes("apostrophe")) return "Mechanics";
  if (value.includes("vowel")) return "Vowels";
  if (value.includes("consonant")) return "Consonants";
  if (value.includes("rhyme") || value.includes("homophone")) return "Rhymes and homophones";
  if (value.includes("emphatic stress")) return "Emphatic stress";
  if (value.includes("word stress") || /stressed syllable/i.test(prompt)) return "Word stress";
  if (value.includes("passive") || value.includes("reported") || value.includes("conditional")) return "Clause and sentence patterns";
  if (value.includes("word class")) return "Word classes";
  return "Tense, aspect, number and agreement";
}
function parseFile(text: string, sourceFile: string): Candidate[] {
  const headers = [...text.matchAll(/^###[ \t]+(\d+)\.[ \t]*(.*)$/gm)];
  return headers.flatMap((header, index) => {
    const number = Number(header[1]);
    const category = clean(header[2]);
    const block = text.slice(header.index! + header[0].length, headers[index + 1]?.index ?? text.length);
    const options = [...block.matchAll(/^([A-D])\.\s+(.+?)\s*$/gm)];
    const answer = block.match(/\*\*Correct answer:\s*([A-D])/i);
    const explanation = block.match(/\*\*Explanation:\*\*\s*([\s\S]*?)(?=\n\s*\*\*\*|$)/i);
    if (options.length !== 4 || !answer || !explanation) return [];
    const headingPrompt = number >= 226 && number <= 235 ? category : "";
    const rawPrompt = headingPrompt || clean(block.slice(0, options[0].index));
    const answerIndex = "ABCD".indexOf(answer[1].toUpperCase());
    return [{ number, category, rawPrompt, options: options.map((option) => clean(option[2])), answerIndex, explanation: compactExplanation(explanation[1]), sourceFile }];
  });
}

const sources = await Promise.all(INPUT_FILES.map(async (file) => ({ sourceFile: file.split("/").pop()!, text: await readFile(file, "utf8") })));
const parsed = sources.flatMap(({ sourceFile, text }) => parseFile(text, sourceFile));
const internal = new Set<string>();
const duplicates: Candidate[] = [];
const unique = parsed.filter((candidate) => {
  const key = fingerprint(candidate.rawPrompt, candidate.options);
  if (internal.has(key)) { duplicates.push(candidate); return false; }
  internal.add(key); return true;
});
const modelResponse = await fetch(MODEL_BANK_URL);
if (!modelResponse.ok) throw new Error(`Managed model bank duplicate source failed (${modelResponse.status}).`);
const model = await modelResponse.json() as { questions?: Array<{ subject?: string; question?: string; options?: string[] }> };
const modelFingerprints = new Set((model.questions ?? []).filter((item) => item.subject === "Use of English" && typeof item.question === "string" && Array.isArray(item.options)).map((item) => fingerprint(item.question!, item.options!)));
const db = await getDb();
if (!db) throw new Error("Database unavailable for duplicate screening.");
const ledger = await db.select({ questionText: questionItems.questionText, optionsJson: questionItems.optionsJson }).from(questionItems);
const ledgerFingerprints = new Set(ledger.flatMap((item) => { try { const options = JSON.parse(item.optionsJson); return Array.isArray(options) ? [fingerprint(item.questionText, options)] : []; } catch { return []; } }));
const holds: Hold[] = [];
const eligible = unique.flatMap((candidate) => {
  const externalId = `ENG-OWNER-20260822-${String(candidate.number).padStart(3, "0")}`;
  const topic = topicFor(candidate.number, candidate.category, candidate.rawPrompt);
  const questionWithContext = candidate.number >= 226 && candidate.number <= 235 ? `${entrepreneurPassage}\n\nQuestion: ${candidate.rawPrompt}` : candidate.rawPrompt;
  const question = withUseOfEnglishInstruction(topic, questionWithContext).questionText;
  if (modelFingerprints.has(fingerprint(candidate.rawPrompt, candidate.options)) || ledgerFingerprints.has(fingerprint(candidate.rawPrompt, candidate.options))) {
    holds.push({ externalId, questionNumber: candidate.number, reason: "Duplicate hold: the full normalized question-and-option fingerprint already exists in the model bank or authorised ledger.", question: candidate.rawPrompt });
    return [];
  }
  if (candidate.answerIndex < 0 || candidate.answerIndex >= candidate.options.length || !candidate.explanation) {
    holds.push({ externalId, questionNumber: candidate.number, reason: "Structural hold: missing usable answer target, options, or compact explanation.", question: candidate.rawPrompt });
    return [];
  }
  return [{ externalId, subject: "Use of English", topic, difficulty: "medium", question, options: candidate.options, answerIndex: candidate.answerIndex, explanation: candidate.explanation, sourceLabel: "Owner-supplied English continuation · 22 Aug 2026", permissionNote: "Owner-supplied study content. Imported as authorised JAMB Quest practice material; source wording and answer key remain attributable to the owner-supplied batch." }];
});
const report = { sourceFiles: INPUT_FILES.map((file) => file.split("/").pop()), parsedCount: parsed.length, uniqueParsedCount: unique.length, internalDuplicateCount: duplicates.length, modelBankCandidateCount: modelFingerprints.size, authorisedLedgerCandidateCount: ledgerFingerprints.size, eligibleCount: eligible.length, heldCount: holds.length, held: holds, stagedPath: STAGED_PATH };
await writeFile(STAGED_PATH, `${JSON.stringify(eligible, null, 2)}\n`);
await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
