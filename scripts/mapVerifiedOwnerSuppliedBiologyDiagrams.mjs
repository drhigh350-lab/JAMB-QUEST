import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const receiptPath = path.join(projectRoot, "reports", "verified_owner_supplied_biology_diagram_mapping_20260826.json");
const NOT_KAIRO = /kairo/i;
const NOT_LEKKI = /lekki headmaster/i;
const targets = [
  {
    id: 1020027,
    externalId: "supplied-keyed-2004-biology-003",
    sourceId: 11580001,
    questionText: "Yam is used in this set-up because it",
    optionsJson: "[\"acts as a semi-permeable membrane\",\"acts as a storage organ\",\"is permeable to the salt solution\",\"is a plant material\"]",
    answerIndex: 0,
    explanationStatus: "approved",
    oldDiagramUrl: "/manus-storage/biology-yam-osmosis-neutral_d9275965.png",
    newDiagramUrl: "/manus-storage/owner-yam-osmosis-20260826_8e443547.png",
    ownerImage: { filename: "ChatGPTImageAug26,2026,12_37_43PM.png", sha256: "91b2d4f8212c7caf9e530dbb9fb0e6dd94ed3d463e8e1522429c1fa4f8fd39a3", evidence: "The image shows the same hollowed yam/potato set-up: salt solution inside and water outside." },
  },
  {
    id: 1020028,
    externalId: "supplied-keyed-2004-biology-004",
    sourceId: 11580001,
    questionText: "[Refers to the osmosis set-up diagram in Q3]\nWhich of the following results is to be expected if the set-up is left for several hours?",
    optionsJson: "[\"Movement of water from the salt solution\",\"Decrease in the size of the yam\",\"Movement of the salt solution into the water\",\"Decrease in the volume of water inside the yam.\"]",
    answerIndex: 1,
    explanationStatus: "approved",
    oldDiagramUrl: "/manus-storage/biology-yam-osmosis-neutral_d9275965.png",
    newDiagramUrl: "/manus-storage/owner-yam-osmosis-20260826_8e443547.png",
    ownerImage: { filename: "ChatGPTImageAug26,2026,12_37_43PM.png", sha256: "91b2d4f8212c7caf9e530dbb9fb0e6dd94ed3d463e8e1522429c1fa4f8fd39a3", evidence: "This paired question explicitly refers to the same Q3 osmosis set-up." },
  },
  {
    id: 1020033,
    externalId: "supplied-keyed-2004-biology-009",
    sourceId: 11580001,
    questionText: "[Refers to the vertebral column diagram in Q8]\nThe bones labelled II are called",
    optionsJson: "[\"thoracic vertebrae\",\"lumbar vertebrae\",\"cervical vertebrae\",\"sacral vertebrae.\"]",
    answerIndex: 2,
    explanationStatus: "approved",
    oldDiagramUrl: "/manus-storage/biology-vertebral-column-regions-neutral_ac5b995e.png",
    newDiagramUrl: "/manus-storage/owner-vertebral-cervical-label-20260826_e9eea2e9.png",
    ownerImage: { filename: "ChatGPTImageAug26,2026,12_36_24PM.png", sha256: "9b9569b7ec00ee39ca00bb2da829de03673ec01704acb8284c5a19afb3bf3048", evidence: "Its II bracket is the cervical region, matching the stored answer index C/cervical vertebrae." },
  },
  {
    id: 1020036,
    externalId: "supplied-keyed-2004-biology-012",
    sourceId: 11580001,
    questionText: "The part labelled II is the",
    optionsJson: "[\"anther\",\"style\",\"filament\",\"stigma\"]",
    answerIndex: 0,
    explanationStatus: "approved",
    oldDiagramUrl: "/manus-storage/biology-flower-cross-section-corrected-neutral_ab5923de.png",
    newDiagramUrl: "/manus-storage/owner-flower-labels-20260826_7a6f60aa.png",
    ownerImage: { filename: "ChatGPTImageAug26,2026,12_29_32PM.png", sha256: "8f465b33f9630a56266fe1618a71a64e4db7b3895ff73d5b28d01e3693de54d6", evidence: "Its II leader points to an anther, matching the stored answer index A/anther." },
  },
  {
    id: 1020039,
    externalId: "supplied-keyed-2004-biology-015",
    sourceId: 11580001,
    questionText: "The function of the part labelled III is to",
    optionsJson: "[\"produce oil for the skin\",\"carry blood and nitrogenous waste\",\"contract to pull the hair erect\",\"conduct nervous impulses\"]",
    answerIndex: 2,
    explanationStatus: "approved",
    oldDiagramUrl: "/manus-storage/biology-skin-cross-section-neutral_c2f97b70.png",
    newDiagramUrl: "/manus-storage/owner-skin-arrector-pili-20260826_c158c886.png",
    ownerImage: { filename: "ChatGPTImageAug26,2026,12_38_46PM.png", sha256: "5a00143f893a8f6292114f806c9d927e205648dd8c1156eeaa07d5d55fc319d1", evidence: "Its III leader points to the arrector pili muscle, matching the stored answer index C/contract to pull the hair erect." },
  },
];

