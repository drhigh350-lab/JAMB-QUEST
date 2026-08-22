import { readFile, writeFile } from "node:fs/promises";
import { getDb } from "../server/db";
import { questionItems } from "../drizzle/schema";
import { resolveSyllabusTopic, type SyllabusSubject } from "../shared/syllabusTopicMap";

type Subject = "Biology" | "Physics";

type Candidate = {
  subject: Subject;
  number: number;
  category: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  sourceFile: string;
};

type Hold = {
  externalId: string;
  subject: Subject;
  questionNumber: number;
  reason: string;
  question: string;
};

const BIOLOGY_FILES = Array.from(
  { length: 6 },
  (_, index) => `/home/ubuntu/upload/pasted_content${index === 0 ? "" : `_${index + 1}`}.txt`,
);
const PHYSICS_FILES = Array.from(
  { length: 10 },
  (_, index) => `/home/ubuntu/upload/pasted_content_${index + 7}.txt`,
);
const STAGED_PATH = "/home/ubuntu/jamb-import-staging/owner_biology_physics_250_stage.json";
const REPORT_PATH = "/home/ubuntu/jamb-quiz-game/reports/owner_biology_physics_250_audit.json";
const MODEL_BANK_PATH = "/home/ubuntu/jamb-import-staging/model_bank_for_duplicate_audit.json";

const superscriptDigits: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "-": "⁻",
};

function toSuperscript(value: string) {
  return [...value].map((character) => superscriptDigits[character] ?? character).join("");
}

function displayMath(value: string) {
  let output = value.trim();
  for (let pass = 0; pass < 4; pass += 1) {
    output = output.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)");
  }
  return output
    .replace(/\\text\{([^{}]+)\}/g, "$1")
    .replace(/\\mathrm\{([^{}]+)\}/g, "$1")
    .replace(/\\mathcal\{E\}/g, "ℰ")
    .replace(/\\times/g, "×")
    .replace(/\\Omega/g, "Ω")
    .replace(/\\mu/g, "µ")
    .replace(/\\Delta/g, "Δ")
    .replace(/\\theta/g, "θ")
    .replace(/\\lambda/g, "λ")
    .replace(/\\rho/g, "ρ")
    .replace(/\\omega/g, "ω")
    .replace(/\\Phi/g, "Φ")
    .replace(/\\pi/g, "π")
    .replace(/\\circ/g, "°")
    .replace(/\^\{?(-?[0-9]+)\}?/g, (_, exponent: string) => toSuperscript(exponent))
    .replace(/[{}]/g, "")
    .replace(/\\/g, "");
}

