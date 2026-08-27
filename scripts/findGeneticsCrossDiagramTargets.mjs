import mysql from "mysql2/promise";
const c=await mysql.createConnection(process.env.DATABASE_URL);
try{
 const [rows]=await c.execute(`SELECT id,externalId,subject,questionText,optionsJson,answerIndex,topic,diagramUrl,explanationStatus FROM questionItems WHERE subject='Biology' AND (optionsJson LIKE '%AA%' OR optionsJson LIKE '%Aa%') AND (optionsJson LIKE '%AS%' OR optionsJson LIKE '%aa%' OR optionsJson LIKE '%SS%') ORDER BY id`);
 for(const r of rows) console.log(JSON.stringify(r));
}finally{await c.end();}
