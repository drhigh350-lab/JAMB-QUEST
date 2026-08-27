import mysql from "mysql2/promise";
const c=await mysql.createConnection(process.env.DATABASE_URL);
try{
  const searches=[
    ["362365 hierarchy", "SELECT id,externalId,questionText,optionsJson FROM questionItems WHERE questionText LIKE '%level%organisation%' OR questionText LIKE '%hierarchy%biological%'"],
    ["362361 sickle", "SELECT id,externalId,questionText,optionsJson FROM questionItems WHERE questionText LIKE '%sickle%' AND optionsJson LIKE '%AA%'"],
    ["362358 heating", "SELECT id,externalId,questionText,optionsJson FROM questionItems WHERE questionText LIKE '%heat%' AND optionsJson LIKE '%I%' AND optionsJson LIKE '%IV%'"],
    ["362357 force", "SELECT id,externalId,questionText,optionsJson FROM questionItems WHERE questionText LIKE '%resultant%' AND (questionText LIKE '%4N%' OR questionText LIKE '%8N%' OR questionText LIKE '%12N%')"],
    ["362356 electron", "SELECT id,externalId,questionText,optionsJson FROM questionItems WHERE questionText LIKE '%electron%' AND questionText LIKE '%sub-level%'"],
    ["362355 moments", "SELECT id,externalId,questionText,optionsJson FROM questionItems WHERE (questionText LIKE '%moment%' OR questionText LIKE '%beam%') AND (questionText LIKE '%50cm%' OR questionText LIKE '%90cm%' OR questionText LIKE '%15A%')"],
    ["362351 albinism", "SELECT id,externalId,questionText,optionsJson FROM questionItems WHERE questionText LIKE '%albin%' AND optionsJson LIKE '%Aa%'"],
    ["362350 plant", "SELECT id,externalId,questionText,optionsJson FROM questionItems WHERE questionText LIKE '%plant%' AND questionText LIKE '%labelled%' AND (questionText LIKE '%I%' OR questionText LIKE '%II%') AND topic='Adaptations of organisms'"],
    ["362349 AC", "SELECT id,externalId,questionText,optionsJson FROM questionItems WHERE (questionText LIKE '%AC%' OR questionText LIKE '%alternating%') AND (questionText LIKE '%220V%' OR questionText LIKE '%45%' OR questionText LIKE '%0.5H%')"],
    ["362348 pendulum", "SELECT id,externalId,questionText,optionsJson FROM questionItems WHERE questionText LIKE '%pendulum%' AND (questionText LIKE '%extreme%' OR questionText LIKE '%control point%')"]
  ];
  for(const [label,sql] of searches){
    const [rows]=await c.execute(sql);
    console.log(`\n### ${label} (${rows.length})`);
    for(const r of rows) console.log(JSON.stringify(r));
  }
}finally{await c.end();}
