import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const sourcePageUrl = "https://www.testdriller.com/past-questions/jamb-objective-biology-2007-47";
const outputPath = "/home/ubuntu/webdev-static-assets/biology-0480-testdriller-original.png";
const receiptPath = path.resolve("reports/extracted_biology_0480_testdriller_original_20260826.json");
const response = await fetch(sourcePageUrl, { headers: { "user-agent": "Mozilla/5.0 (compatible; source-preserving JAMB audit)" } });
if (!response.ok) throw new Error(`Exact TestDriller source page fetch failed: HTTP ${response.status}`);
const page = await response.text();
const match = page.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
if (!match) throw new Error("Expected inline TestDriller PNG was not found in the exact source page.");
const bytes = Buffer.from(match[1], "base64");
if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error("Extracted source asset is not a PNG.");
await writeFile(outputPath, bytes);
const receipt = {
  generatedAt: new Date().toISOString(),
  externalId: "biology_0480",
  sourcePage: sourcePageUrl,
  outputPath,
  byteLength: bytes.length,
  sha256: createHash("sha256").update(bytes).digest("hex"),
  extractionScope: "Read-only exact-source extraction. No question database, learner mapping, key, explanation, or approval status is changed.",
};
await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt, null, 2));
