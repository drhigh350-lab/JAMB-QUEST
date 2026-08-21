import csv
import json
from pathlib import Path


ROOT = Path("/home/ubuntu/jamb-quiz-game")
AUDIT = ROOT / "reports/explanations_batch9_literal_audit.json"
PENDING = Path("/home/ubuntu/upload/JBquestions(1).csv")
MODEL_BANK = Path("/home/ubuntu/webdev-static-assets/jamb_high_yield_practice_bank_1000_explanations_batches2_7_v1.json")
OUTPUT = ROOT / "reports/explanations_batch9_compatibility_audit.json"
GENERIC_ENDING = "The other options ("


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
    model_by_id = {str(record.get("id") or record.get("record_id")): record for record in records(json.loads(MODEL_BANK.read_text(encoding="utf-8")))}

    missing_pending, subject_mismatches, duplicate_explanations = [], [], []
    generic_ids, eligible_model_ids, eligible_authorised_ids = [], [], []
    for record_id, explanation in explanations.items():
        pending_row = pending.get(record_id)
        if pending_row is None:
            missing_pending.append(record_id)
            continue
        if record_id.startswith("PHY-") and pending_row.get("subject") != "Physics":
            subject_mismatches.append({"id": record_id, "subject": pending_row.get("subject"), "expected": "Physics"})
        if GENERIC_ENDING in explanation:
            generic_ids.append(record_id)
            continue
        if record_id.startswith("PHY-"):
            record = model_by_id.get(record_id)
            if record is None:
                missing_pending.append(record_id)
            elif record.get("explanation") == explanation:
                duplicate_explanations.append(record_id)
            else:
                eligible_model_ids.append(record_id)
        elif record_id.startswith("authorised-"):
            # These items require a separate verified database mapping. They are
            # deliberately not treated as eligible model-bank updates here.
            eligible_authorised_ids.append(record_id)
        else:
            missing_pending.append(record_id)

    output = {
        "source": supplied["source"],
        "recordCount": len(explanations),
        "missingFromPendingRevisionList": missing_pending,
        "subjectMismatches": subject_mismatches,
        "preexistingIdenticalExplanations": duplicate_explanations,
        "genericTemplateIds": generic_ids,
        "eligibleModelBankIds": eligible_model_ids,
        "authorisedIdsHeldPendingVerifiedMapping": eligible_authorised_ids,
        "eligibleModelBankCount": len(eligible_model_ids),
        "authorisedHeldCount": len(eligible_authorised_ids),
        "heldGenericCount": len(generic_ids),
    }
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
