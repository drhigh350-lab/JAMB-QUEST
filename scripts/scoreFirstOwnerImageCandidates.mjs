import mysql from "mysql2/promise";
const groups = {
  "362365": ["cell", "tissue", "organ", "system", "level", "sequence", "organization"],
  "362361": ["sickle", "cell", "haemoglobin", "hemoglobin", "genotype", "AA", "AS", "SS", "offspring"],
  "362358": ["beaker", "heat", "heating", "conduction", "convection", "thermal", "solid", "stirring", "rod"],
  "362357": ["resultant", "force", "vector", "4N", "8N", "12N", "equilibrium"],
  "362356": ["electron", "shell", "orbit", "atom", "configuration", "energy level"],
  "362355": ["moment", "beam", "rod", "equilibrium", "weight", "50cm", "90cm", "15A", "turning"],
  "362351": ["albinism", "albino", "carrier", "Aa", "aa", "offspring", "cross"],
  "362350": ["xerophyte", "hydrophyte", "plant", "stem", "leaf", "root", "adaptation", "modification", "terrestrial"],
  "362349": ["inductor", "resistor", "alternating", "AC", "reactance", "impedance", "220V", "45Ω", "0.5H"],
  "362348": ["pendulum", "extreme", "control", "point", "oscillation", "position", "simple harmonic", "P", "Q", "R", "S"],
};
const c=await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows]=await c.execute(`SELECT id,externalId,subject,questionText,optionsJson,answerIndex,topic,diagramUrl,explanationStatus FROM questionItems`);
  for (const [image, terms] of Object.entries(groups)) {
    const scored=rows.map(r=>{const text=[r.questionText,r.optionsJson,r.topic,r.explanation].filter(Boolean).join(" ").toLowerCase();const hits=terms.filter(t=>text.includes(t.toLowerCase()));return {...r,score:hits.length,hits};}).filter(r=>r.score>=2).sort((a,b)=>b.score-a.score||a.id-b.id).slice(0,20);
    console.log(`\n### ${image}`);
    for(const r of scored) console.log(JSON.stringify({score:r.score,hits:r.hits,id:r.id,externalId:r.externalId,subject:r.subject,questionText:r.questionText,optionsJson:r.optionsJson,answerIndex:r.answerIndex,topic:r.topic,diagramUrl:r.diagramUrl,explanationStatus:r.explanationStatus}));
  }
} finally {await c.end();}
