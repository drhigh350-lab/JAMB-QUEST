import { readFile, writeFile } from "node:fs/promises";
import { and, eq, inArray } from "drizzle-orm";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";
import { resolveSyllabusTopic, type SyllabusSubject } from "../shared/syllabusTopicMap";
import { inferVerifiedTopic, type TopicSubject } from "../shared/topicInference";

const STAGED_PATH = "/home/ubuntu/jamb-import-staging/jamb_questions_only_pdf_unkeyed_stage.json";
const OUTPUT_PATH = "/home/ubuntu/jamb-import-staging/pdf_owner_batches_5_to_7_answer_matched_eligible.json";
const AUDIT_PATH = "/home/ubuntu/jamb-quiz-game/reports/pdf_owner_batches_5_to_7_answer_match_audit.json";

type Subject = "Biology" | "Chemistry";
type SourceRecord = {
  externalId: string;
  sourceSubject: Subject | "Use of English" | "Physics";
  sourceQuestionNumber: number;
  sourceCategory: string;
  questionText: string;
  options: string[];
  answerStatus: string;
  explanationStatus: string;
  releaseStatus: string;
};
type AnswerRecord = { number: number; answerLetter: string; answerText: string; explanation: string };
type Config = { name: string; file: string; subject: Subject; start: number; end: number; sourceLabel: string };

const configs: Config[] = [
  { name: "Biology 151–250", file: "/home/ubuntu/upload/Biology_Batch5_Q151-250.md", subject: "Biology", start: 151, end: 250, sourceLabel: "Owner PDF answer-matched Biology 151–250 · 23 Aug 2026" },
  { name: "Chemistry 1–100", file: "/home/ubuntu/upload/Chemistry_Batch6_Q1-100.md", subject: "Chemistry", start: 1, end: 100, sourceLabel: "Owner PDF answer-matched Chemistry 1–100 · 23 Aug 2026" },
  { name: "Chemistry 101–200", file: "/home/ubuntu/upload/Chemistry_Batch7_Q101-200.md", subject: "Chemistry", start: 101, end: 200, sourceLabel: "Owner PDF answer-matched Chemistry 101–200 · 23 Aug 2026" },
];

const learnerText = (value: string) => value
  .replace(/\^\s*\{?\s*\+\s*([0-9]+)\s*\}?/g, (_, digits) => [...digits].map((digit: string) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(digit)]).join(""))
  .replace(/\^\s*\{?\s*-\s*([0-9]+)\s*\}?/g, (_, digits) => "⁻" + [...digits].map((digit: string) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(digit)]).join(""))
  .replace(/\^\s*\{?\s*([0-9]+)\s*\}?/g, (_, digits) => [...digits].map((digit: string) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(digit)]).join(""))
  .replace(/_\s*\{?\s*([0-9]+)\s*\}?/g, (_, digits) => [...digits].map((digit: string) => "₀₁₂₃₄₅₆₇₈₉"[Number(digit)]).join(""));
