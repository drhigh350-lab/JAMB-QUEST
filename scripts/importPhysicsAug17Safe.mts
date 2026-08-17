import { readFileSync } from "node:fs";
import { getUserByOpenId, importAuthorisedQuestionSet } from "../server/db";
import { ENV } from "../server/_core/env";

type StagedQuestion = { externalId: string; subject: "Physics"; topic: string; difficulty: "medium"; question: string; options: string[]; answerIndex: number; explanation: string };
const staged = JSON.parse(readFileSync("reports/physics_aug17_safe_stage.json", "utf8")) as { questions: StagedQuestion[] };
const owner = await getUserByOpenId(ENV.ownerOpenId);
if (!owner) throw new Error("Owner account was not found for controlled Physics import");

const result = await importAuthorisedQuestionSet(owner.id, {
  sourceLabel: "Owner-supplied Physics 2020–2023 · audited safe subset",
  permissionNote: "Owner supplied these Physics records and authorised their use in JAMB Quest. Incomplete, duplicate, figure-dependent, and self-contradictory records remain held.",
  fileName: "physics-2020-2023-audited-safe-subset.json",
  storageKey: "owner-supplied/physics-2020-2023-audited-safe-subset.json",
  questions: staged.questions,
});

console.log(JSON.stringify(result, null, 2));
