import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile } from "node:fs/promises";

type Subject = "Use of English" | "Biology" | "Chemistry" | "Physics";

type StagedQuestion = {
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

type Hold = {
  subject: Subject;
  questionNumber: number;
  reason: string;
  question: string;
};

const execFileAsync = promisify(execFile);
const PDF_PATH = "/home/ubuntu/upload/jamb_questions_only.pdf";
const STAGED_PATH = "/home/ubuntu/jamb-import-staging/jamb_questions_only_pdf_unkeyed_stage.json";
const REPORT_PATH = "/home/ubuntu/jamb-quiz-game/reports/jamb_questions_only_pdf_stage_audit.json";
const SUBJECTS: Subject[] = ["Use of English", "Biology", "Chemistry", "Physics"];

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function prefix(subject: Subject) {
  return subject === "Use of English" ? "ENG" : subject === "Biology" ? "BIO" : subject === "Chemistry" ? "CHEM" : "PHY";
}

function externalId(subject: Subject, number: number) {
  return `PDF-OWNER-20260822-${prefix(subject)}-${String(number).padStart(3, "0")}`;
}

const { stdout: rawPdfText } = await execFileAsync("pdftotext", ["-layout", PDF_PATH, "-"], { maxBuffer: 16 * 1024 * 1024 });
const stdout = rawPdfText.replace(/\f/g, "\n");
const answerMarkerCount = (stdout.match(/(?:correct answer|^answer\s*:|^answers?$)/gim) ?? []).length;
const sourceSections = SUBJECTS.map((subject, index) => {
  const start = stdout.indexOf(`\n${subject}\n`) >= 0 ? stdout.indexOf(`\n${subject}\n`) + subject.length + 2 : stdout.indexOf(`${subject}\n`) + subject.length + 1;
  const nextSubject = SUBJECTS[index + 1];
  const end = nextSubject ? stdout.indexOf(`\n${nextSubject}\n`, start) : stdout.length;
  if (start < subject.length || end < start) throw new Error(`Could not isolate the ${subject} section in the supplied PDF.`);
  return { subject, text: stdout.slice(start, end) };
});

const staged: StagedQuestion[] = [];
const holds: Hold[] = [];
for (const { subject, text } of sourceSections) {
  const headers = [...text.matchAll(/^(\d+)\.\s+(.+?)\s*$/gm)];
  const seen = new Set<number>();
  for (const [index, header] of headers.entries()) {
    const number = Number(header[1]);
    const category = clean(header[2]);
    const block = text.slice(header.index! + header[0].length, headers[index + 1]?.index ?? text.length);
    const options = [...block.matchAll(/^([A-D])\.\s+(.+?)\s*$/gm)].map((option) => clean(option[2]));
    const firstOption = block.search(/^A\.\s+/m);
    const question = clean(firstOption >= 0 ? block.slice(0, firstOption) : "");
    if (seen.has(number)) {
      holds.push({ subject, questionNumber: number, reason: "Internal source hold: duplicate question number in the PDF section.", question });
      continue;
    }
    seen.add(number);
    if (!question || options.length !== 4 || options.some((option) => !option)) {
      holds.push({ subject, questionNumber: number, reason: "Structural source hold: incomplete visible question text or four-option set in the questions-only PDF.", question });
      continue;
    }
    staged.push({
      externalId: externalId(subject, number),
      sourceSubject: subject,
      sourceQuestionNumber: number,
      sourceCategory: category,
      questionText: question,
      options,
      answerStatus: "awaiting_owner_answer_batch",
      explanationStatus: "awaiting_owner_answer_batch",
      releaseStatus: "staged_not_playable",
      sourceFile: "jamb_questions_only.pdf",
    });
  }
  const found = new Set(staged.filter((record) => record.sourceSubject === subject).map((record) => record.sourceQuestionNumber));
  for (const number of Array.from({ length: 250 }, (_, offset) => offset + 1)) {
    if (!found.has(number) && !holds.some((hold) => hold.subject === subject && hold.questionNumber === number)) {
      holds.push({ subject, questionNumber: number, reason: "Completeness hold: question number was not extracted as a complete four-option source block.", question: "" });
    }
  }
}

const report = {
  sourceFile: "jamb_questions_only.pdf",
  pageCount: 224,
  declaredSubjects: SUBJECTS,
  expectedCount: 1000,
  extractedCompleteCount: staged.length,
  stagedBySubject: Object.fromEntries(SUBJECTS.map((subject) => [subject, staged.filter((record) => record.sourceSubject === subject).length])),
  embeddedPerQuestionAnswerMarkers: answerMarkerCount,
  releasePolicy: "No staged record is playable or importable until a matching owner-supplied answer-and-explanation batch provides a verifiable key. The parser does not infer, generate, or repair answers, explanations, diagrams, context, or official syllabus labels.",
  heldCount: holds.length,
  held: holds,
  stagedPath: STAGED_PATH,
};

await writeFile(STAGED_PATH, `${JSON.stringify(staged, null, 2)}\n`);
await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
