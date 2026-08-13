# Authorised Question Import Guide

JAMB Quest keeps two question families visibly separate. The existing bank is labeled **Model Questions · Original JAMB-aligned**. Any question file supplied by the owner with permission to use it will be labeled **Authorised Question Set** and will retain its own source name, rights note, and import record.

## What to send

You may provide JSON, CSV, XLSX, PDF, or a well-structured document. For a faster and safer import, JSON or CSV is preferred. The source file should include a short note confirming that you have permission to use the material in this personal game.

## Preferred question record

```json
{
  "externalId": "BIO-PAST-001",
  "subject": "Biology",
  "topic": "Ecology",
  "difficulty": "medium",
  "question": "Question wording goes here.",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answerIndex": 1,
  "explanation": "Optional explanation or marking note.",
  "sourceLabel": "Owner-authorised JAMB practice pack",
  "permissionNote": "Authorised for use in JAMB Quest."
}
```

Every record should contain exactly four options and use a zero-based `answerIndex` from `0` to `3`. The game will validate duplicate IDs, subject names, option count, and answer bounds before an import is marked valid.

## Import lifecycle

| Stage | Meaning |
|---|---|
| Pending | File is stored with its declared source and awaits review. |
| Validated | Structure, subject tags, option count, and answer indices pass checks. |
| Imported | Questions become available under their own Authorised label. |
| Rejected | The file requires correction or the source permission is unclear. |

The game will never relabel authorised questions as model questions, and the model bank will never be presented as copied official past-paper wording.
