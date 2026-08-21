import copy
import json
from pathlib import Path


ROOT = Path("/home/ubuntu/jamb-quiz-game")
INPUT_BANK = Path("/home/ubuntu/webdev-static-assets/jamb_high_yield_practice_bank_1000_explanations_batches2_7_v1.json")
INPUT_LITERALS = ROOT / "reports/explanations_batch9_literal_audit.json"
INPUT_COMPATIBILITY = ROOT / "reports/explanations_batch9_compatibility_audit.json"
OUTPUT_BANK = Path("/home/ubuntu/webdev-static-assets/jamb_high_yield_practice_bank_1000_explanations_batches2_7_plus_batch9_model_v1.json")
OUTPUT_REPORT = ROOT / "reports/uploaded_explanations_batch9_model_subset_merge_report.json"


def records(model_bank: dict) -> list[dict]:
    for key in ("questions", "items", "records"):
        if isinstance(model_bank.get(key), list):
            return model_bank[key]
    raise ValueError("Could not locate the model-bank question array")


def main() -> None:
    compatibility = json.loads(INPUT_COMPATIBILITY.read_text(encoding="utf-8"))
    if any(compatibility[key] for key in ("missingFromPendingRevisionList", "subjectMismatches", "preexistingIdenticalExplanations")):
        raise ValueError("Batch-nine compatibility audit has unresolved ID or subject mismatch")
    source = json.loads(INPUT_LITERALS.read_text(encoding="utf-8"))
    supplied = source["explanations"]
    eligible_ids = compatibility["eligibleModelBankIds"]
    if not eligible_ids:
        raise ValueError("No clean model-bank batch-nine explanations are eligible")

    model_bank = json.loads(INPUT_BANK.read_text(encoding="utf-8"))
    by_id = {str(record.get("id") or record.get("record_id")): record for record in records(model_bank)}
    changed_protected_fields = []
    for record_id in eligible_ids:
        record = by_id.get(record_id)
        if record is None:
            raise ValueError(f"Eligible model question not found: {record_id}")
        before = copy.deepcopy(record)
        record["explanation"] = supplied[record_id]
        changed = [key for key in set(before) | set(record) if key != "explanation" and before.get(key) != record.get(key)]
        if changed:
            changed_protected_fields.append({"id": record_id, "fields": changed})
    if changed_protected_fields:
        raise ValueError(f"Protected fields changed: {changed_protected_fields}")

    OUTPUT_BANK.write_text(json.dumps(model_bank, ensure_ascii=False, indent=2), encoding="utf-8")
    report = {
        "source": source["source"],
        "updatedModelQuestions": len(eligible_ids),
        "recordIds": eligible_ids,
        "heldAuthorisedIds": compatibility["authorisedIdsHeldPendingVerifiedMapping"],
        "heldGenericIds": compatibility["genericTemplateIds"],
        "output": str(OUTPUT_BANK),
        "guarantees": [
            "The uploaded file was parsed as inert literal data and never executed.",
            "Only explanation fields changed for the listed model-bank records.",
            "Authorised targets remain held pending a verified source mapping and generic-template remedy.",
            "No question, option, topic, answer key, or diagram field changed.",
        ],
    }
    OUTPUT_REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"updatedModelQuestions": len(eligible_ids), "heldAuthorisedQuestions": len(report["heldAuthorisedIds"]), "output": str(OUTPUT_BANK)}, indent=2))


if __name__ == "__main__":
    main()
