import { readFile, writeFile } from "node:fs/promises";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";
import { resolveSyllabusTopic } from "../shared/syllabusTopicMap";
import { withUseOfEnglishInstruction } from "../shared/useOfEnglishInstructions";

const SOURCE_STAGE_FILE = "/home/ubuntu/jamb-import-staging/jamb_questions_only_pdf_unkeyed_stage.json";
const MODEL_BANK_FILE = "/home/ubuntu/jamb-import-staging/model_bank_for_duplicate_audit.json";
const STAGED_PATH = "/home/ubuntu/jamb-import-staging/pdf_owner_batches_2_to_4_answer_matched_eligible.json";
const REPORT_PATH = "/home/ubuntu/jamb-quiz-game/reports/pdf_owner_batches_2_to_4_answer_match_audit.json";

type Subject = "Use of English" | "Biology";
type SourceRecord = {
  externalId: string;
  sourceSubject: Subject;
  sourceQuestionNumber: number;
  sourceCategory: string;
  questionText: string;
  options: string[];
  answerStatus: "awaiting_owner_answer_batch";
  explanationStatus: "awaiting_owner_answer_batch";
  releaseStatus: "staged_not_playable";
  sourceFile: string;
};
type Config = {
  name: string;
  file: string;
  subject: Subject;
  min: number;
  max: number;
  sectionStart?: string;
  sectionEnd?: string;
  sourceLabel: string;
};
type ParsedAnswer = { number: number; answerLetter: string; answerText: string; explanation: string };
type Hold = { externalId: string; subject: Subject; questionNumber: number; range: string; reason: string };
type EligibleRecord = {
  externalId: string;
  subject: Subject;
  topic: string;
  difficulty: "medium";
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  sourceLabel: string;
  permissionNote: string;
};

const CONFIGS: Config[] = [
  {
    name: "Use of English 101–200",
    file: "/home/ubuntu/upload/UoE_Batch2_Q101-200.md",
    subject: "Use of English",
    min: 101,
    max: 200,
    sourceLabel: "Owner PDF answer-matched Use of English 101–200 · 22 Aug 2026",
  },
  {
    name: "Use of English 201–250",
    file: "/home/ubuntu/upload/Batch3_UoE201-250_Bio1-50.md",
    subject: "Use of English",
    min: 201,
    max: 250,
    sectionStart: "## Use of English (Q201–250)",
    sectionEnd: "## Biology (Q1–50)",
    sourceLabel: "Owner PDF answer-matched Use of English 201–250 · 22 Aug 2026",
  },
  {
    name: "Biology 1–50",
    file: "/home/ubuntu/upload/Batch3_UoE201-250_Bio1-50.md",
    subject: "Biology",
    min: 1,
    max: 50,
    sectionStart: "## Biology (Q1–50)",
    sourceLabel: "Owner PDF answer-matched Biology 1–50 · 22 Aug 2026",
  },
  {
    name: "Biology 51–150",
    file: "/home/ubuntu/upload/Biology_Batch4_Q51-150.md",
    subject: "Biology",
    min: 51,
    max: 150,
    sourceLabel: "Owner PDF answer-matched Biology 51–150 · 22 Aug 2026",
  },
];

