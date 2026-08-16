import csv
import json
from collections import Counter
from pathlib import Path


ROOT = Path("/home/ubuntu/jamb-quiz-game")
SOURCE = Path("/home/ubuntu/upload/questions_rows(1).csv")
STAGING = Path("/home/ubuntu/jamb-import-staging/questions_rows_1.raw.json")
REPORT = ROOT / "reports/questions_rows_1_inventory.json"


def clean(value):
    return value.strip() if isinstance(value, str) else ""


records = []
holds = []
with SOURCE.open("r", encoding="utf-8-sig", newline="") as handle:
    reader = csv.DictReader(handle)
    for row_number, row in enumerate(reader, start=2):
        raw_options = clean(row.get("options", ""))
        try:
            option_payload = json.loads(raw_options)
        except json.JSONDecodeError as error:
            holds.append({"row": row_number, "id": row.get("id"), "reason": f"unreadable options JSON: {error.msg}"})
            continue
        if not isinstance(option_payload, list):
            holds.append({"row": row_number, "id": row.get("id"), "reason": "options payload is not an array"})
            continue
        options = [clean(option.get("text", "")) if isinstance(option, dict) else "" for option in option_payload]
        labels = [clean(option.get("label", "")) if isinstance(option, dict) else "" for option in option_payload]
        correct_option = clean(row.get("correct_option", "")).upper()
        answer_index = labels.index(correct_option) if correct_option in labels else -1
        records.append({
            "sourceRow": row_number,
            "externalId": clean(row.get("id", "")),
            "subject": clean(row.get("subject", "")),
            "topic": clean(row.get("topic", "")),
            "subtopic": clean(row.get("subtopic", "")),
            "difficultyRating": clean(row.get("difficulty_rating", "")),
            "question": clean(row.get("stem", "")),
            "options": options,
            "optionLabels": labels,
            "answerIndex": answer_index,
            "correctOption": correct_option,
            "explanation": clean(row.get("explanation", "")),
            "source": clean(row.get("source", "")),
            "examBody": clean(row.get("exam_body", "")),
            "year": clean(row.get("year", "")),
        })

report = {
    "source": str(SOURCE),
    "parsed": len(records),
    "parseHolds": holds,
    "bySubject": dict(sorted(Counter(record["subject"] for record in records).items())),
    "bySource": dict(sorted(Counter(record["source"] for record in records).items())),
    "structuredAnswers": sum(1 for record in records if record["answerIndex"] >= 0),
    "withExplanation": sum(1 for record in records if record["explanation"]),
}
STAGING.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(report, ensure_ascii=False, indent=2))
