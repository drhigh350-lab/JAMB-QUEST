import { readFile, writeFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { questionSources } from "../drizzle/schema";
import { ENV } from "../server/_core/env";
import { getDb, getUserByOpenId, importAuthorisedQuestionSet, upsertUser } from "../server/db";
import { authorisedImportSchema } from "../server/questionImport";

const importDirectory = "/home/ubuntu/jamb-drive-extract/import-payloads";
const manifest = JSON.parse(await readFile(`${importDirectory}/manifest.json`, "utf8")) as Array<{ payloadFile: string; driveFileId: string }>;

if (!ENV.ownerOpenId) throw new Error("Owner account configuration is unavailable.");
await upsertUser({ openId: ENV.ownerOpenId, name: ENV.ownerName ?? "JAMB Quest owner", role: "admin" });
const owner = await getUserByOpenId(ENV.ownerOpenId);
if (!owner) throw new Error("Owner account could not be resolved for the authorised import.");
const db = await getDb();
if (!db) throw new Error("Database is unavailable.");

const receipt = [] as Array<{ driveFileId: string; status: "imported" | "skipped"; questionCount: number; sourceLabel: string }>;
for (const entry of manifest) {
  const raw = JSON.parse(await readFile(`${importDirectory}/${entry.payloadFile}`, "utf8"));
  const payload = authorisedImportSchema.parse(raw);
  const [existing] = await db.select({ id: questionSources.id }).from(questionSources).where(eq(questionSources.label, payload.sourceLabel)).limit(1);
  if (existing) {
    receipt.push({ driveFileId: entry.driveFileId, status: "skipped", questionCount: payload.questions.length, sourceLabel: payload.sourceLabel });
    continue;
  }
  const imported = await importAuthorisedQuestionSet(owner.id, payload);
  receipt.push({ driveFileId: entry.driveFileId, status: "imported", questionCount: imported.questionCount, sourceLabel: imported.sourceLabel });
}

await writeFile("/home/ubuntu/jamb-drive-extract/drive_import_receipt.json", `${JSON.stringify(receipt, null, 2)}\n`);
