import mysql from "mysql2/promise";
const groups = {
  hierarchy: ["levels of organization", "level of organization", "cellular organization", "cell tissue organ system", "cell to tissue", "organization of life"],
  sickle: ["sickle cell", "genotype", "haemoglobin", "hemoglobin", "AA", "AS", "SS"],
  heating: ["thermal conductivity", "heat transfer", "conduction", "convection", "heating", "solid particles", "beaker"],
  force: ["resultant force", "resultant", "vector", "forces acting", "equilibrium of forces"],
  electron: ["electronic configuration", "electron shell", "shell", "orbit", "atomic structure"],
  moments: ["principle of moments", "moment of a force", "uniform beam", "beam", "rod is in equilibrium", "turning effect"],
  albinism: ["albinism", "albino", "carrier", "inheritance", "genetic cross"],
  plant: ["xerophyte", "hydrophyte", "plant modification", "modified stem", "modified leaf", "adaptation of plant", "terrestrial plant"],
  ac: ["inductive reactance", "impedance", "AC circuit", "alternating current", "inductor", "resistor", "reactance"],
  pendulum: ["simple pendulum", "control point", "extreme position", "pendulum bob", "oscillation", "simple harmonic motion"],
};
const c = await mysql.createConnection(process.env.DATABASE_URL);
try {
  for (const [label, terms] of Object.entries(groups)) {
    const clauses = terms.map(() => `(LOWER(questionText) LIKE ? OR LOWER(optionsJson) LIKE ? OR LOWER(topic) LIKE ? OR LOWER(explanation) LIKE ?)` ).join(" OR ");
    const params = terms.flatMap(term => { const p = `%${term.toLowerCase()}%`; return [p,p,p,p]; });
    const [rows] = await c.execute(`SELECT id,externalId,subject,questionText,optionsJson,answerIndex,topic,diagramUrl,explanationStatus FROM questionItems WHERE ${clauses} ORDER BY id`, params);
    console.log(`\n### ${label} (${rows.length})`);
    for (const r of rows) console.log(JSON.stringify(r));
  }
} finally { await c.end(); }
