import csv
import json
import re
from collections import Counter
from pathlib import Path

INPUT = Path("/home/ubuntu/upload/questions_rows(2).csv")
OUTPUT = Path("/home/ubuntu/jamb-quiz-game/reports/final_csv_profile_aug16.json")


def clean(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


with INPUT.open("r", encoding="utf-8-sig", newline="") as handle:
    reader = csv.DictReader(handle)
    fields = reader.fieldnames or []
    records = list(reader)

lower = {field.lower().strip(): field for field in fields}
answer_field = next((lower[key] for key in ("correct_answer", "answer", "answer_letter", "correct option") if key in lower), None)
explanation_field = next((lower[key] for key in ("explanation", "reason", "solution") if key in lower), None)
topic_field = next((lower[key] for key in ("topic", "tag", "tags") if key in lower), None)
subject_field = next((lower[key] for key in ("subject", "course") if key in lower), None)
option_fields = [lower[key] for key in ("option_a", "option_b", "option_c", "option_d", "option_e") if key in lower]

by_subject = Counter(clean(row.get(subject_field)) for row in records) if subject_field else Counter()
answer_values = Counter(clean(row.get(answer_field)).upper() for row in records) if answer_field else Counter()
option_counts = Counter(sum(bool(clean(row.get(field))) for field in option_fields) for row in records)
profile = {
    "input": str(INPUT),
    "records": len(records),
    "fields": fields,
    "detected": {
        "subject": subject_field,
        "answer": answer_field,
        "explanation": explanation_field,
        "topic": topic_field,
        "options": option_fields,
    },
    "bySubject": dict(by_subject),
    "answerValues": dict(answer_values),
    "optionCounts": dict(option_counts),
    "missing": {
        "question": sum(not clean(row.get(lower.get("question", ""))) for row in records),
        "answer": sum(not clean(row.get(answer_field)) for row in records) if answer_field else len(records),
        "explanation": sum(not clean(row.get(explanation_field)) for row in records) if explanation_field else len(records),
        "topic": sum(not clean(row.get(topic_field)) for row in records) if topic_field else len(records),
    },
    "sample": records[:3],
}
OUTPUT.write_text(json.dumps(profile, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(json.dumps({key: profile[key] for key in ("records", "fields", "detected", "bySubject", "answerValues", "optionCounts", "missing")}, indent=2, ensure_ascii=False))
