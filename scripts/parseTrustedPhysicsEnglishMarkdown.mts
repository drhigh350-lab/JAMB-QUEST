import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { inferVerifiedTopic } from "../shared/topicInference";
import { resolveSyllabusTopic, type SyllabusSubject } from "../shared/syllabusTopicMap";

type Subject = "Physics" | "Use of English";
type ParsedRecord = {
  externalId: string;
  subject: Subject;
  topic: string;
  difficulty: "medium";
  question: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
  sourceLabel: string;
  permissionNote: string;
};

type Draft = {
  number: number;
  topicRaw: string;
  questionParts: string[];
  options: string[];
  answerLetter: string | null;
  explanationParts: string[];
};

const sourceConfigs: Array<{ path: string; subject: Subject; label: string }> = [
  {
    path: "/home/ubuntu/upload/physics_100-1.md",
    subject: "Physics",
    label: "JAMB Quest Physics Bank · Trusted owner Markdown · August 2026",
  },
  {
    path: "/home/ubuntu/upload/english_100.md",
    subject: "Use of English",
    label: "JAMB Quest Use of English Bank · Trusted owner Markdown · August 2026",
  },
];

const permissionNote = "The JAMB Quest owner designated this Markdown source as trusted. Supplied question wording, answer keys, and explanations are imported directly; only duplicate prevention, option/answer-index alignment, and official syllabus mapping are applied for reliable gameplay.";

function clean(value: string) {
  return value.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
}

function mapEnglishTopic(raw: string) {
  const value = raw.toLowerCase();
  if (/reading|comprehension|inference|main idea|tone|author|passage/.test(value)) return "Comprehension passages";
  if (/synonym|nearest in meaning/.test(value)) return "Synonyms";
  if (/antonym|opposite/.test(value)) return "Antonyms";
  if (/punctuation|apostrophe|semicolon|colon|mechanics/.test(value)) return "Mechanics";
  if (/idiom|phrasal verb|register|contextual meaning|word choice|vocabulary|word stem|prefix|word pair/.test(value)) return "Ordinary, figurative and idiomatic usage";
  if (/tense|agreement|conditional|modal|subjunctive/.test(value)) return "Tense, aspect, number and agreement";
  if (/pronoun|relative clause|reported speech|parallel|modifier|fragment|inversion|sentence/.test(value)) return "Clause and sentence patterns";
  if (/article|word class|noun|gerund|preposition/.test(value)) return "Word classes";
  return resolveSyllabusTopic("Use of English", raw);
}

function mapPhysicsTopic(raw: string, question: string) {
  const value = raw.toLowerCase();
  if (/magnetism.*force|force.*current-carrying conductor|force.*conductor/.test(value)) return "Force on a current-carrying conductor";
  if (/induced|faraday|lenz|electromagnet/.test(value)) return "Electromagnetic induction";
  if (/radioactiv|nuclear|photoelectric|electron energy level|atomic spectrum|x.?ray/.test(value)) return "Modern physics";
  if (/thermal expansion/.test(value)) return "Thermal expansion";
  if (/specific heat|heat capacity|heat and temperature|thermodynamic/.test(value)) return "Quantity of heat";
  if (/dispersion|spectrum|prism/.test(value)) return "Dispersion and colours";
  if (/kinematic|free fall|circular motion|momentum|simple harmonic|pendulum|projectile/.test(value)) return "Motion";
  if (/\bforce\b|newton|friction|\bdynamics\b/.test(value)) return "Equilibrium of forces";
  if (/work|kinetic energy|potential energy|power/.test(value)) return "Work, energy and power";
  if (/elastic|hooke/.test(value)) return "Elasticity";
  if (/pressure/.test(value)) return "Pressure";
  if (/buoyan|archimedes|hydraulic|bernoulli|fluid/.test(value)) return "Liquids at rest";
  if (/gas|ideal gas/.test(value)) return "Gas laws";
  if (/wave/.test(value)) return "Waves";
  if (/sound/.test(value)) return /frequency|pitch|loudness|resonance/.test(value) ? "Characteristics of sound" : "Propagation of sound";
  if (/mirror/.test(value)) return "Reflection";
  if (/refraction/.test(value)) return "Refraction";
  if (/lens|optics|camera|microscope/.test(value)) return "Optical instruments";
  if (/coulomb|electric field|electrostatic/.test(value)) return "Electrostatics";
  if (/resistance|ohm|circuit|current/.test(value)) return "Current electricity";
  if (/semiconductor|diode|transistor/.test(value)) return "Introductory electronics";
  const resolvedRaw = resolveSyllabusTopic("Physics", raw);
  if (resolvedRaw) return resolvedRaw;
  const inferred = inferVerifiedTopic("Physics", question);
  return inferred ? resolveSyllabusTopic("Physics", inferred) : null;
}

