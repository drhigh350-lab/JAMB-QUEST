import csv
import json
import re
from collections import Counter
from pathlib import Path

INPUT = Path("/home/ubuntu/upload/questions_rows(2).csv")
OUTPUT = Path("/home/ubuntu/jamb-import-staging/final_csv_aug16_normalized.json")
REPORT = Path("/home/ubuntu/jamb-quiz-game/reports/final_csv_normalization_audit_aug16.json")
SUBJECTS = {"Biology", "Chemistry", "Physics", "Use of English"}


def clean(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def to_difficulty(value):
    try:
        rating = float(value)
    except (TypeError, ValueError):
        return "medium"
    if rating <= 2:
        return "easy"
    if rating >= 7:
        return "hard"
    return "medium"


rows = []
holds = []
with INPUT.open("r", encoding="utf-8-sig", newline="") as handle:
    for line, row in enumerate(csv.DictReader(handle), start=2):
        subject = clean(row.get("subject"))
        if subject not in SUBJECTS:
            holds.append({"line": line, "id": clean(row.get("id")), "subject": subject, "reason": "outside four-subject JAMB Quest scope or structurally shifted row"})
            continue
        try:
            raw_options = json.loads(row.get("options") or "[]")
        except json.JSONDecodeError:
            holds.append({"line": line, "id": clean(row.get("id")), "subject": subject, "reason": "options is not valid JSON"})
            continue
        if not isinstance(raw_options, list):
            holds.append({"line": line, "id": clean(row.get("id")), "subject": subject, "reason": "options is not an array"})
            continue
        option_map = {}
        embedded_correct = []
        for option in raw_options:
            if not isinstance(option, dict):
                continue
            label = clean(option.get("label")).upper()
            text = clean(option.get("text"))
            if label in {"A", "B", "C", "D", "E"} and text:
                option_map[label] = text
                if option.get("isCorrect") is True:
                    embedded_correct.append(label)
        options = [option_map[label] for label in ["A", "B", "C", "D", "E"] if label in option_map]
        answer = clean(row.get("correct_option")).upper()
        if answer not in option_map:
            holds.append({"line": line, "id": clean(row.get("id")), "subject": subject, "reason": "correct option is absent from parsed options"})
            continue
        if embedded_correct and embedded_correct != [answer]:
            holds.append({"line": line, "id": clean(row.get("id")), "subject": subject, "reason": "embedded option correctness disagrees with correct_option"})
            continue
        rows.append({
            "externalId": f"kairo-csv-{clean(row.get('id'))}",
            "sourceId": clean(row.get("id")),
            "subject": subject,
            "topicLabel": " ".join(filter(None, [clean(row.get("topic")), clean(row.get("subtopic")), clean(row.get("concepts_tested"))])),
            "difficulty": to_difficulty(row.get("difficulty_rating")),
            "question": clean(row.get("stem")),
            "options": options,
            "answerLetter": answer,
            "explanation": clean(row.get("explanation")),
            "source": clean(row.get("source")),
            "year": clean(row.get("year")),
            "lifecycle": clean(row.get("lifecycle_state")),
        })

OUTPUT.write_text(json.dumps({"records": rows}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
audit = {"inputRows": len(rows) + len(holds), "normalizedRows": len(rows), "holds": holds, "holdReasons": dict(Counter(item["reason"] for item in holds)), "bySubject": dict(Counter(row["subject"] for row in rows))}
REPORT.write_text(json.dumps(audit, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(json.dumps({key: audit[key] for key in ("inputRows", "normalizedRows", "holdReasons", "bySubject")}, indent=2, ensure_ascii=False))
