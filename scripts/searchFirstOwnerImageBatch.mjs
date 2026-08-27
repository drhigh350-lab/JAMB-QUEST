import mysql from "mysql2/promise";

const searches = [
  ["362365 hierarchy", ["cell", "tissue", "organ", "system"]],
  ["362361 sickle genetics", ["sickle", "haemoglobin", "genotype", "AA", "AS", "SS"]],
  ["362358 heating apparatus", ["beaker", "heat", "solid", "thermal", "conduction", "stir"]],
  ["362357 resultant force", ["resultant", "force", "4N", "8N", "12N"]],
  ["362356 electron shells", ["electron", "shell", "orbit", "atom", "Bohr"]],
  ["362355 moments beam", ["moment", "beam", "rod", "equilibrium", "50cm", "90cm"]],
  ["362351 albinism cross", ["albin", "carrier", "Aa", "aa", "offspring"]],
  ["362350 plant form", ["plant", "leaf", "stem", "root", "adaptation", "modification"]],
  ["362349 AC circuit", ["inductor", "resistor", "alternating", "220V", "reactance", "impedance"]],
  ["362348 pendulum", ["pendulum", "extreme", "control point", "oscillation", "simple harmonic"]],
];
const c = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const out = [];
  for (const [label, terms] of searches) {
    const clauses = terms.map(() => `(LOWER(questionText) LIKE ? OR LOWER(optionsJson) LIKE ? OR LOWER(explanation) LIKE ? OR LOWER(topic) LIKE ?)` ).join(" OR ");
    const params = terms.flatMap(term => { const p = `%${term.toLowerCase()}%`; return [p,p,p,p]; });
    const [rows] = await c.execute(`SELECT id, externalId, subject, questionText, optionsJson, answerIndex, topic, explanationStatus, diagramUrl FROM questionItems WHERE ${clauses} ORDER BY id LIMIT 80`, params);
    out.push({ label, terms, matches: rows });
  }
  console.log(JSON.stringify(out, null, 2));
} finally { await c.end(); }