function protectedSnapshot(row) {
  return {
    id: row.id, externalId: row.externalId, subject: row.subject, topic: row.topic, difficulty: row.difficulty,
    questionText: row.questionText, optionsJson: row.optionsJson, answerIndex: row.answerIndex,
    explanation: row.explanation, explanationStatus: row.explanationStatus, sourceId: row.sourceId,
  };
}

const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.beginTransaction();
  const records = [];
  for (const target of targets) {
    const [beforeRows] = await connection.execute(`
      SELECT qi.id, qi.externalId, qi.subject, qi.topic, qi.difficulty, qi.questionText, qi.optionsJson,
        qi.answerIndex, qi.explanation, qi.explanationStatus, qi.diagramUrl, qi.sourceId, qs.label AS sourceLabel
      FROM questionItems qi INNER JOIN questionSources qs ON qs.id = qi.sourceId WHERE qi.id = ?
    `, [target.id]);
    assert.equal(beforeRows.length, 1, `Missing record ${target.id}.`);
    const before = beforeRows[0];
    assert.equal(before.externalId, target.externalId, `External ID changed for ${target.id}.`);
    assert.equal(before.sourceId, target.sourceId, `Source changed for ${target.id}.`);
    assert.equal(before.questionText, target.questionText, `Stem changed for ${target.id}.`);
    assert.equal(before.optionsJson, target.optionsJson, `Options changed for ${target.id}.`);
    assert.equal(before.answerIndex, target.answerIndex, `Answer changed for ${target.id}.`);
    assert.equal(before.explanationStatus, target.explanationStatus, `Status changed for ${target.id}.`);
    assert.ok(!NOT_KAIRO.test(before.sourceLabel), `Kairo record ${target.id} is excluded.`);
    assert.ok(!NOT_LEKKI.test(before.sourceLabel) && !NOT_LEKKI.test(before.questionText), `Lekki record ${target.id} is excluded.`);
    assert.ok([target.oldDiagramUrl, target.newDiagramUrl].includes(before.diagramUrl), `Unexpected old diagram link for ${target.id}.`);
    const beforeProtected = protectedSnapshot(before);
    let affectedRows = 0;
    if (before.diagramUrl !== target.newDiagramUrl) {
      const [result] = await connection.execute(`
        UPDATE questionItems SET diagramUrl = ?
        WHERE id = ? AND externalId = ? AND sourceId = ? AND questionText = ? AND optionsJson = ?
          AND answerIndex = ? AND explanationStatus = ? AND diagramUrl = ?
      `, [target.newDiagramUrl, target.id, target.externalId, target.sourceId, target.questionText, target.optionsJson, target.answerIndex, target.explanationStatus, target.oldDiagramUrl]);
      affectedRows = result.affectedRows;
      assert.equal(affectedRows, 1, `Mapping did not change exactly one record for ${target.id}.`);
    }
    const [afterRows] = await connection.execute(`
      SELECT id, externalId, subject, topic, difficulty, questionText, optionsJson, answerIndex,
        explanation, explanationStatus, diagramUrl, sourceId FROM questionItems WHERE id = ?
    `, [target.id]);
    const after = afterRows[0];
    assert.equal(after.diagramUrl, target.newDiagramUrl, `Owner image did not save for ${target.id}.`);
    assert.equal(digest(protectedSnapshot(after)), digest(beforeProtected), `Protected content changed for ${target.id}.`);
    records.push({ id: target.id, externalId: target.externalId, ownerImage: target.ownerImage, diagramUrl: { before: before.diagramUrl, after: after.diagramUrl }, protectedFieldsSha256: digest(beforeProtected), affectedRows });
  }
  await connection.commit();
  const receipt = {
    generatedAt: new Date().toISOString(),
    action: "Guarded mapping-only update using only exact owner-supplied non-Kairo images.",
    mappedRecordCount: records.length,
    changedCount: records.filter((record) => record.affectedRows === 1).length,
    unchangedOnRepeatCount: records.filter((record) => record.affectedRows === 0).length,
    excludedOwnerImage: {
      filename: "ChatGPTImageAug26,2026,12_40_22PM.png",
      reason: "Its II label is sacral/coccygeal, which conflicts with the stored II/cervical key in the only candidate pair."
    },
    learnerEligibilityChanged: false,
    questionTextChanged: false,
    lekkiHeadmasterChanged: false,
    kairoChanged: false,
    records,
  };
  await fs.writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(JSON.stringify({ receiptPath, receipt }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
