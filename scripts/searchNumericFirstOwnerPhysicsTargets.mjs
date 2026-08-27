import mysql from "mysql2/promise";
const groups={
  "362357": ["4N","8N","12N"],
  "362355": ["50cm","20cm","90cm","15A"],
  "362349": ["0.5H","45Ω","220V","inductive reactance"],
  "362348": ["P","Q","R","S","control point","extreme"]
};
const c=await mysql.createConnection(process.env.DATABASE_URL);
try{const [rows]=await c.execute(`SELECT id,externalId,subject,questionText,optionsJson,answerIndex,topic,explanation,diagramUrl,explanationStatus FROM questionItems`);for(const [label,terms] of Object.entries(groups)){const out=rows.map(r=>{const text=[r.questionText,r.optionsJson,r.topic,r.explanation].filter(Boolean).join(' ').toLowerCase();const hits=terms.filter(t=>text.includes(t.toLowerCase()));return {...r,score:hits.length,hits};}).filter(r=>r.score>=2).sort((a,b)=>b.score-a.score||a.id-b.id);console.log(`\n### ${label} (${out.length})`);for(const r of out.slice(0,50))console.log(JSON.stringify({score:r.score,hits:r.hits,id:r.id,externalId:r.externalId,subject:r.subject,questionText:r.questionText,optionsJson:r.optionsJson,answerIndex:r.answerIndex,topic:r.topic,diagramUrl:r.diagramUrl,explanationStatus:r.explanationStatus}));}}finally{await c.end();}
