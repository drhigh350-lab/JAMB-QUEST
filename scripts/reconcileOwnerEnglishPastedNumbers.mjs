import { readFile } from "node:fs/promises";

const staged = JSON.parse(await readFile("/home/ubuntu/jamb-import-staging/owner_english_pasted_batch_20260822_eligible.json", "utf8"));
const numbers = new Set(staged.map((record) => Number(record.externalId.match(/(\d+)$/)?.[1])));
numbers.add(74); // Audit hold: present in source, deliberately not staged.
const missing = Array.from({ length: 125 }, (_, index) => index + 1).filter((number) => !numbers.has(number));
console.log(JSON.stringify({ staged: staged.length, intentionallyHeld: [74], missing }, null, 2));