function clean(value: string) {
  return value
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, equation: string) => ` ${displayMath(equation)} `)
    .replace(/\$([^$]+)\$/g, (_, equation: string) => ` ${displayMath(equation)} `)
    .replace(/\[\d+\]/g, "")
    .replace(/\*\*/g, "")
    .replace(/[`*_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function compactExplanation(value: string) {
  const source = clean(value);
  const sentences = source.split(/(?<=[.!?])\s+/).filter(Boolean);
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
    .replace(/ω/g, " omega ")
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

function externalId(subject: Subject, number: number) {
  const prefix = subject === "Biology" ? "BIO" : "PHY";
  return `${prefix}-OWNER-20260822-R2-${String(number).padStart(3, "0")}`;
}

function hasRawMarkup(value: string) {
  return /\$\$|\\(?:frac|text|mathrm|Omega|mu|Delta|theta|lambda|rho|omega|Phi|pi|circ)|\*\*/.test(value);
}

function biologyTopic(category: string, question: string) {
  const value = normalize(`${category} ${question}`);
  const matches: Array<[RegExp, string]> = [
    [/respirat|alveol|gaseous exchange|oxygen|carbon dioxide|respiratory quotient|cell respiration|glycolysis|inhalation|diaphragm/, "Respiration"],
    [/excret|nephron|urea|osmoregulation|antidiuretic|plasmolysis|turgor pressure/, "Excretion"],
    [/hormone|insulin|thyroxine|homeostasis|reflex|eye function|ear function|endocrine|blood glucose|temperature regulation/, "Coordination and control"],
    [/blood circulation|blood pressure|capillaries|heart valves|pulmonary|blood group/, "Transport"],
    [/soil/, "Soil"],
    [/biotic factor|ecological factor|competition|distribution/, "Factors affecting distribution"],
    [/symbiosis|commensalism|parasitism/, "Symbiotic interactions"],
    [/taxonomy|classification|bacteria|virus|fungi|arthropod|vertebrate|mammal|binomial/, "Evolution and classification"],
    [/root|leaf|stomata|photosynthesis|plant hormone|transpiration|xylem|cambium|vascular|plant classification/, "Plant and mammal structure"],
    [/nutrition|digestive|pancreas|large intestine/, "Nutrition and digestion"],
    [/reproduct|placenta|menstrual|birth control|double fertilization|fruit formation|seed dispersal/, "Reproduction"],
    [/variation|continuous variation|discontinuous variation/, "Variation"],
    [/heredity|meiosis|crossing over|test cross|codominance|sex determination|sex linked|haemophilia|dihybrid|paternity|rhesus|inheritance probability/, "Heredity"],
    [/fossil|vestigial|homologous/, "Evidence of evolution"],
    [/speciation|genetic drift|natural selection|adaptive radiation|evolution|artificial selection/, "Theories of evolution"],
    [/biotechnology|fermentation|yoghurt|genetic engineering|genetically modified|tissue culture|selective breeding/, "Biotechnology"],
    [/population|quadrat|capture mark recapture|capture|recapture|ecological pyramid|biomass|ecological efficiency|population curve|environmental resistance/, "Population ecology"],
    [/mangrove|xerophyte|hydrophyte|desert|natural habitat|ecological niche|nitrogen cycle|water cycle/, "Natural habitats"],
    [/adaptation|streamlined/, "Adaptations of organisms"],
    [/disease|tuberculosis|sexually transmitted|pollution|sewage|acid rain|carbon monoxide|greenhouse|water treatment|immunity|antibiotic resistance|conservation|endangered|national park|sustainable use|crop pest|damages crops|biological control|food preservation|pasteurization|chlorination|biodiversity/, "Humans and environment"],
    [/mitosis|dna|cell specialization|stem cell|enzyme|genetic code/, "Living organisms and organization"],
    [/mutation/, "Variation"],
    [/compete for a resource|limiting resources/, "Factors affecting distribution"],
  ];
  return matches.find(([pattern]) => pattern.test(value))?.[1] ?? resolveSyllabusTopic("Biology", `${category} ${question}`);
}

function physicsTopic(category: string, question: string) {
  const value = normalize(`${category} ${question}`);
  const matches: Array<[RegExp, string]> = [
    [/accuracy|precision|zero error|parallax|percentage error|significant figures|standard form|micrometer|vernier|measuring cylinder|independent variable|repeated measurement|physical quantities|dimensional formula|measuring instrument|derived quantity|directly proportional|inversely proportional|graph of y/, "Measurements and units"],
    [/gravit|escape velocity|satellite|weight of a body/, "Gravitational field"],
    [/equilibrium|moment|torque|centre of gravity|stability/, "Equilibrium of forces"],
    [/work done|kinetic energy|potential energy|power|conservation of energy|mechanical energy|elastic potential energy/, "Work, energy and power"],
    [/mechanical advantage|velocity ratio|efficiency of a machine/, "Machines"],
    [/hooke|young s modulus|elastic deformation|spring/, "Elasticity"],
    [/pressure and area|pressure is defined|atmospheric pressure|barometer|pascal|hydraulic/, "Pressure"],
    [/liquid pressure|density|relative density|surface tension|capillarity|viscosity|upthrust|floating/, "Liquids at rest"],
    [/temperature|kelvin|thermometer|thermal equilibrium/, "Temperature and measurement"],
    [/specific heat|heat capacity|heat required|quantity of heat/, "Quantity of heat"],
    [/latent|evaporation|boiling point|change of state/, "Change of state"],
    [/thermal expansion|bimetallic/, "Thermal expansion"],
    [/boyle|charles|gas pressure/, "Gas laws"],
    [/kinetic theory|brownian/, "Structure of matter and kinetic theory"],
    [/heat transfer|thermal conduction|convection|black surfaces|thermos flask|heat conduction/, "Heat transfer"],
    [/echo|reverberation|loudness|doppler|resonance|pitch|sound characteristics/, "Characteristics of sound"],
    [/sound wave|sound waves|propagation of sound/, "Propagation of sound"],
    [/reflection|plane mirror|concave mirror|convex mirror/, "Reflection"],
    [/refraction|refractive index|total internal|critical angle|glass block/, "Refraction"],
    [/convex lens|focal length|lens power|magnification|optical/, "Optical instruments"],
    [/dispersion/, "Dispersion and colours"],
    [/electrostatic|coulomb|electric field|potential difference|electric charge|electric potential energy/, "Electrostatics"],
    [/capacitor|capacitance/, "Capacitors"],
    [/electric cell|electromotive|internal resistance/, "Electric cells"],
    [/current|ammeter|voltmeter|ohm|resistance|resistivity|fuse|electrical energy|electrical heating|resistor voltage|charge transferred/, "Current electricity"],
    [/magnetic field|electromagnet|electric motor|magnetic force|magnets?/, "Magnets and magnetic fields"],
    [/electromagnetic induction|faraday|lenz|transformer|generator|eddy current|magnetic flux|induced emf/, "Electromagnetic induction"],
    [/alternating current|rectification|ac circuit/, "AC circuits"],
    [/electrolysis|electrolyte|cathode|electroplating|thermionic|conduction in gases|conduction in liquids/, "Conduction of electricity"],
    [/diode|transistor|logic gate|semiconductor|electronic/, "Introductory electronics"],
    [/radioactivity|radioactive|atomic|mass number|isotope|line emission|nuclear|photoelectric|x ray|gamma|alpha|beta|half life|binding energy/, "Modern physics"],
    [/wave|frequency|wavelength|diffraction|interference|polarization|stationary wave|amplitude/, "Waves"],
    [/motion|speed|velocity|accelerat|distance travelled|newton|momentum|impulse|friction|projectile|centripetal|angular velocity|simple pendulum|free fall|collision|scalar quantity|vector quantity|gradient|directly proportional|inversely proportional/, "Motion"],
  ];
  return matches.find(([pattern]) => pattern.test(value))?.[1] ?? resolveSyllabusTopic("Physics", `${category} ${question}`);
}

function topicFor(subject: Subject, category: string, question: string) {
  return subject === "Biology" ? biologyTopic(category, question) : physicsTopic(category, question);
}

function parseFile(subject: Subject, text: string, sourceFile: string) {
  const headers = [...text.matchAll(/^###[ \t]+(\d+)\.[ \t]*(.*)$/gm)];
  const parsed: Candidate[] = [];
  const holds: Hold[] = [];
  for (const [index, header] of headers.entries()) {
    const number = Number(header[1]);
    const category = clean(header[2]);
    const block = text.slice(header.index! + header[0].length, headers[index + 1]?.index ?? text.length);
    const options = [...block.matchAll(/^([A-E])\.\s+(.+?)\s*$/gm)].map((option) => clean(option[2]));
    const answer = block.match(/\*\*Correct answer:\s*([A-E])/i);
    const explanation = block.match(/\*\*Explanation:\*\*\s*([\s\S]*?)(?=\n\s*\*\*\*|$)/i);
    const question = clean(block.slice(0, block.search(/^A\.\s+/m)));
    const id = externalId(subject, number);
    if (!question || options.length < 4 || options.length > 5 || !answer || !explanation) {
      const missing = [
        !question ? "question" : "",
        options.length < 4 || options.length > 5 ? `option count ${options.length}` : "",
        !answer ? "answer key" : "",
        !explanation ? "explanation" : "",
      ].filter(Boolean).join(", ");
      holds.push({ externalId: id, subject, questionNumber: number, reason: `Structural hold: incomplete ${missing}.`, question });
      continue;
    }
    parsed.push({
      subject,
      number,
      category,
      question,
      options,
      answerIndex: "ABCDE".indexOf(answer[1].toUpperCase()),
      explanation: compactExplanation(explanation[1]),
      sourceFile,
    });
  }
  return { parsed, holds };
}

const input = await Promise.all([
  ...BIOLOGY_FILES.map(async (file) => ({ subject: "Biology" as const, sourceFile: file.split("/").pop()!, text: await readFile(file, "utf8") })),
  ...PHYSICS_FILES.map(async (file) => ({ subject: "Physics" as const, sourceFile: file.split("/").pop()!, text: await readFile(file, "utf8") })),
]);
const parsedOutput = input.map(({ subject, sourceFile, text }) => parseFile(subject, text, sourceFile));
const parsed = parsedOutput.flatMap((output) => output.parsed);
const holds: Hold[] = parsedOutput.flatMap((output) => output.holds);

const expectedBySubject: Record<Subject, Set<number>> = {
  Biology: new Set(Array.from({ length: 150 }, (_, index) => index + 101)),
  Physics: new Set(Array.from({ length: 250 }, (_, index) => index + 1)),
};
for (const subject of ["Biology", "Physics"] as const) {
  const found = new Set(parsed.filter((candidate) => candidate.subject === subject).map((candidate) => candidate.number));
  for (const number of expectedBySubject[subject]) {
    if (!found.has(number)) {
      holds.push({ externalId: externalId(subject, number), subject, questionNumber: number, reason: "Completeness hold: the declared record did not parse as a complete question block.", question: "" });
    }
  }
}

const internalSeen = new Set<string>();
const internalDuplicates: Candidate[] = [];
const unique = parsed.filter((candidate) => {
  const key = fingerprint(candidate.question, candidate.options);
  if (internalSeen.has(key)) {
    internalDuplicates.push(candidate);
    holds.push({ externalId: externalId(candidate.subject, candidate.number), subject: candidate.subject, questionNumber: candidate.number, reason: "Duplicate hold: the full normalized question-and-option fingerprint repeats within this submitted batch.", question: candidate.question });
    return false;
  }
  internalSeen.add(key);
  return true;
});

const model = JSON.parse(await readFile(MODEL_BANK_PATH, "utf8")) as { questions?: Array<{ question?: string; options?: string[] }> };
const modelFingerprints = new Set(
  (model.questions ?? [])
    .filter((record) => typeof record.question === "string" && Array.isArray(record.options))
    .map((record) => fingerprint(record.question!, record.options!)),
);
const db = await getDb();
if (!db) throw new Error("Database unavailable for duplicate screening.");
const ledger = await db
  .select({ externalId: questionItems.externalId, questionText: questionItems.questionText, optionsJson: questionItems.optionsJson })
  .from(questionItems);
const ledgerFingerprints = new Set(
  ledger.flatMap((record) => {
    try {
      const options = JSON.parse(record.optionsJson);
      return Array.isArray(options) ? [fingerprint(record.questionText, options)] : [];
    } catch {
      return [];
    }
  }),
);
const existingExternalIds = new Set(ledger.map((record) => record.externalId.toLowerCase()));

const eligible = unique.flatMap((candidate) => {
  const id = externalId(candidate.subject, candidate.number);
  const topic = topicFor(candidate.subject, candidate.category, candidate.question);
  const duplicate = modelFingerprints.has(fingerprint(candidate.question, candidate.options)) || ledgerFingerprints.has(fingerprint(candidate.question, candidate.options));
  const invalidOptions = new Set(candidate.options.map(normalize)).size !== candidate.options.length || candidate.options.some((option) => !option);
  const containsRawMarkup = [candidate.question, ...candidate.options, candidate.explanation].some(hasRawMarkup);
  const genericExplanation = /(?:for this topic|compare each option|therefore the correct answer is|this shows why the answer is)/i.test(candidate.explanation);
  if (duplicate) {
    holds.push({ externalId: id, subject: candidate.subject, questionNumber: candidate.number, reason: "Duplicate hold: the full normalized question-and-option fingerprint already exists in the managed model bank or authorised ledger.", question: candidate.question });
    return [];
  }
  if (existingExternalIds.has(id.toLowerCase())) {
    holds.push({ externalId: id, subject: candidate.subject, questionNumber: candidate.number, reason: "External-ID hold: this source identifier already exists in the authorised ledger.", question: candidate.question });
    return [];
  }
  if (invalidOptions || candidate.answerIndex < 0 || candidate.answerIndex >= candidate.options.length || !candidate.explanation) {
    holds.push({ externalId: id, subject: candidate.subject, questionNumber: candidate.number, reason: "Structural hold: option set, answer target, or compact explanation is not usable.", question: candidate.question });
    return [];
  }
  if (containsRawMarkup) {
    holds.push({ externalId: id, subject: candidate.subject, questionNumber: candidate.number, reason: "Formatting hold: raw Markdown or LaTex remains after the safe Unicode conversion.", question: candidate.question });
    return [];
  }
  if (genericExplanation) {
    holds.push({ externalId: id, subject: candidate.subject, questionNumber: candidate.number, reason: "Explanation hold: source text contains a generic template-style explanation tail.", question: candidate.question });
    return [];
  }
  if (!topic || resolveSyllabusTopic(candidate.subject as SyllabusSubject, topic) === null) {
    holds.push({ externalId: id, subject: candidate.subject, questionNumber: candidate.number, reason: "Syllabus hold: no exact official JAMB syllabus area could be resolved safely.", question: candidate.question });
    return [];
  }
  return [{
    externalId: id,
    subject: candidate.subject,
    topic,
    difficulty: "medium" as const,
    question: candidate.question,
    options: candidate.options,
    answerIndex: candidate.answerIndex,
    explanation: candidate.explanation,
    sourceLabel: `Owner-supplied ${candidate.subject} 250 batch · 22 Aug 2026`,
    permissionNote: "Owner-supplied study content. Imported as authorised JAMB Quest practice material; source wording and answer key remain attributable to the owner-supplied batch.",
  }];
});

const report = {
  sourceFiles: input.map(({ sourceFile }) => sourceFile),
  declaredRanges: { Biology: "101–250", Physics: "1–250" },
  expectedCount: 400,
  parsedCount: parsed.length,
  uniqueParsedCount: unique.length,
  internalDuplicateCount: internalDuplicates.length,
  modelBankCandidateCount: modelFingerprints.size,
  authorisedLedgerCandidateCount: ledgerFingerprints.size,
  eligibleCount: eligible.length,
  eligibleBySubject: {
    Biology: eligible.filter((record) => record.subject === "Biology").length,
    Physics: eligible.filter((record) => record.subject === "Physics").length,
  },
  heldCount: holds.length,
  held: holds,
  stagedPath: STAGED_PATH,
};

await writeFile(STAGED_PATH, `${JSON.stringify(eligible, null, 2)}\n`);
await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