const clean = (value: string) => learnerText(value).replace(/\r/g, "").replace(/\s+/g, " ").trim();
const normalise = (value: string) => clean(value).toLowerCase().replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (digit) => String("⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(digit))).replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (digit) => String("₀₁₂₃₄₅₆₇₈₉".indexOf(digit))).replace(/⁻/g, "-").replace(/[^a-z0-9]+/g, " ").trim();
const hasUnsafeMarkup = (value: string) => /\$\$|\\(?:frac|sqrt|text|mathrm|rightleftharpoons|rightarrow|propto|times|cdot|circ|Omega|mu|Delta|theta|lambda|rho|Phi|phi|pi)|(?:\^|_)\{?/.test(value);
const optionFingerprint = (question: string, options: string[]) => `${normalise(question)}||${options.map(normalise).join("||")}`;

function parseAnswers(text: string): AnswerRecord[] {
  const headers = [...text.matchAll(/^\*\*(\d+)\.\s*([A-E])\s*[—-]\s*(.*?)\*\*\s*\n([\s\S]*?)(?=^\*\*\d+\.\s*[A-E]\s*[—-]|\s*$)/gm)];
  return headers.map((match) => ({ number: Number(match[1]), answerLetter: match[2].toUpperCase(), answerText: clean(match[3]), explanation: clean(match[4]) }));
}

function biologyTopic(category: string, question: string, explanation: string): string | null {
  const value = normalise(`${category} ${question} ${explanation}`);
  const mappings: Array<[RegExp, string]> = [
    [/nitrogen cycle|ecological niche|succession|ecosystem|mangrove|xerophyte|hydrophyte|natural habitat|decomposer/, "Natural habitats"],
    [/population|quadrat|transect|capture|recapture|carrying capacity|environmental resistance|food web|food chain|trophic level|limiting factor/, "Population ecology"],
    [/biotic factor|abiotic factor|competition|distribution|random sampling/, "Factors affecting distribution"],
    [/mutualism|commensalism|parasitism|symbiotic/, "Symbiotic interactions"],
    [/deforestation|conservation|endangered|pollution|disease|malaria|cholera|immunity|vaccine|antibiotic|biodiversity|sanitation/, "Humans and environment"],
    [/allele|locus|homozyg|heterozyg|genotype|phenotype|sex linked|chromosome 21|inheritance|gene/, "Heredity"],
    [/mutation|continuous variation|discontinuous variation/, "Variation"],
    [/fossil|homologous|vestigial/, "Evidence of evolution"],
    [/natural selection|darwin|lamarck|speciation|adaptive radiation|evolution/, "Theories of evolution"],
    [/taxonomy|binomial|species|classification/, "Evolution and classification"],
    [/pathogen|virus|bacteria|fungi|cell division|dna|organelle|cell membrane|cytoplasm/, "Living organisms and organization"],
    [/amniotic fluid|foetus|fetal/, "Reproduction"],
    [/epiglottis|oesophagus|large intestine|small intestine|digestive/, "Nutrition and digestion"],
    [/respirat|alveol|gaseous exchange|cell respiration|glycolysis|diaphragm/, "Respiration"],
    [/excret|nephron|urea|osmoregulation/, "Excretion"],
    [/hormone|insulin|thyroxine|homeostasis|reflex|retina|iris|cornea|endocrine/, "Coordination and control"],
    [/blood circulation|blood pressure|capillaries|heart valves|pulmonary|blood group/, "Transport"],
    [/nutrition|digestive|villi|pancreas|food test|benedict|biuret|molar|incisor|canine|tooth/, "Nutrition and digestion"],
    [/reproduct|placenta|menstrual|pollination|seed dispersal|fruit formation/, "Reproduction"],
  ];
  const mapped = mappings.find(([pattern]) => pattern.test(value))?.[1];
  return mapped ? resolveSyllabusTopic("Biology", mapped) : resolveSyllabusTopic("Biology", `${category} ${question}`) ?? (() => {
    const inferred = inferVerifiedTopic("Biology" as TopicSubject, question);
    return inferred ? resolveSyllabusTopic("Biology", inferred) : null;
  })();
}

function chemistryTopic(category: string, question: string, explanation: string): string | null {
  const value = normalise(`${category} ${question} ${explanation}`);
  const mappings: Array<[RegExp, string]> = [
    [/radioactivity|alpha|beta|gamma|nuclear|isotope|half life/, "Nuclear chemistry"],
    [/filtration|distillation|chromatography|sublimation|mixture|physical change|chemical change/, "Separation of mixtures"],
    [/mole|avogadro|stoichiometr|definite proportions|empirical formula|molar concentration|dilution|titration|percentage composition/, "Chemical combination"],
    [/boyle|charles|gas diffusion|vapour density|kinetic theory|air composition/, "Kinetic theory of matter and gases"],
    [/atom|proton|neutron|electron|atomic|periodic|ionization|bond|covalent|ionic|metallic|coordinate|molecular shape|isotope/, "Atomic structure and bonding"],
    [/acid|base|ph\b|neutralization|indicator|salt|buffer/, "Acids, bases and salts"],
    [/solubility|saturated|hardness|precipitation|qualitative analysis|flame test/, "Solubility"],
    [/oxidation|reducing agent|oxidizing agent|oxidation number|redox|displacement/, "Oxidation and reduction"],
    [/electrolyte|electrolysis|electroplating|cathode|anode|faraday/, "Electrolysis"],
    [/enthalpy|exothermic|endothermic|hess/, "Energy changes"],
    [/reaction rate|activation energy|catalyst/, "Rates of reaction"],
    [/reversible|equilibrium|le chatelier|equilibrium constant/, "Chemical equilibria"],
    [/alkane|alkene|benzene|ethanol|ethanoic|ester|polymer|organic|functional group|crude oil/, "Organic compounds"],
    [/aluminium|iron ore|alloy|brass|reactivity series|rusting|galvanizing|metal/, "Metals and their compounds"],
    [/oxygen|hydrogen|chlorine|ammonia|sulfuric|nitrogen fertilizer|noble gas|halogen/, "Non-metals and their compounds"],
    [/pollution|acid rain|greenhouse|ozone|carbon monoxide|eutrophication/, "Environmental pollution"],
    [/haber|contact process|fertilizer|cement|glass|industrial chemistry/, "Chemistry and industry"],
  ];
  const mapped = mappings.find(([pattern]) => pattern.test(value))?.[1];
  return mapped ? resolveSyllabusTopic("Chemistry", mapped) : resolveSyllabusTopic("Chemistry", `${category} ${question}`) ?? (() => {
    const inferred = inferVerifiedTopic("Chemistry" as TopicSubject, question);
    return inferred ? resolveSyllabusTopic("Chemistry", inferred) : null;
  })();
}

const topicFor = (subject: Subject, category: string, question: string, explanation: string) => subject === "Biology" ? biologyTopic(category, question, explanation) : chemistryTopic(category, question, explanation);

const [stagedRaw, ...answerFiles] = await Promise.all([readFile(STAGED_PATH, "utf8"), ...configs.map((config) => readFile(config.file, "utf8"))]);
const staged = JSON.parse(stagedRaw) as SourceRecord[];
const db = await getDb();
if (!db) throw new Error("Database unavailable for authorised-ledger duplicate screening.");
const ledgerRows = await db.select({ externalId: questionItems.externalId, questionText: questionItems.questionText, optionsJson: questionItems.optionsJson }).from(questionItems);
const ledgerIds = new Set(ledgerRows.map((row) => row.externalId.toLowerCase()));
const ledgerFingerprints = new Set(ledgerRows.map((row) => optionFingerprint(row.questionText, JSON.parse(row.optionsJson))));
const eligible: Array<{ externalId: string; subject: Subject; topic: string; difficulty: "medium"; question: string; options: string[]; answerIndex: number; explanation: string; sourceLabel: string; permissionNote: string }> = [];
const holds: Array<{ externalId: string; subject: Subject; questionNumber: number; reason: string }> = [];
const perRange: Array<Record<string, unknown>> = [];

for (const [index, config] of configs.entries()) {
  const answers = parseAnswers(answerFiles[index]);
  const expectedNumbers = Array.from({ length: config.end - config.start + 1 }, (_, offset) => config.start + offset);
  const answerNumbers = answers.map((answer) => answer.number);
  const sourceRecords = staged.filter((record) => record.sourceSubject === config.subject && record.sourceQuestionNumber >= config.start && record.sourceQuestionNumber <= config.end);
  if (answers.length !== expectedNumbers.length || new Set(answerNumbers).size !== answers.length || expectedNumbers.some((number) => !answerNumbers.includes(number))) {
    throw new Error(`${config.name}: the supplied file does not contain exactly one answer heading for every declared question number.`);
  }
  if (sourceRecords.length !== expectedNumbers.length || expectedNumbers.some((number) => !sourceRecords.some((record) => record.sourceQuestionNumber === number))) {
    throw new Error(`${config.name}: the unkeyed stage does not contain exactly the declared source range.`);
  }
  for (const answer of answers) {
    const source = sourceRecords.find((record) => record.sourceQuestionNumber === answer.number)!;
    if (source.answerStatus !== "awaiting_owner_answer_batch" || source.explanationStatus !== "awaiting_owner_answer_batch" || source.releaseStatus !== "staged_not_playable") {
      holds.push({ externalId: source.externalId, subject: config.subject, questionNumber: answer.number, reason: "Source-state hold: staged record is not in the expected unkeyed, non-playable state." });
      continue;
    }
    const answerIndex = "ABCDE".indexOf(answer.answerLetter);
    if (answerIndex < 0 || answerIndex >= source.options.length || normalise(source.options[answerIndex]) !== normalise(answer.answerText)) {
      holds.push({ externalId: source.externalId, subject: config.subject, questionNumber: answer.number, reason: "Answer-key hold: supplied answer letter and answer text do not identify the same staged source option." });
      continue;
    }
    const embeddedKey = answer.explanation.match(/(?:correct\s+answer|answer)\s*(?:is|:)\s*\*?([A-E])\b/i)?.[1]?.toUpperCase();
    if (embeddedKey && embeddedKey !== answer.answerLetter) {
      holds.push({ externalId: source.externalId, subject: config.subject, questionNumber: answer.number, reason: "Answer-key hold: explanation states a different answer letter from the supplied heading." });
      continue;
    }
    const topic = topicFor(config.subject, source.sourceCategory, source.questionText, answer.explanation);
    const options = source.options.map(clean);
    if (!topic) {
      holds.push({ externalId: source.externalId, subject: config.subject, questionNumber: answer.number, reason: "Syllabus hold: source cannot be resolved to an exact official syllabus area." });
      continue;
    }
    if (options.length < 4 || options.length > 5 || new Set(options.map(normalise)).size !== options.length || options.some((option) => !option)) {
      holds.push({ externalId: source.externalId, subject: config.subject, questionNumber: answer.number, reason: "Option-integrity hold: staged source lacks four or five distinct non-empty options." });
      continue;
    }
    const explanation = clean(answer.explanation);
    const question = clean(source.questionText);
    if (!question || !explanation || [question, ...options, explanation].some(hasUnsafeMarkup) || /(?:for this topic|compare each option|therefore the correct answer is|this shows why the answer is)/i.test(explanation)) {
      holds.push({ externalId: source.externalId, subject: config.subject, questionNumber: answer.number, reason: "Formatting hold: source has incomplete text, unsafe markup, or a prohibited generic explanation tail." });
      continue;
    }
    const fingerprint = optionFingerprint(question, options);
    if (ledgerIds.has(source.externalId.toLowerCase()) || ledgerFingerprints.has(fingerprint) || eligible.some((record) => optionFingerprint(record.question, record.options) === fingerprint)) {
      holds.push({ externalId: source.externalId, subject: config.subject, questionNumber: answer.number, reason: "Duplicate hold: external ID or full normalized question-and-option fingerprint already exists in the authorised ledger or this intake." });
      continue;
    }
    eligible.push({ externalId: source.externalId, subject: config.subject, topic, difficulty: "medium", question, options, answerIndex, explanation, sourceLabel: config.sourceLabel, permissionNote: "Owner-supplied answer-and-explanation batch matched deterministically to the owner-supplied question-only PDF. Question wording, answer key, and explanation remain attributable to supplied materials." });
  }
  perRange.push({ range: config.name, sourceFile: config.file.split("/").pop(), parsedAnswerCount: answers.length, stagedSourceCount: sourceRecords.length, eligibleCount: eligible.filter((record) => record.sourceLabel === config.sourceLabel).length, heldCount: holds.filter((hold) => hold.subject === config.subject && hold.questionNumber >= config.start && hold.questionNumber <= config.end).length });
}

await writeFile(OUTPUT_PATH, `${JSON.stringify(eligible, null, 2)}\n`);
await writeFile(AUDIT_PATH, `${JSON.stringify({ sourceFile: "jamb_questions_only.pdf", answerFiles: configs.map((config) => config.file.split("/").pop()), declaredRecordCount: 300, eligibleCount: eligible.length, heldCount: holds.length, perRange, held: holds }, null, 2)}\n`);
console.log(JSON.stringify({ eligibleCount: eligible.length, heldCount: holds.length, perRange, held: holds }, null, 2));
process.exit(0);
