import { readFileSync, writeFileSync } from "node:fs";

const compendium = JSON.parse(readFileSync("/home/ubuntu/jamb-import-staging/lekki-headmaster-101-compendium-staging.json", "utf8")).questions;
const keyed = JSON.parse(readFileSync("/home/ubuntu/jamb-import-staging/lekki-headmaster-120-keyed-staging.json", "utf8")).questions;
const outputFile = "/home/ubuntu/jamb-import-staging/lekki-cross-source-validation.json";
const stopWords = new Set(["the", "a", "an", "of", "to", "in", "and", "was", "were", "is", "did", "what", "who", "why", "how", "when", "which", "at", "for", "on", "with", "from", "that", "this", "as", "about", "after", "before", "be", "had", "has"]);
const tokens = (value) => new Set(value.toLowerCase().match(/[a-z]{3,}/g)?.filter((word) => !stopWords.has(word)) ?? []);
const score = (left, right) => {
  const a = tokens(left);
  const b = tokens(right);
  const intersection = [...a].filter((word) => b.has(word)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
};
const matches = compendium.map((question) => {
  const best = keyed.map((candidate) => ({ candidate, similarity: score(question.question, candidate.question) })).sort((left, right) => right.similarity - left.similarity)[0];
  if (!best || best.similarity < 0.44) return null;
  const answerMatch = question.answerIndex === best.candidate.answerIndex;
  return { compendiumId: question.externalId, keyedId: best.candidate.externalId, similarity: Number(best.similarity.toFixed(3)), answerMatch, compendiumAnswer: question.options[question.answerIndex], keyedAnswer: best.candidate.options[best.candidate.answerIndex] };
}).filter(Boolean);
const report = { compendiumAccepted: compendium.length, keyedAccepted: keyed.length, highOverlapPairs: matches.length, answerAgreements: matches.filter((match) => match.answerMatch).length, answerDisagreements: matches.filter((match) => !match.answerMatch).length, matches, status: "verification-pending" };
writeFileSync(outputFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, matches: undefined, outputFile }, null, 2));
