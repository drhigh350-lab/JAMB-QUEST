import { readFileSync } from "node:fs";
import { getUserByOpenId, importAuthorisedQuestionSet } from "../server/db";
import { ENV } from "../server/_core/env";

type StagedQuestion = { externalId: string; subject: "Physics"; topic: string; difficulty: "medium"; question: string; options: string[]; answerIndex: number; explanation: string };
const staged = JSON.parse(readFileSync("reports/physics_2004_2005_safe_stage.json", "utf8")) as { questions: StagedQuestion[] };
const owner = await getUserByOpenId(ENV.ownerOpenId);
if (!owner) throw new Error("Owner account was not found for controlled 2004–2005 Physics import");
console.log(JSON.stringify(await importAuthorisedQuestionSet(owner.id, {
  sourceLabel: "Owner-supplied Physics 2004–2005 Markdown · audited safe subset",
  permissionNote: "Owner supplied these Physics Markdown questions. The only duplicate-option record remains held.",
  fileName: "physics-jamb-2004-2005-audited-safe-subset.md",
  storageKey: "owner-supplied/physics-jamb-2004-2005-audited-safe-subset.md",
  questions: staged.questions,
}), null, 2));
