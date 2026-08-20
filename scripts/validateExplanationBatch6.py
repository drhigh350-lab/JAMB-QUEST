import csv
import json
from pathlib import Path


ROOT = Path("/home/ubuntu/jamb-quiz-game")
AUDIT = ROOT / "reports/explanations_batch6_literal_audit.json"
PENDING = Path("/home/ubuntu/upload/JBquestions(1).csv")
MODEL_BANK = Path("/home/ubuntu/webdev-static-assets/jamb_high_yield_practice_bank_1000_explanations_batches2_5_v1.json")
OUTPUT = ROOT / "reports/explanations_batch6_compatibility_audit.json"


def question_records(model_bank: object) -> list[dict]:
    if isinstance(model_bank, dict):
        for key in ("questions", "items", "records"):
            if isinstance(model_bank.get(key), list):
                return model_bank[key]
    raise ValueError("Could not locate a question-record array in the current model-bank asset")


def main() -> None:
    supplied = json.loads(AUDIT.read_text(encoding="utf-8"))
    explanations = supplied["explanations"]
    with PENDING.open(encoding="utf-8", newline="") as handle:
        pending = {row["record_id"]: row for row in csv.DictReader(handle)}
    bank = question_records(json.loads(MODEL_BANK.read_text(encoding="utf-8")))
    by_id = {str(record.get("id") or record.get("record_id")): record for record in bank}

    missing_from_pending = []
    missing_from_model = []
    subject_mismatches = []
    preexisting_identical_explanations = []
    for record_id, explanation in explanations.items():
        pending_row = pending.get(record_id)
        if pending_row is None:
            missing_from_pending.append(record_id)
        elif pending_row.get("subject") != "Chemistry":
            subject_mismatches.append({"id": record_id, "pendingSubject": pending_row.get("subject")})
        model_record = by_id.get(record_id)
        if model_record is None:
            missing_from_model.append(record_id)
        elif str(model_record.get("subject")) != "Chemistry":
            subject_mismatches.append({"id": record_id, "modelSubject": model_record.get("subject")})
        elif model_record.get("explanation") == explanation:
            preexisting_identical_explanations.append(record_id)

    ids = sorted(explanations)
    output = {
        "source": supplied["source"],
        "recordCount": len(explanations),
        "targetSubject": "Chemistry",
        "firstId": ids[0] if ids else None,
        "lastId": ids[-1] if ids else None,
        "missingFromPendingRevisionList": missing_from_pending,
        "missingFromCurrentModelBank": missing_from_model,
        "subjectMismatches": subject_mismatches,
        "preexistingIdenticalExplanations": preexisting_identical_explanations,
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
