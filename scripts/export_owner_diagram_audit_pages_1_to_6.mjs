import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { getOwnerDiagramAuditPage } from "../server/db.ts";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const reportsDir = resolve(projectRoot, "reports");
const outputPath = resolve(reportsDir, "owner_diagram_audit_pages_1_to_6_live_snapshot.json");
const csvOutputPath = resolve(reportsDir, "owner_profile_diagram_questions_pages_3_to_6.csv");
const pageSize = 20;
const pages = [];

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function optionsText(options) {
  return options.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join(" | ");
}

for (let zeroBasedPage = 0; zeroBasedPage < 6; zeroBasedPage += 1) {
  const result = await getOwnerDiagramAuditPage({
    subject: "all",
    state: "all",
    search: "",
    page: zeroBasedPage,
    pageSize,
  });
  pages.push({ auditPage: zeroBasedPage + 1, ...result });
}

await mkdir(reportsDir, { recursive: true });
await writeFile(outputPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  query: { subject: "all", state: "all", search: "", pageSize },
  pages,
}, null, 2) + "\n", "utf8");

const csvHeader = [
  "owner_profile_page",
  "position_on_page",
  "database_id",
  "question_id",
  "subject",
  "topic",
  "question",
  "options",
  "saved_answer",
  "picture_status",
  "student_status",
  "picture_link_in_website",
  "source",
  "what_to_send_back",
];
const csvRows = pages
  .filter((page) => page.auditPage >= 3 && page.auditPage <= 6)
  .flatMap((page) => page.records.map((record, index) => [
    page.auditPage,
    index + 1,
    record.id,
    record.externalId,
    record.subject,
    record.topic,
    record.question,
    optionsText(record.options),
    `${String.fromCharCode(65 + record.answerIndex)}. ${record.options[record.answerIndex]}`,
    record.diagramUrl ? "Has picture" : "Needs picture",
    record.learnerVisible ? "Students can see" : "Held from students",
    record.diagramUrl ?? "",
    record.sourceLabel,
    "Tell me: keep, replace, or remove. If replacing, send the picture and this Question ID.",
  ]));
await writeFile(csvOutputPath, [csvHeader, ...csvRows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n", "utf8");

const counts = pages.map((page) => `page${page.auditPage}=${page.records.length}`).join(" ");
console.log(`snapshot=${outputPath}`);
console.log(`csv=${csvOutputPath} rows=${csvRows.length}`);
console.log(counts);
process.exit(0);
