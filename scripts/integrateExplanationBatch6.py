import copy
import json
from pathlib import Path


ROOT = Path("/home/ubuntu/jamb-quiz-game")
INPUT_BANK = Path("/home/ubuntu/webdev-static-assets/jamb_high_yield_practice_bank_1000_explanations_batches2_5_v1.json")
INPUT_AUDIT = ROOT / "reports/explanations_batch6_compatibility_audit.json"
INPUT_LITERALS = ROOT / "reports/explanations_batch6_literal_audit.json"
OUTPUT_BANK = Path("/home/ubuntu/webdev-static-assets/jamb_high_yield_practice_bank_1000_explanations_batches2_6_v1.json")
OUTPUT_REPORT = ROOT / "reports/uploaded_explanations_batch6_merge_report.json"


def records_container(model_bank: dict) -> tuple[str, list[dict]]:
    for key in ("questions", "items", "records"):
        if isinstance(model_bank.get(key), list):
            return key, model_bank[key]
    raise ValueError("Could not locate a question-record array in the current model-bank asset")


def main() -> None:
    compatibility = json.loads(INPUT_AUDIT.read_text(encoding="utf-8"))
    if any(compatibility[key] for key in ("missingFromPendingRevisionList", "missingFromCurrentModelBank", "subjectMismatches", "preexistingIdenticalExplanations")):
        raise ValueError("Batch-six compatibility audit has unresolved mismatches or overlap")
    literal_audit = json.loads(INPUT_LITERALS.read_text(encoding="utf-8"))
    explanations = literal_audit["explanations"]
    model_bank = json.loads(INPUT_BANK.read_text(encoding="utf-8"))
    container_key, records = records_container(model_bank)
    by_id = {str(record.get("id") or record.get("record_id")): record for record in records}

    changed = []
    protected_field_changes = []
    for record_id, explanation in explanations.items():
        record = by_id[record_id]
        before = copy.deepcopy(record)
        record["explanation"] = explanation
        changed_fields = [key for key in set(before) | set(record) if key != "explanation" and before.get(key) != record.get(key)]
        if changed_fields:
            protected_field_changes.append({"id": record_id, "fields": changed_fields})
        changed.append(record_id)
    if protected_field_changes:
        raise ValueError(f"Protected question fields changed: {protected_field_changes}")

    OUTPUT_BANK.write_text(json.dumps(model_bank, ensure_ascii=False, indent=2), encoding="utf-8")
    report = {
        "source": literal_audit["source"],
        "updatedModelQuestions": len(changed),
        "recordIds": sorted(changed),
        "output": str(OUTPUT_BANK),
        "guarantees": [
            "The uploaded Python file was parsed as inert literal data and never executed.",
            "Only explanation fields changed.",
            "Every target ID is a Chemistry model-bank record in the pending revision list.",
            "No question, option, topic, answer key, or diagram field changed.",
        ],
    }
    OUTPUT_REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"updatedModelQuestions": len(changed), "output": str(OUTPUT_BANK)}, indent=2))


if __name__ == "__main__":
    main()
