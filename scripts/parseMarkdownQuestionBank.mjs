import { basename, join } from "node:path";
import { readFile, writeFile } from "node:fs/promises";

const inputPath = process.argv[2];
if (!inputPath) throw new Error("Usage: node scripts/parseMarkdownQuestionBank.mjs <markdown-path>");

const text = await readFile(inputPath, "utf8");
const sourceFile = basename(inputPath);
const subjectFrom = (value) => {
  const lower = value.toLowerCase();
  if (lower.includes("english")) return "Use of English";
  if (lower.includes("biology") || /^bio[_-]/.test(lower)) return "Biology";
  if (lower.includes("chemistry") || /^chem[_-]/.test(lower)) return "Chemistry";
  if (lower.includes("physics") || /^phys[_-]/.test(lower)) return "Physics";
  return null;
};
const clean = (value) => value.replaceAll("✅", "").replace(/\*\*/g, "").replace(/__+/g, "").replace(/^\s*[-•]\s*/, "").replace(/^\s*[A-D][.)]\s*/i, "").trim();
const cleanExplanationLine = (value) => value.replaceAll("✅", "").replace(/\*\*/g, "").replace(/__+/g, "").trim();
const normalise = (value) => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
const isAnswerLine = (line) => /^\s*\*{0,2}answer\s*:/i.test(line);
const optionMatch = (line) => line.match(/^\s*[-•]\s*([A-D])[.)]\s*(.+)$/i);
const topicMatch = (line) => line.match(/^\s*(?:#{1,6}\s*)?(?:topic|subtopic)\s*:\s*(.+)$/i);
const inlineOptions = (line) => [...line.matchAll(/(?:^|\s)([A-D])[.)]\s*(.*?)(?=\s+[A-D][.)]\s*|$)/gi)].map((match) => match[2].trim()).filter(Boolean);
const inferTopic = (question, subjectName) => {
  const text = question.toLowerCase();
  const matches = (pattern) => pattern.test(text);
  if (subjectName === "Chemistry") {
    if (matches(/electroly|faraday|moles of electrons|cathode|anode/)) return "Electrochemistry";
    if (matches(/acid|alkali|neutralis|ph|aqua regia/)) return "Acids, Bases and Salts";
    if (matches(/polymer|plastic|monomer|pvc|perspex|detergent/)) return "Organic Chemistry and Polymers";
    if (matches(/moles|molar|empirical formula|percentage|gas law|solubility/)) return "Mole Concept and Stoichiometry";
    if (matches(/benzene|alcohol|alkane|alkene|homologous|decarboxyl/)) return "Organic Chemistry";
    if (matches(/iron|gold|steel|solder|extraction|blast furnace|ore/)) return "Metals and Extraction";
    if (matches(/hydrogen|haber|bosch|chlorine|bleaching/)) return "Industrial Chemistry";
    if (matches(/bond|ionisation|electron|periodic|atomic/)) return "Atomic Structure and Bonding";
    return "General Chemistry";
  }
  if (subjectName === "Biology") {
    if (matches(/gene|allele|chromosome|meiosis|mitosis|inheritance|blood group|sex-linked|evolution/)) return "Genetics and Evolution";
    if (matches(/ecology|succession|savanna|food chain|ddt|pollution|brackish|desert/)) return "Ecology";
    if (matches(/heart|blood|lung|kidney|brain|ear|liver|pancreas|hormone|excret/)) return "Human Physiology";
    if (matches(/plant|flower|xylem|transpiration|photosynthesis|root|stamen/)) return "Plant Biology";
    if (matches(/fungi|bacteria|disease|cholera|ringworm|organism/)) return "Classification and Microorganisms";
    if (matches(/cell|dna|protein|respiration|glucose/)) return "Cell Biology and Metabolism";
    return "General Biology";
  }
  if (subjectName === "Physics") {
    if (matches(/current|voltage|resistance|transformer|fuse|circuit|power|ammeter|electric/)) return "Electricity";
    if (matches(/wave|sound|light|mirror|lens|refraction|diffraction|doppler|colour|radioactivity/)) return "Waves, Optics and Modern Physics";
    if (matches(/motion|velocity|acceleration|force|work|energy|momentum|projectile|pendulum/)) return "Mechanics";
    if (matches(/heat|temperature|specific heat|thermal|viscosity/)) return "Thermal Physics";
    if (matches(/magnetic|induction|motor|lenz|resonance/)) return "Magnetism and Electromagnetism";
    return "General Physics";
  }
  return "General study";
};

let subject = subjectFrom(text.split("\n").slice(0, 8).join(" ")) ?? subjectFrom(sourceFile) ?? null;
let current = null;
let pendingTopic = null;
let collectingBullets = false;
const parsed = [];

