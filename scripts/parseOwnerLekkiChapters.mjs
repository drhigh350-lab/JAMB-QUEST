import { mkdir, readFile, writeFile } from "node:fs/promises";

const sourceDirectory = "/home/ubuntu/upload";
const outputDirectory = "/home/ubuntu/jamb-import-staging/lekki_owner_chapters_aug15";
const sourceFiles = [
  "pasted_content.txt",
  ...Array.from({ length: 12 }, (_, index) => `pasted_content_${index + 2}.txt`),
];
const chapterNames = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen"];

const normaliseSpaces = (value) => value.replace(/\s+/g, " ").trim();
const parseKeys = (text) => {
  const answerSection = text.split(/\n---\s*\n\s*Answer Key/i)[1] ?? "";
  const keys = new Map();
  for (const line of answerSection.split(/\r?\n/)) {
    const match = line.match(/^\s*(\d+)\.\s*([A-D])(?:\s|\(|$)/i);
    if (match) keys.set(Number(match[1]), match[2].toUpperCase().charCodeAt(0) - 65);
  }
  return keys;
};

const parseChapter = (text, chapterNumber) => {
  const [questionSection] = text.split(/\n---\s*\n\s*Answer Key/i);
  const titleMatch = questionSection.match(/Chapter\s+(?:One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Eleven|Twelve|Thirteen)\s*:\s*(.+)/i);
  const chapterTitle = normaliseSpaces(titleMatch?.[1] ?? `Chapter ${chapterNumber}`);
  const keys = parseKeys(text);
  const lines = questionSection.split(/\r?\n/);
  const candidates = [];
  let current = null;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    const questionMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (questionMatch) {
      if (current) candidates.push(current);
      current = { number: Number(questionMatch[1]), questionParts: [questionMatch[2]], options: [], currentOption: -1 };
      continue;
    }
    if (!current || !line || /^Questions\s*\(/i.test(line)) continue;
    const optionMatch = line.match(/^[·•\-\s]*([A-D])\)\s*(.+)/i);
    if (optionMatch) {
      current.options.push(normaliseSpaces(optionMatch[2]));
      current.currentOption = current.options.length - 1;
    } else if (current.currentOption >= 0) {
      current.options[current.currentOption] = normaliseSpaces(`${current.options[current.currentOption]} ${line}`);
    } else {
      current.questionParts.push(line);
    }
  }
  if (current) candidates.push(current);

  const holds = [];
  const questions = [];
  const externalIds = new Set();
  for (const candidate of candidates) {
    const externalId = `LEKKI-CH${String(chapterNumber).padStart(2, "0")}-${String(candidate.number).padStart(3, "0")}`;
    const question = normaliseSpaces(candidate.questionParts.join(" "));
    const answerIndex = keys.get(candidate.number);
    if (externalIds.has(externalId)) holds.push({ externalId, reason: "duplicate question number" });
    else if (candidate.options.length !== 4) holds.push({ externalId, reason: `expected four options, found ${candidate.options.length}` });
    else if (candidate.options.some((option) => !option)) holds.push({ externalId, reason: "blank option" });
    else if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3) holds.push({ externalId, reason: "missing or invalid answer key" });
    else {
      externalIds.add(externalId);
      questions.push({
        externalId,
        subject: "Use of English",
        topic: `The Lekki Headmaster · Chapter ${chapterNumber}: ${chapterTitle}`,
        difficulty: "medium",
        question,
        options: candidate.options,
        answerIndex,
      });
    }
  }
  return { chapterNumber, chapterName: chapterNames[chapterNumber - 1], chapterTitle, candidates: candidates.length, keyed: keys.size, questions, holds };
};

await mkdir(outputDirectory, { recursive: true });
const parsedChapters = [];
for (const [index, fileName] of sourceFiles.entries()) {
  const text = await readFile(`${sourceDirectory}/${fileName}`, "utf8");
  parsedChapters.push(parseChapter(text, index + 1));
}
const questions = parsedChapters.flatMap((chapter) => chapter.questions);
const holds = parsedChapters.flatMap((chapter) => chapter.holds.map((hold) => ({ chapter: chapter.chapterNumber, ...hold })));
const report = {
  sourceFiles,
  chapters: parsedChapters.map(({ chapterNumber, chapterName, chapterTitle, candidates, keyed, questions: chapterQuestions, holds: chapterHolds }) => ({ chapterNumber, chapterName, chapterTitle, candidates, keyed, accepted: chapterQuestions.length, holds: chapterHolds })),
  accepted: questions.length,
  holds,
};
await writeFile(`${outputDirectory}/lekki_owner_chapter_questions.json`, `${JSON.stringify({ sourceLabel: "The Lekki Headmaster · Owner chapter-by-chapter batch · August 2026", questions }, null, 2)}\n`);
await writeFile(`${outputDirectory}/lekki_owner_chapter_parse_report.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
