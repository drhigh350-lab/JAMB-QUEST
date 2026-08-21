import csv
import json
from pathlib import Path


ROOT = Path("/home/ubuntu/jamb-quiz-game")
AUDIT = ROOT / "reports/explanations_batch8_literal_audit.json"
PENDING = Path("/home/ubuntu/upload/JBquestions(1).csv")
MODEL_BANK = Path("/home/ubuntu/webdev-static-assets/jamb_high_yield_practice_bank_1000_explanations_batches2_7_v1.json")
OUTPUT = ROOT / "reports/explanations_batch8_compatibility_audit.json"
GENERIC_PHRASES = (
    "The other options do not satisfy the same relationship",
    "This makes ",
)


def records(model_bank: dict) -> list[dict]:
    for key in ("questions", "items", "records"):
        if isinstance(model_bank.get(key), list):
            return model_bank[key]
    raise ValueError("Could not locate the model-bank question array")


def main() -> None:
    supplied = json.loads(AUDIT.read_text(encoding="utf-8"))
    explanations = supplied["explanations"]
    with PENDING.open(encoding="utf-8", newline="") as handle:
        pending = {row["record_id"]: row for row in csv.DictReader(handle)}
    by_id = {str(record.get("id") or record.get("record_id")): record for record in records(json.loads(MODEL_BANK.read_text(encoding="utf-8")))}

    missing_from_pending, missing_from_model, subject_mismatches, identical = [], [], [], []
    generic_template_ids = []
    for record_id, explanation in explanations.items():
        pending_row = pending.get(record_id)
        if pending_row is None:
            missing_from_pending.append(record_id)
        elif pending_row.get("subject") != "Physics":
            subject_mismatches.append({"id": record_id, "pendingSubject": pending_row.get("subject")})
        model_record = by_id.get(record_id)
        if model_record is None:
            missing_from_model.append(record_id)
        elif model_record.get("subject") != "Physics":
            subject_mismatches.append({"id": record_id, "modelSubject": model_record.get("subject")})
        elif model_record.get("explanation") == explanation:
            identical.append(record_id)
        if all(phrase in explanation for phrase in GENERIC_PHRASES):
            generic_template_ids.append(record_id)

    output = {
        "source": supplied["source"],
        "recordCount": len(explanations),
        "targetSubject": "Physics",
        "missingFromPendingRevisionList": missing_from_pending,
        "missingFromCurrentModelBank": missing_from_model,
        "subjectMismatches": subject_mismatches,
        "preexistingIdenticalExplanations": identical,
        "genericTemplateIds": generic_template_ids,
        "eligibleForRelease": not any((missing_from_pending, missing_from_model, subject_mismatches, identical, generic_template_ids)),
        "literalParseMetadata": {
            "ignoredStatusPrintCount": supplied["ignoredStatusPrintCount"],
            "minCharacters": supplied["minCharacters"],
            "maxCharacters": supplied["maxCharacters"],
        },
    }
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
