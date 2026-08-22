import { readFile, writeFile } from "node:fs/promises";
import { getDb } from "../server/db";
import { questionItems } from "../drizzle/schema";
import { resolveSyllabusTopic } from "../shared/syllabusTopicMap";

type Candidate = {
  number: number;
  category: string;
  question: string;
  options: string[];
  answerIndex: number;
  answerNote: string;
  explanation: string;
  sourceFile: string;
};

type Hold = {
  externalId: string;
  questionNumber: number;
  reason: string;
  question: string;
};

const INPUT_FILES = Array.from(
  { length: 10 },
  (_, index) => `/home/ubuntu/upload/pasted_content${index === 0 ? "" : `_${index + 1}`}.txt`,
);
const STAGED_PATH = "/home/ubuntu/jamb-import-staging/owner_chemistry_1_250_stage.json";
const REPORT_PATH = "/home/ubuntu/jamb-quiz-game/reports/owner_chemistry_1_250_audit.json";
const MODEL_BANK_PATH = "/home/ubuntu/jamb-import-staging/model_bank_for_duplicate_audit.json";

const superscript: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻", "a": "ᵃ", "b": "ᵇ", "c": "ᶜ", "d": "ᵈ", "n": "ⁿ", "m": "ᵐ" };
const subscript: Record<string, string> = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉", "+": "₊", "-": "₋" };

function convertCharacters(value: string, map: Record<string, string>) {
  return [...value].map((character) => map[character] ?? character).join("");
}

function displayMath(value: string) {
  let output = value.trim();
  for (let pass = 0; pass < 5; pass += 1) {
    output = output.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)");
    output = output.replace(/\\sqrt\{([^{}]+)\}/g, "√($1)");
  }
  return output
    .replace(/\\text\{([^{}]+)\}/g, "$1")
    .replace(/\\mathrm\{([^{}]+)\}/g, "$1")
    .replace(/\\rightleftharpoons/g, "⇌")
    .replace(/\\rightarrow/g, "→")
    .replace(/\\propto/g, "∝")
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·")
    .replace(/\\circ/g, "°")
    .replace(/\\Omega/g, "Ω")
    .replace(/\\mu/g, "µ")
    .replace(/\\Delta/g, "Δ")
    .replace(/\\theta/g, "θ")
    .replace(/\\lambda/g, "λ")
    .replace(/\\rho/g, "ρ")
    .replace(/\\Phi/g, "Φ")
    .replace(/\\phi/g, "φ")
    .replace(/\\pi/g, "π")
    .replace(/\^°/g, "°")
    .replace(/\^\{?([0-9+abcdmn-]+)\}?/g, (_, exponent: string) => convertCharacters(exponent, superscript))
    .replace(/_\{?([0-9+-]+)\}?/g, (_, index: string) => convertCharacters(index, subscript))
    .replace(/_\{?([A-Za-z]+)\}?/g, " $1")
    .replace(/[{}]/g, "")
    .replace(/\\/g, "");
}

