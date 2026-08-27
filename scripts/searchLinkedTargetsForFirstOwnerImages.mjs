import mysql from "mysql2/promise";
const groups={
  "362365":["cell","tissue","organ","system","organization"],
  "362361":["sickle","haemoglobin","hemoglobin","genotype","albinism"],
  "362358":["heat","heating","conduction","convection","beaker","solid"],
  "362357":["resultant","force","vector","equilibrium"],
  "362356":["electron","shell","orbit","atom","configuration"],
  "362355":["moment","beam","rod","equilibrium","weight"],
  "362351":["albinism","carrier","Aa","aa","offspring","cross"],
  "362350":["xerophyte","hydrophyte","plant","stem","leaf","root","adaptation"],
  "362349":["inductor","resistor","alternating","reactance","impedance","220V"],
  "362348":["pendulum","extreme","control","oscillation","simple harmonic"]
};
const c=await mysql.createConnection(process.env.DATABASE_URL);
try{const [rows]=await c.execute(`SELECT id,externalId,subject,questionText,optionsJson,answerIndex,topic,diagramUrl,explanationStatus FROM questionItems WHERE diagramUrl IS NOT NULL`);for(const [label,terms] of Object.entries(groups)){const out=rows.map(r=>{const text=[r.questionText,r.optionsJson,r.topic,r.explanation].filter(Boolean).join(' ').toLowerCase();const hits=terms.filter(t=>text.includes(t.toLowerCase()));return {...r,score:hits.length,hits};}).filter(r=>r.score>=1).sort((a,b)=>b.score-a.score||a.id-b.id);console.log(`\n### ${label} (${out.length})`);for(const r of out.slice(0,30))console.log(JSON.stringify({score:r.score,hits:r.hits,id:r.id,externalId:r.externalId,subject:r.subject,questionText:r.questionText,optionsJson:r.optionsJson,answerIndex:r.answerIndex,topic:r.topic,diagramUrl:r.diagramUrl,explanationStatus:r.explanationStatus}));}}finally{await c.end();}
