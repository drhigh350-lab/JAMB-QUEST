import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const sourcePageUrl = "https://www.testdriller.com/past-questions/jamb-objective-biology-2009-13";
const outputPath = "/home/ubuntu/webdev-static-assets/biology-0536-testdriller-original.png";
const receiptPath = path.resolve("reports/extracted_biology_0536_testdriller_original_20260826.json");
const response = await fetch(sourcePageUrl, { headers: { "user-agent": "Mozilla/5.0 (compatible; source-preserving JAMB audit)" } });
if (!response.ok) throw new Error(`Exact TestDriller source page fetch failed: HTTP ${response.status}`);
const page = await response.text();
const match = page.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
if (!match) throw new Error("Expected inline TestDriller PNG was not found in the saved exact-source page.");
const bytes = Buffer.from(match[1], "base64");
const pngSignature = "89504e470d0a1a0a";
if (bytes.subarray(0, 8).toString("hex") !== pngSignature) throw new Error("Extracted source asset is not a PNG.");
await writeFile(outputPath, bytes);
const sha256 = createHash("sha256").update(bytes).digest("hex");
const receipt = {
  generatedAt: new Date().toISOString(),
  externalId: "biology_0536",
  sourcePage: sourcePageUrl,
  outputPath,
  byteLength: bytes.length,
  sha256,
  extractionScope: "Read-only source-asset extraction from TestDriller's inline exact JAMB 2009 Biology question 13 PNG. No question database, learner mapping, key, explanation, or approval status is changed.",
};
await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt, null, 2));