function clean(value: string) {
  return value
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, equation: string) => ` ${displayMath(equation)} `)
    .replace(/\$([^$]+)\$/g, (_, equation: string) => ` ${displayMath(equation)} `)
    .replace(/\*\*/g, "")
    .replace(/[`*_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function compactExplanation(value: string) {
  const sentences = clean(value).split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, 4).join(" ").trim();
}

function normalize(value: string) {
  return clean(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/φ/g, " phi ")
    .replace(/θ/g, " theta ")
    .replace(/λ/g, " lambda ")
    .replace(/ρ/g, " rho ")
    .replace(/Φ/g, " phi ")
    .replace(/Δ/g, " delta ")
    .replace(/\+/g, " plus ")
    .replace(/[−-]/g, " minus ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function fingerprint(question: string, options: string[]) {
  return `${normalize(question)}\u0000${options.map(normalize).join("\u0001")}`;
}

function externalId(number: number) {
  return `CHEM-OWNER-20260822-R2-${String(number).padStart(3, "0")}`;
}

function hasRawMarkup(value: string) {
  return /\$\$|\\(?:frac|sqrt|text|mathrm|rightleftharpoons|rightarrow|propto|times|cdot|circ|Omega|mu|Delta|theta|lambda|rho|Phi|phi|pi)|(?:\^|_)\{?/.test(value);
}

function chemistryTopic(category: string, question: string) {
  const value = normalize(`${category} ${question}`);
  const matches: Array<[RegExp, string]> = [
    [/radioactivity|alpha radiation|beta radiation|gamma radiation|penetrating power|half(?: minus)? life|radioactive dating|nuclear fission|nuclear fusion|nuclear equation|nuclear stability|radioisotope|atomic number generally|gamma emission/, "Nuclear chemistry"],
    [/filtration|distillation|distilled water|chromatography|sublimation|mixture|matter|physical change|chemical change/, "Separation of mixtures"],
    [/mole|avogadro|stoichiometr|conservation of mass|definite proportions|balanced equation|balancing equations|limiting reactant|empirical formula|relative molecular|molar concentration|dilution|titration|percentage composition|molar gas|gas volume|water of crystallization/, "Chemical combination"],
    [/boyle|charles|ideal gas|graham|gas diffusion|vapour density|brownian|solid state|liquid state|kinetic theory|air composition|oxygen percentage/, "Kinetic theory of matter and gases"],
    [/atom|proton|neutron|electron|element|compound|atomic orbital|pauli|aufbau|electronic configuration|periodic table|period number|periodic trend|electronegativity|ionization energy|valence electron|molecular shape|polarity|intermolecular|ionic compound|ionic bond|covalent bond|metallic bond|coordinate bond|hydrogen bond|isotope/, "Atomic structure and bonding"],
    [/acid|base|ph\b|neutralization|indicator|salt|buffer|titration|common ion/, "Acids, bases and salts"],
    [/solubility|saturated|temporary hardness|permanent hardness|precipitation|qualitative analysis|chloride ions|sulfate ions|flame test|ammonium ions|solubility product/, "Solubility"],
    [/oxidation|reducing agent|oxidizing agent|oxidation number|redox|displacement reaction/, "Oxidation and reduction"],
    [/electrolyte|electrolysis|electroplating|cathode|anode|electrochemical cell|electrode potential|electrical energy|faraday|quantity of electricity|metal deposited|strong electrolyte/, "Electrolysis"],
    [/enthalpy|exothermic|endothermic|hess/, "Energy changes"],
    [/reaction rate|activation energy|effect of temperature|effect of concentration|surface area|catalyst/, "Rates of reaction"],
    [/reversible|equilibrium|le chatelier|effect of pressure|equilibrium constant|effect of a catalyst/, "Chemical equilibria"],
    [/alkane|alkene|alkyne|benzene|aromatic|ethanol|ethanal|ethanoic|ester|polymer|soap|detergent|isomer|functional group|substitution reaction|addition reaction|hydration|fermentation|saponification|hydrogenation|dehydration|amino acid|protein|carbohydrate|organic nomenclature|propene|alcohol|ketone|aldehyde|crude oil|octane|combustion|homologous|bromine water|cracking|hard water|vulcanization/, "Organic compounds"],
    [/aluminium|iron ore|main ore of iron|blast furnace|alloy|brass|reactivity series|rusting|galvanizing|basic oxide|amphoteric oxide|magnesium oxide|metal/, "Metals and their compounds"],
    [/oxygen|hydrogen|chlorine|ammonia|sulfuric acid|nitrogen fertilizer|noble gas|halogen|acidic oxide|sulfur dioxide/, "Non-metals and their compounds"],
    [/pollution|acid rain|greenhouse|ozone|carbon monoxide|catalytic converter|eutrophication|biodegradable|soil pollution|air pollutant|water pollution|biochemical oxygen demand|green chemistry/, "Environmental pollution"],
    [/haber|contact process|fertilizer composition|cement|glass|industrial chemistry|industrial catalyst/, "Chemistry and industry"],
  ];
  return matches.find(([pattern]) => pattern.test(value))?.[1] ?? resolveSyllabusTopic("Chemistry", `${category} ${question}`);
}

function parseFile(text: string, sourceFile: string) {
  const headers = [...text.matchAll(/^###[ \t]+(\d+)\.[ \t]*(.*)$/gm)];
  const parsed: Candidate[] = [];
  const holds: Hold[] = [];
  for (const [index, header] of headers.entries()) {
    const number = Number(header[1]);
    const category = clean(header[2]);
    const block = text.slice(header.index! + header[0].length, headers[index + 1]?.index ?? text.length);
    const options = [...block.matchAll(/^([A-E])\.\s+(.+?)\s*$/gm)].map((option) => clean(option[2]));
    const answer = block.match(/\*\*Correct answer:\s*([A-E])(?:\s*[—-]\s*([^\n*]+))?/i);
    const explanation = block.match(/\*\*Explanation:\*\*\s*([\s\S]*?)(?=\n\s*\*\*\*|$)/i);
    const question = clean(block.slice(0, block.search(/^A\.\s+/m)));
    const id = externalId(number);
    if (!question || options.length < 4 || options.length > 5 || !answer || !explanation) {
      holds.push({ externalId: id, questionNumber: number, reason: "Structural hold: question, four-or-five option set, explicit answer key, or explanation is incomplete.", question });
      continue;
    }
    parsed.push({
      number,
      category,
      question,
      options,
      answerIndex: "ABCDE".indexOf(answer[1].toUpperCase()),
      answerNote: clean(answer[2] ?? ""),
      explanation: compactExplanation(explanation[1]),
      sourceFile,
    });
  }
  return { parsed, holds };
}

const input = await Promise.all(INPUT_FILES.map(async (file) => ({ sourceFile: file.split("/").pop()!, text: await readFile(file, "utf8") })));
const parsedOutput = input.map(({ sourceFile, text }) => parseFile(text, sourceFile));
const parsed = parsedOutput.flatMap((output) => output.parsed);
const holds: Hold[] = parsedOutput.flatMap((output) => output.holds);
const expected = new Set(Array.from({ length: 250 }, (_, index) => index + 1));
const found = new Set(parsed.map((candidate) => candidate.number));
for (const number of expected) {
  if (!found.has(number)) holds.push({ externalId: externalId(number), questionNumber: number, reason: "Completeness hold: the declared record did not parse as a complete question block.", question: "" });
}

const internalSeen = new Set<string>();
const internalDuplicates: Candidate[] = [];
const unique = parsed.filter((candidate) => {
  const key = fingerprint(candidate.question, candidate.options);
  if (internalSeen.has(key)) {
    internalDuplicates.push(candidate);
    holds.push({ externalId: externalId(candidate.number), questionNumber: candidate.number, reason: "Duplicate hold: the full normalized question-and-option fingerprint repeats within this submitted batch.", question: candidate.question });
    return false;
  }
  internalSeen.add(key);
  return true;
});

const model = JSON.parse(await readFile(MODEL_BANK_PATH, "utf8")) as { questions?: Array<{ question?: string; options?: string[] }> };
const modelFingerprints = new Set((model.questions ?? []).filter((record) => typeof record.question === "string" && Array.isArray(record.options)).map((record) => fingerprint(record.question!, record.options!)));
const db = await getDb();
if (!db) throw new Error("Database unavailable for duplicate screening.");
const ledger = await db.select({ externalId: questionItems.externalId, questionText: questionItems.questionText, optionsJson: questionItems.optionsJson }).from(questionItems);
const ledgerFingerprints = new Set(ledger.flatMap((record) => {
  try {
    const options = JSON.parse(record.optionsJson);
    return Array.isArray(options) ? [fingerprint(record.questionText, options)] : [];
  } catch {
    return [];
  }
}));
const existingExternalIds = new Set(ledger.map((record) => record.externalId.toLowerCase()));

const eligible = unique.flatMap((candidate) => {
  const id = externalId(candidate.number);
  const topic = chemistryTopic(candidate.category, candidate.question);
  const sourceKeyMismatch = Boolean(candidate.answerNote) && /[0-9=+−-]/.test(candidate.answerNote) && normalize(candidate.answerNote) !== normalize(candidate.options[candidate.answerIndex] ?? "");
  const invalidOptions = new Set(candidate.options.map(normalize)).size !== candidate.options.length || candidate.options.some((option) => !option);
  const rawMarkup = [candidate.question, ...candidate.options, candidate.explanation].some(hasRawMarkup);
  const genericExplanation = /(?:for this topic|compare each option|therefore the correct answer is|this shows why the answer is)/i.test(candidate.explanation);
  if (modelFingerprints.has(fingerprint(candidate.question, candidate.options)) || ledgerFingerprints.has(fingerprint(candidate.question, candidate.options))) {
    holds.push({ externalId: id, questionNumber: candidate.number, reason: "Duplicate hold: the full normalized question-and-option fingerprint already exists in the managed model bank or authorised ledger.", question: candidate.question });
    return [];
  }
  if (existingExternalIds.has(id.toLowerCase())) {
    holds.push({ externalId: id, questionNumber: candidate.number, reason: "External-ID hold: this source identifier already exists in the authorised ledger.", question: candidate.question });
    return [];
  }
  if (invalidOptions || candidate.answerIndex < 0 || candidate.answerIndex >= candidate.options.length || !candidate.explanation) {
    holds.push({ externalId: id, questionNumber: candidate.number, reason: "Structural hold: option set, answer target, or compact explanation is not usable.", question: candidate.question });
    return [];
  }
  if (sourceKeyMismatch) {
    holds.push({ externalId: id, questionNumber: candidate.number, reason: "Answer-key hold: the supplied answer letter conflicts with its numeric or formula answer note and the listed option text.", question: candidate.question });
    return [];
  }
  if (rawMarkup) {
    holds.push({ externalId: id, questionNumber: candidate.number, reason: "Formatting hold: raw Markdown or LaTex remains after safe Unicode conversion.", question: candidate.question });
    return [];
  }
  if (genericExplanation) {
    holds.push({ externalId: id, questionNumber: candidate.number, reason: "Explanation hold: source text contains a generic template-style explanation tail.", question: candidate.question });
    return [];
  }
  if (!topic || resolveSyllabusTopic("Chemistry", topic) === null) {
    holds.push({ externalId: id, questionNumber: candidate.number, reason: "Syllabus hold: no exact official JAMB Chemistry syllabus area could be resolved safely.", question: candidate.question });
    return [];
  }
  return [{
    externalId: id,
    subject: "Chemistry" as const,
    topic,
    difficulty: "medium" as const,
    question: candidate.question,
    options: candidate.options,
    answerIndex: candidate.answerIndex,
    explanation: candidate.explanation,
    sourceLabel: "Owner-supplied Chemistry 1–250 batch · 22 Aug 2026",
    permissionNote: "Owner-supplied study content. Imported as authorised JAMB Quest practice material; source wording and answer key remain attributable to the owner-supplied batch.",
  }];
});

const report = {
  sourceFiles: input.map(({ sourceFile }) => sourceFile),
  declaredRange: "Chemistry 1–250",
  expectedCount: 250,
  parsedCount: parsed.length,
  uniqueParsedCount: unique.length,
  internalDuplicateCount: internalDuplicates.length,
  modelBankCandidateCount: modelFingerprints.size,
  authorisedLedgerCandidateCount: ledgerFingerprints.size,
  eligibleCount: eligible.length,
  heldCount: holds.length,
  held: holds,
  stagedPath: STAGED_PATH,
};
await writeFile(STAGED_PATH, `${JSON.stringify(eligible, null, 2)}\n`);
await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
