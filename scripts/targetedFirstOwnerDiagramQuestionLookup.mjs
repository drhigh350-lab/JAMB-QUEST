import mysql from "mysql2/promise";
const c=await mysql.createConnection(process.env.DATABASE_URL);
try{
 const queries=[
  ["biology organisation diagram", `SELECT id,externalId,questionText,optionsJson,answerIndex,topic,diagramUrl FROM questionItems WHERE subject='Biology' AND (topic LIKE '%organization%' OR topic LIKE '%organisation%') AND (questionText LIKE '%diagram%' OR questionText LIKE '%sequence%' OR questionText LIKE '%hierarchy%' OR questionText LIKE '%arrange%')`],
  ["biology genetics diagram", `SELECT id,externalId,questionText,optionsJson,answerIndex,topic,diagramUrl FROM questionItems WHERE subject='Biology' AND (topic LIKE '%genetic%' OR topic LIKE '%heredity%') AND (questionText LIKE '%diagram%' OR questionText LIKE '%cross%' OR questionText LIKE '%offspring%' OR questionText LIKE '%inherit%')`],
  ["biology plant diagram", `SELECT id,externalId,questionText,optionsJson,answerIndex,topic,diagramUrl FROM questionItems WHERE subject='Biology' AND (topic LIKE '%plant%' OR topic LIKE '%adapt%') AND (questionText LIKE '%diagram%' OR questionText LIKE '%labelled%' OR questionText LIKE '%structure%')`],
  ["physics mechanics diagram", `SELECT id,externalId,questionText,optionsJson,answerIndex,topic,diagramUrl FROM questionItems WHERE subject='Physics' AND (topic LIKE '%Motion%' OR topic LIKE '%Equilibrium%' OR topic LIKE '%Mechanics%') AND (questionText LIKE '%diagram%' OR questionText LIKE '%shown%' OR questionText LIKE '%figure%')`],
  ["physics electricity diagram", `SELECT id,externalId,questionText,optionsJson,answerIndex,topic,diagramUrl FROM questionItems WHERE subject='Physics' AND (topic LIKE '%electric%' OR topic LIKE '%current%' OR topic LIKE '%induction%') AND (questionText LIKE '%diagram%' OR questionText LIKE '%shown%' OR questionText LIKE '%figure%')`]
 ];
 for(const [label,sql] of queries){const [rows]=await c.execute(sql);console.log(`\n### ${label} (${rows.length})`);for(const r of rows)console.log(JSON.stringify(r));}
}finally{await c.end();}
