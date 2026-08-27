import mysql from "mysql2/promise";
const c=await mysql.createConnection(process.env.DATABASE_URL);
try{
 const queries=[
  ["sickle-options", `SELECT id,externalId,subject,questionText,optionsJson,answerIndex,topic,diagramUrl FROM questionItems WHERE optionsJson LIKE '%AA%' AND optionsJson LIKE '%AS%' AND optionsJson LIKE '%SS%'`],
  ["albinism-options", `SELECT id,externalId,subject,questionText,optionsJson,answerIndex,topic,diagramUrl FROM questionItems WHERE (questionText LIKE '%albin%' OR optionsJson LIKE '%albin%') OR (optionsJson LIKE '%Aa%' AND optionsJson LIKE '%aa%')`],
  ["plant-label-options", `SELECT id,externalId,subject,questionText,optionsJson,answerIndex,topic,diagramUrl FROM questionItems WHERE subject='Biology' AND (questionText LIKE '%labelled%' OR questionText LIKE '%labelled%') AND (optionsJson LIKE '%I%' AND optionsJson LIKE '%II%')`],
  ["electron-shell", `SELECT id,externalId,subject,questionText,optionsJson,answerIndex,topic,diagramUrl FROM questionItems WHERE (questionText LIKE '%shell%' OR questionText LIKE '%orbit%' OR questionText LIKE '%electronic configuration%') AND subject IN ('Chemistry','Physics')`],
  ["heating-setup", `SELECT id,externalId,subject,questionText,optionsJson,answerIndex,topic,diagramUrl FROM questionItems WHERE (questionText LIKE '%heat%' OR questionText LIKE '%heated%') AND (optionsJson LIKE '%I%' AND optionsJson LIKE '%II%' AND optionsJson LIKE '%III%')`]
 ];
 for(const [label,sql] of queries){const [rows]=await c.execute(sql);console.log(`\n### ${label} (${rows.length})`);for(const r of rows)console.log(JSON.stringify(r));}
}finally{await c.end();}