function mapTopic(subject: Subject, raw: string, question: string) {
  return subject === "Physics" ? mapPhysicsTopic(raw, question) : mapEnglishTopic(raw);
}

function parseFile(config: (typeof sourceConfigs)[number]) {
  return readFile(config.path, "utf8").then((text) => {
    const drafts = new Map<number, Draft>();
    let current: Draft | null = null;
    const flush = () => {
      if (!current) return;
      // A later occurrence of the same numbered question intentionally supersedes an earlier correction draft.
      drafts.set(current.number, current);
      current = null;
    };

    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      const heading = line.match(/^\*\*Q(\d+)\. \[Topic:\s*(.+?)\]\*\*$/i);
      if (heading) {
        flush();
        current = {
          number: Number(heading[1]),
          topicRaw: clean(heading[2]),
          questionParts: [],
          options: [],
          answerLetter: null,
          explanationParts: [],
        };
        continue;
      }
      if (/^\*\*Q\d+(?:[–-]\d+)?(?:\.|:)/i.test(line)) {
        flush();
        continue;
      }
      if (!current || !line || line === "---" || /^\[Correcting Q\d+\]$/i.test(line)) continue;
      const answer = line.match(/^\*\*Answer:\s*([A-E])\b/i);
      if (answer) {
        current.answerLetter = answer[1].toUpperCase();
        continue;
      }
      const inlineOptions = [...line.matchAll(/(?:^|\s)([A-E])\.\s*(.*?)(?=(?:\s+[A-E]\.|$))/g)];
      if (inlineOptions.length >= 4 && current.options.length === 0) {
        current.options.push(...inlineOptions.map((match) => clean(match[2])));
        continue;
      }
      if (current.answerLetter) {
        current.explanationParts.push(clean(rawLine));
      } else {
        current.questionParts.push(clean(rawLine));
      }
    }
    flush();

    const accepted: ParsedRecord[] = [];
    const held: Array<{ number: number; reason: string; topicRaw: string }> = [];
    for (const draft of [...drafts.values()].sort((left, right) => left.number - right.number)) {
      const question = clean(draft.questionParts.join(" "));
      const answerIndex = draft.answerLetter ? draft.answerLetter.charCodeAt(0) - 65 : -1;
      const mappedTopic = mapTopic(config.subject, draft.topicRaw, question);
      if (!question) {
        held.push({ number: draft.number, reason: "missing question text", topicRaw: draft.topicRaw });
        continue;
      }
      if (draft.options.length < 4 || draft.options.length > 5) {
        held.push({ number: draft.number, reason: `expected four or five options, found ${draft.options.length}`, topicRaw: draft.topicRaw });
        continue;
      }
      if (answerIndex < 0 || answerIndex >= draft.options.length) {
        held.push({ number: draft.number, reason: "missing or out-of-range supplied answer letter", topicRaw: draft.topicRaw });
        continue;
      }
      if (!mappedTopic) {
        held.push({ number: draft.number, reason: "no official syllabus mapping", topicRaw: draft.topicRaw });
        continue;
      }
      accepted.push({
        externalId: `${basename(config.path).replace(/[^a-z0-9]+/gi, "-").replace(/-+$/, "").toLowerCase()}-${String(draft.number).padStart(3, "0")}`,
        subject: config.subject,
        topic: mappedTopic,
        difficulty: "medium",
        question,
        options: draft.options,
        answerIndex,
        explanation: clean(draft.explanationParts.join(" ")) || undefined,
        sourceLabel: config.label,
        permissionNote,
      });
    }
    return { config, accepted, held, discoveredQuestionNumbers: drafts.size };
  });
}

const parsed = await Promise.all(sourceConfigs.map(parseFile));
const records = parsed.flatMap((result) => result.accepted);
const report = {
  generatedAt: new Date().toISOString(),
  records,
  sources: parsed.map((result) => ({
    file: basename(result.config.path),
    subject: result.config.subject,
    discoveredQuestionNumbers: result.discoveredQuestionNumbers,
    accepted: result.accepted.length,
    held: result.held,
  })),
};

await writeFile("/home/ubuntu/jamb-import-staging/trusted_physics_english_aug16.staged.json", JSON.stringify(records, null, 2) + "\n");
await writeFile("reports/trusted_physics_english_aug16_parse_report.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({
  totalAccepted: records.length,
  sources: report.sources.map(({ file, subject, discoveredQuestionNumbers, accepted, held }) => ({ file, subject, discoveredQuestionNumbers, accepted, held: held.length })),
}, null, 2));
