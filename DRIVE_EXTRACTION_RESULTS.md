# Owner-Provided Drive Extraction Results

## Completed retrieval and profiling

The connected `Free JAMB Past Questions and Answers` folder was retrieved into private staging without altering the Drive. **27 eligible PDFs** were downloaded for the four-subject JAMB Quest scope, while the single Mathematics PDF was excluded. The staged collection occupies approximately **324 MB**.

| Check | Result |
|---|---:|
| Eligible source PDFs downloaded | 27 |
| Out-of-scope Mathematics PDF | 1, excluded |
| Candidate numbered question blocks identified before full answer validation | 5,764+ |
| Complete, four-option, explicitly answer-marked records safely staged | 376 |
| Candidate records held back for missing answers, ambiguous structure, mixed subject, or duplicate wording | 7,262 |

## Provenance and quality controls

Every staged record includes its original Drive file ID, filename, subject, and the status **`owner-provided / verification pending`**. The safe staging path accepts only four labelled options and an explicit answer marker. It does not infer missing answers, overwrite model questions, or call the wording official JAMB material.

The three high-volume `JAMB REMIX` scans required a separate OCR attempt because their embedded text was incomplete. Their PDF rendering produced recurring malformed-stream and embedded-font warnings, while low-resolution OCR could not recover stable question-and-answer structures at an importable quality. Those scans remain preserved in the private source archive and are not part of the 376 safe playable records.

## Staged artefacts

The private extraction workspace contains a file-level provenance profile, valid records, rejected records, and a per-source summary under `/home/ubuntu/jamb-drive-extract/`. The JAMB Quest project will import only the validated subset after the user confirms that owner-provided, verification-pending source labelling is acceptable for gameplay.