function flush() {
  if (!current) return;
  const options = current.options.map(clean);
  const answerText = clean(current.answerText ?? "");
  let answerIndex = -1;
  if (current.answerLetter) answerIndex = current.answerLetter.charCodeAt(0) - 65;
  if (answerIndex < 0 && answerText) answerIndex = options.findIndex((option) => normalise(option) === normalise(answerText));
  const explanation = current.explanationParts.map(cleanExplanationLine).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (current.questionText && options.length === 4 && answerIndex >= 0 && answerIndex < 4) {
    parsed.push({
      externalId: `${sourceFile.replace(/[^a-z0-9]+/gi, "-")}-${(current.subject ?? subject ?? "unclassified").replace(/[^a-z0-9]+/gi, "-")}-${current.number}`,
      subject: current.subject ?? subject ?? "Unclassified",
      topic: clean(current.topic ?? inferTopic(current.questionText, current.subject ?? subject ?? "")),
      difficulty: "medium",
      question: clean(current.questionText),
      options,
      answerIndex,
      explanation: explanation || undefined,
      sourceLabel: `Owner-provided Markdown · ${sourceFile} · ${current.subject ?? subject ?? "Unclassified"}`,
      permissionNote: `Owner-provided upload: ${sourceFile}. Wording and answer mapping are verification-pending; do not represent as official JAMB wording without confirmation.`,
    });
  }
  current = null;
  collectingBullets = false;
}

for (const rawLine of text.split(/\r?\n/)) {
  const line = rawLine.trim();
  const headingSubject = subjectFrom(line);
  if (headingSubject && (!current || /^#{1,6}\s/.test(line) || /^\s*subject\s*:/i.test(line))) subject = headingSubject;
  const numberedHeading = line.match(/^##\s*Q?\s*(\d+)\s*$/i);
  const numberedBold = line.match(/^\*{2}\s*(\d+)\.\s*(.+?)\s*\*{2}\s*$/);
  const numberedPlain = line.match(/^(\d+)\.\s+(.+)$/);
  if (numberedHeading || numberedBold || numberedPlain) {
    flush();
    const questionMatch = numberedBold ?? numberedPlain;
    current = { number: Number((numberedHeading ?? questionMatch).at(1)), questionText: questionMatch?.at(2) ?? "", options: [], subject, answerText: "", explanationParts: [], topic: pendingTopic, collectingExplanation: false };
    pendingTopic = null;
    collectingBullets = false;
    continue;
  }
  if (!current) continue;

  const suppliedTopic = topicMatch(line);
  if (suppliedTopic) {
    if (!current.questionText || (!current.options.length && !current.answerText && !current.explanationParts.length)) current.topic = suppliedTopic[1];
    else pendingTopic = suppliedTopic[1];
    continue;
  }
  if (/^\s*\*{0,2}explanation\s*:/i.test(line)) {
    const openingLine = line.replace(/^\s*\*{0,2}explanation\s*:\s*/i, "").replace(/\*{2}$/g, "");
    if (openingLine) current.explanationParts.push(openingLine);
    current.collectingExplanation = true;
    collectingBullets = false;
    continue;
  }
  if (current.collectingExplanation) {
    if (!line) current.explanationParts.push("");
    else if (!line.startsWith("---")) current.explanationParts.push(rawLine.trim());
    continue;
  }
  if (/^\s*options\s*:/i.test(line)) {
    const inline = line.replace(/^\s*options\s*:\s*/i, "");
    if (inline.includes("|")) current.options.push(...inline.split("|").map(clean).filter(Boolean));
    collectingBullets = true;
    continue;
  }
  const inline = inlineOptions(line);
  if (inline.length === 4 && !current.options.length) {
    current.options.push(...inline.map(clean));
    collectingBullets = false;
    continue;
  }
  const option = optionMatch(line);
  if (option && (collectingBullets || current.options.length < 4)) {
    current.options.push(clean(option[2]));
    continue;
  }
  if (isAnswerLine(line)) {
    const answer = line.replace(/^\s*\*{0,2}answer\s*:\s*/i, "").replace(/\*{2}$/g, "").trim();
    const letter = answer.match(/^([A-D])[.)]?\s*/i);
    current.answerLetter = letter?.[1]?.toUpperCase();
    current.answerText = letter ? answer.slice(letter[0].length) : answer;
    collectingBullets = false;
    current.collectingExplanation = true;
    continue;
  }
  if (!current.questionText && line && !line.startsWith("---") && !/^\s*(Format|Date|Source|Compiled):/i.test(line)) current.questionText = line;
  if (current.questionText && !current.options.length && line && !line.startsWith("---") && !/^\s*(Options|Answer|Explanation):/i.test(line)) current.questionText = `${current.questionText} ${line}`.trim();
}
flush();

const seen = new Set();
const unique = [];
let duplicateCount = 0;
for (const record of parsed) {
  const fingerprint = `${record.subject}:${normalise(record.question)}`;
  if (seen.has(fingerprint)) { duplicateCount += 1; continue; }
  seen.add(fingerprint);
  unique.push(record);
}
const rejectedCount = Math.max(0, parsed.length - unique.length);
const richExplanationCount = unique.filter((record) => (record.explanation ?? "").split(/\n|(?<=[.!?])\s+/).map((line) => line.trim()).filter(Boolean).length >= 5).length;
const outputBase = sourceFile.replace(/\.[a-z0-9]+$/i, "");
const outputPath = join("/home/ubuntu/jamb-import-staging", `${outputBase}.validated.json`);
const reportPath = join("/home/ubuntu/jamb-import-staging", `${outputBase}.validation-report.json`);
const report = { sourceFile, parsedCount: parsed.length, acceptedCount: unique.length, duplicateCount, rejectedCount, richExplanationCount, subjects: Object.fromEntries([...new Set(unique.map((record) => record.subject))].map((name) => [name, unique.filter((record) => record.subject === name).length])) };
await writeFile(outputPath, `${JSON.stringify(unique, null, 2)}\n`);
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ ...report, outputPath }, null, 2));