function clean(value: string) {
  return value
    .replace(/\r/g, "")
    .replace(/\*\*/g, "")
    .replace(/[*`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function learnerText(value: string) {
  return value
    .replace(/\r/g, "")
    .replace(/\*\*/g, "")
    .replace(/[*`]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalise(value: string) {
  return clean(value).toLowerCase().replace(/[‘’]/g, "'").replace(/[–—]/g, "-").replace(/[^a-z0-9]+/g, " ").trim();
}

function optionIdentity(value: string) {
  return learnerText(value).normalize("NFKC").toLowerCase().replace(/[‘’]/g, "'").replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
}

function fingerprint(question: string, options: string[]) {
  return `${normalise(question)}\u0000${options.map(normalise).join("\u0001")}`;
}

function hasUnsafeMarkup(value: string) {
  return /```|!\[[^\]]*\]\([^)]*\)|<\/?[a-z][^>]*>|\$\$|\\(?:frac|text|begin|end|sqrt)\b/i.test(value);
}

function compactExplanation(value: string) {
  return clean(value).split(/(?<=[.!?])\s+(?=[A-Z“])/).filter(Boolean).slice(0, 2).join(" ");
}

function englishTopic(category: string, question: string, explanation: string) {
  const value = normalise(`${category} ${question} ${explanation}`);
  const mappings: Array<[RegExp, string]> = [
    [/synonym/, "Synonyms"],
    [/antonym/, "Antonyms"],
    [/sentence meaning|sentence interpretation|lexis/, "Sentence meaning"],
    [/cloze|completion/, "Cloze passages"],
    [/comprehension|passage/, "Comprehension passages"],
    [/summary/, "Summary"],
    [/punctuation|spelling|mechanic/, "Mechanics"],
    [/idiom|figurative|ordinary usage/, "Ordinary, figurative and idiomatic usage"],
    [/vowel|diphthong/, "Vowels"],
    [/consonant|consonant cluster/, "Consonants"],
    [/rhyme|homophone/, "Rhymes and homophones"],
    [/word stress/, "Word stress"],
    [/emphatic stress|intonation/, "Emphatic stress"],
    [/clause|sentence pattern|voice|reported speech|conditional|gerund|infinitive|causative|subordinate clause/, "Clause and sentence patterns"],
    [/word class|preposition|pronoun|conjunction|determiner|noun|adverb/, "Word classes"],
    [/tense|agreement|number|grammar|subjunctive/, "Tense, aspect, number and agreement"],
  ];
  const match = mappings.find(([pattern]) => pattern.test(value));
  return match ? resolveSyllabusTopic("Use of English", match[1]) : null;
}

function biologyTopic(category: string, question: string, explanation: string) {
  const value = normalise(`${category} ${question} ${explanation}`);
  const mappings: Array<[RegExp, string]> = [
    [/respirat|alveol|gaseous exchange|oxygen|carbon dioxide|respiratory quotient|cell respiration|glycolysis|inhalation|diaphragm/, "Respiration"],
    [/excret|nephron|urea|osmoregulation|plasmolysis|turgor pressure/, "Excretion"],
    [/hormone|insulin|thyroxine|homeostasis|reflex|eye function|ear function|\beye\b|retina|iris|cornea|endocrine|blood glucose|temperature regulation/, "Coordination and control"],
    [/blood circulation|blood pressure|capillaries|heart valves|pulmonary|blood group/, "Transport"],
    [/soil|loam|humus/, "Soil"],
    [/biotic factor|ecological factor|competition|distribution/, "Factors affecting distribution"],
    [/symbiosis|commensalism|parasitism/, "Symbiotic interactions"],
    [/taxonomy|classification|bacteria|virus|fungi|arthropod|vertebrate|mammal|binomial/, "Evolution and classification"],
    [/root|leaf|stomata|photosynthesis|plant hormone|auxin|transpiration|xylem|cambium|vascular|plant classification|guard cells|apical|chlorophyll|mineral nutrition/, "Plant and mammal structure"],
    [/nutrition|digestive|villi|pancreas|large intestine|food test|benedict|biuret|iodine solution|reducing sugar|molar|incisor|canine|premolar|tooth|teeth/, "Nutrition and digestion"],
    [/reproduct|placenta|menstrual|birth control|double fertilization|fruit formation|seed dispersal|pollination/, "Reproduction"],
    [/variation|continuous variation|discontinuous variation|mutation/, "Variation"],
    [/heredity|meiosis|crossing over|test cross|codominance|sex determination|sex linked|haemophilia|dihybrid|paternity|rhesus|inheritance probability|allele|genotype|gene/, "Heredity"],
    [/fossil|vestigial|homologous/, "Evidence of evolution"],
    [/speciation|genetic drift|natural selection|adaptive radiation|evolution|artificial selection|darwin|lamarck/, "Theories of evolution"],
    [/biotechnology|fermentation|yoghurt|genetic engineering|genetically modified|tissue culture|selective breeding/, "Biotechnology"],
    [/population|quadrat|capture mark recapture|capture|recapture|ecological pyramid|biomass|ecological efficiency|population curve|environmental resistance|food web|food chain|trophic level/, "Population ecology"],
    [/mangrove|xerophyte|hydrophyte|desert|natural habitat|ecological niche|nitrogen cycle|nitrogen fixation|water cycle|succession|secchi|decomposer|ecosystem/, "Natural habitats"],
    [/adaptation|streamlined|cactus|spines/, "Adaptations of organisms"],
    [/disease|malaria|cholera|tuberculosis|sexually transmitted|pollution|sewage|acid rain|carbon monoxide|greenhouse|water treatment|immunity|vaccine|antibiotic resistance|conservation|endangered|national park|sustainable use|crop pest|damages crops|biological control|food preservation|pasteurization|chlorination|biodiversity/, "Humans and environment"],
    [/mitosis|dna|cell specialization|stem cell|enzyme|genetic code|cell division|cell membrane|cytoplasm|protoplasm|organelle|characteristic of living/, "Living organisms and organization"],
    [/skeleton|bone|joint|tendon|ligament|muscle|locomotion/, "Support and movement"],
    [/germination|plant growth|growth movement|tropism/, "Growth"],
  ];
  const match = mappings.find(([pattern]) => pattern.test(value));
  return match ? resolveSyllabusTopic("Biology", match[1]) : resolveSyllabusTopic("Biology", `${category} ${question}`);
}

function extractSection(markdown: string, config: Config) {
  if (!config.sectionStart) return markdown;
  const start = markdown.indexOf(config.sectionStart);
  if (start < 0) return "";
  const afterStart = markdown.slice(start + config.sectionStart.length);
  const end = config.sectionEnd ? afterStart.indexOf(config.sectionEnd) : -1;
  return end >= 0 ? afterStart.slice(0, end) : afterStart;
}

function parseAnswerSection(markdown: string, config: Config) {
  const section = extractSection(markdown, config);
  const headings = [...section.matchAll(/^\*\*(\d+)\.\s*([A-E])\s*[—-]\s*(.+?)\*\*\s*$/gm)];
  const records: ParsedAnswer[] = [];
  const malformed: Array<{ number: number; reason: string }> = [];
  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const number = Number(heading[1]);
    if (number < config.min || number > config.max) continue;
    const explanation = clean(section.slice((heading.index ?? 0) + heading[0].length, headings[index + 1]?.index ?? section.length));
    if (!explanation) {
      malformed.push({ number, reason: "Malformed answer source: a numbered answer heading or its explanation is missing." });
      continue;
    }
    records.push({ number, answerLetter: heading[2].toUpperCase(), answerText: clean(heading[3]), explanation });
  }
  return { records, malformed, headingCount: headings.length };
}

function sourceModelRecords(model: unknown): Array<{ question?: string; questionText?: string; options?: unknown }> {
  if (Array.isArray(model)) return model as Array<{ question?: string; questionText?: string; options?: unknown }>;
  if (model && typeof model === "object") {
    const object = model as { questions?: unknown; data?: unknown };
    if (Array.isArray(object.questions)) return object.questions as Array<{ question?: string; questionText?: string; options?: unknown }>;
    if (Array.isArray(object.data)) return object.data as Array<{ question?: string; questionText?: string; options?: unknown }>;
  }
  return [];
}

const files = [...new Set(CONFIGS.map((config) => config.file))];
const [sourceStageRaw, modelRaw, ...fileContents] = await Promise.all([
  readFile(SOURCE_STAGE_FILE, "utf8"),
  readFile(MODEL_BANK_FILE, "utf8"),
  ...files.map((file) => readFile(file, "utf8")),
]);
const fileMap = new Map(files.map((file, index) => [file, fileContents[index] as string]));
const sourceStage = JSON.parse(sourceStageRaw) as SourceRecord[];
const model = sourceModelRecords(JSON.parse(modelRaw));
const modelFingerprints = new Set(model.flatMap((record) => {
  const question = record.question ?? record.questionText;
  return typeof question === "string" && Array.isArray(record.options) && record.options.every((option) => typeof option === "string")
    ? [fingerprint(question, record.options as string[])]
    : [];
}));
const db = await getDb();
if (!db) throw new Error("Database unavailable for duplicate screening.");
const ledger = await db.select({ externalId: questionItems.externalId, questionText: questionItems.questionText, optionsJson: questionItems.optionsJson }).from(questionItems);
const ledgerExternalIds = new Set(ledger.map((record) => record.externalId.toLowerCase()));
const ledgerFingerprints = new Set(ledger.flatMap((record) => {
  try {
    const options = JSON.parse(record.optionsJson) as unknown;
    return Array.isArray(options) && options.every((option) => typeof option === "string") ? [fingerprint(record.questionText, options)] : [];
  } catch {
    return [];
  }
}));

const holds: Hold[] = [];
const eligible: EligibleRecord[] = [];
const alreadySeen = new Set<string>();
const perRange: Array<Record<string, unknown>> = [];

for (const config of CONFIGS) {
  const parsed = parseAnswerSection(fileMap.get(config.file) ?? "", config);
  const answersByNumber = new Map<number, ParsedAnswer>();
  const sourceRecords = sourceStage.filter((record) => record.sourceSubject === config.subject && record.sourceQuestionNumber >= config.min && record.sourceQuestionNumber <= config.max);
  const sourceByNumber = new Map(sourceRecords.map((record) => [record.sourceQuestionNumber, record]));
  const rangeHolds: Hold[] = [];
  const addHold = (hold: Omit<Hold, "range">) => {
    const complete = { ...hold, range: config.name };
    holds.push(complete);
    rangeHolds.push(complete);
  };
  for (const answer of parsed.records) {
    if (answersByNumber.has(answer.number)) addHold({ externalId: `PDF-OWNER-20260822-${config.subject === "Biology" ? "BIO" : "ENG"}-${String(answer.number).padStart(3, "0")}`, subject: config.subject, questionNumber: answer.number, reason: "Answer-batch hold: duplicate numbered answer entry in the owner Markdown source." });
    answersByNumber.set(answer.number, answer);
  }
  for (const malformed of parsed.malformed) addHold({ externalId: `PDF-OWNER-20260822-${config.subject === "Biology" ? "BIO" : "ENG"}-${String(malformed.number).padStart(3, "0")}`, subject: config.subject, questionNumber: malformed.number, reason: malformed.reason });

  const expectedNumbers = new Set(Array.from({ length: config.max - config.min + 1 }, (_, index) => config.min + index));
  for (const number of expectedNumbers) {
    const source = sourceByNumber.get(number);
    const answer = answersByNumber.get(number);
    const externalId = source?.externalId ?? `PDF-OWNER-20260822-${config.subject === "Biology" ? "BIO" : "ENG"}-${String(number).padStart(3, "0")}`;
    if (!source) {
      addHold({ externalId, subject: config.subject, questionNumber: number, reason: "Source-match hold: no staged PDF question exists for this declared range number." });
      continue;
    }
    if (!answer) {
      addHold({ externalId, subject: config.subject, questionNumber: number, reason: "Source-match hold: the owner Markdown batch has no answer-and-explanation entry for this staged question." });
      continue;
    }
    if (source.answerStatus !== "awaiting_owner_answer_batch" || source.explanationStatus !== "awaiting_owner_answer_batch" || source.releaseStatus !== "staged_not_playable") {
      addHold({ externalId, subject: config.subject, questionNumber: number, reason: "Source-state hold: the staged PDF record is not in the expected unkeyed, non-playable state." });
      continue;
    }
    const answerIndex = "ABCDE".indexOf(answer.answerLetter);
    const options = source.options.map(learnerText);
    if (answerIndex < 0 || answerIndex >= options.length || normalise(options[answerIndex]) !== normalise(answer.answerText)) {
      addHold({ externalId, subject: config.subject, questionNumber: number, reason: "Answer-key hold: the supplied answer letter and answer text do not identify the same staged source option." });
      continue;
    }
    const embeddedKey = answer.explanation.match(/(?:correct\s+answer|answer)\s*(?:is|:)\s*\*?([A-E])\b/i)?.[1]?.toUpperCase();
    if (embeddedKey && embeddedKey !== answer.answerLetter) {
      addHold({ externalId, subject: config.subject, questionNumber: number, reason: "Answer-key hold: the explanation states a different answer letter from the supplied answer heading." });
      continue;
    }
    const questionText = learnerText(source.questionText);
    const topic = config.subject === "Use of English" ? englishTopic(source.sourceCategory, questionText, answer.explanation) : biologyTopic(source.sourceCategory, questionText, answer.explanation);
    if (!topic) {
      addHold({ externalId, subject: config.subject, questionNumber: number, reason: "Syllabus hold: the staged source cannot be resolved to an exact official syllabus area." });
      continue;
    }
    const distinctOptions = new Set(options.map(optionIdentity));
    if (options.length < 4 || options.length > 5 || distinctOptions.size !== options.length || options.some((option) => !option)) {
      addHold({ externalId, subject: config.subject, questionNumber: number, reason: "Option-integrity hold: the staged source does not contain four or five distinct, non-empty options." });
      continue;
    }
    const explanation = compactExplanation(answer.explanation);
    if (!questionText || !explanation || [questionText, ...options, explanation].some(hasUnsafeMarkup) || /(?:for this topic|compare each option|therefore the correct answer is|this shows why the answer is)/i.test(explanation)) {
      addHold({ externalId, subject: config.subject, questionNumber: number, reason: "Formatting hold: incomplete context, raw markup, or a generic explanation tail was found in the matched source." });
      continue;
    }
    if ((/\b(?:passage|text)\b/i.test(questionText) || /comprehension/i.test(source.sourceCategory)) && questionText.length < 180) {
      addHold({ externalId, subject: config.subject, questionNumber: number, reason: "Context hold: a passage-based item lacks sufficient staged source context and cannot be completed by inference." });
      continue;
    }
    const sourceFingerprint = fingerprint(questionText, options);
    const question = config.subject === "Use of English" ? withUseOfEnglishInstruction(topic, questionText).questionText : questionText;
    const renderedFingerprint = fingerprint(question, options);
    if (alreadySeen.has(sourceFingerprint) || modelFingerprints.has(sourceFingerprint) || modelFingerprints.has(renderedFingerprint) || ledgerExternalIds.has(externalId.toLowerCase()) || ledgerFingerprints.has(sourceFingerprint) || ledgerFingerprints.has(renderedFingerprint)) {
      addHold({ externalId, subject: config.subject, questionNumber: number, reason: "Duplicate hold: the full normalized question-and-option fingerprint or external identifier already exists in this intake, the model bank, or the authorised ledger." });
      continue;
    }
    alreadySeen.add(sourceFingerprint);
    eligible.push({
      externalId,
      subject: config.subject,
      topic,
      difficulty: "medium",
      question,
      options,
      answerIndex,
      explanation,
      sourceLabel: config.sourceLabel,
      permissionNote: "Owner-supplied answer-and-explanation batch matched deterministically to owner-supplied PDF questions. Source question wording, answer key, and explanation remain attributable to the owner-supplied materials.",
    });
  }
  perRange.push({
    range: config.name,
    sourceFile: config.file.split("/").pop(),
    parsedAnswerCount: parsed.records.length,
    answerHeadingCountInSection: parsed.headingCount,
    stagedSourceCount: sourceRecords.length,
    eligibleCount: eligible.filter((record) => record.sourceLabel === config.sourceLabel).length,
    heldCount: rangeHolds.length,
  });
}

const report = {
  sourceFile: "jamb_questions_only.pdf",
  answerFiles: files.map((file) => file.split("/").pop()),
  declaredRecordCount: 300,
  modelBankCandidateCount: modelFingerprints.size,
  authorisedLedgerCandidateCount: ledgerFingerprints.size,
  eligibleCount: eligible.length,
  heldCount: holds.length,
  perRange,
  held: holds.sort((a, b) => a.subject.localeCompare(b.subject) || a.questionNumber - b.questionNumber || a.reason.localeCompare(b.reason)),
  stagedPath: STAGED_PATH,
  releasePolicy: "This audit stages eligible records only. It does not import, approve, or expose any record to learner gameplay.",
};
await writeFile(STAGED_PATH, `${JSON.stringify(eligible, null, 2)}\n`);
await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exit(0);
