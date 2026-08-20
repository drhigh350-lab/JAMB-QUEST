import copy
import json
from pathlib import Path


ROOT = Path("/home/ubuntu/jamb-quiz-game")
INPUT_BANK = Path("/home/ubuntu/webdev-static-assets/jamb_high_yield_practice_bank_1000_explanations_batches2_6_v1.json")
INPUT_AUDIT = ROOT / "reports/explanations_batch7_compatibility_audit.json"
INPUT_LITERALS = ROOT / "reports/explanations_batch7_literal_audit.json"
OUTPUT_BANK = Path("/home/ubuntu/webdev-static-assets/jamb_high_yield_practice_bank_1000_explanations_batches2_7_v1.json")
OUTPUT_REPORT = ROOT / "reports/uploaded_explanations_batch7_merge_report.json"


def records(model_bank: dict) -> list[dict]:
    for key in ("questions", "items", "records"):
        if isinstance(model_bank.get(key), list):
            return model_bank[key]
    raise ValueError("Could not locate the model-bank question array")


def main() -> None:
    compatibility = json.loads(INPUT_AUDIT.read_text(encoding="utf-8"))
    if any(compatibility[key] for key in ("missingFromPendingRevisionList", "missingFromCurrentModelBank", "subjectMismatches", "preexistingIdenticalExplanations")):
        raise ValueError("Batch-seven compatibility audit has unresolved mismatch or overlap")
    supplied = json.loads(INPUT_LITERALS.read_text(encoding="utf-8"))
    explanations = supplied["explanations"]
    model_bank = json.loads(INPUT_BANK.read_text(encoding="utf-8"))
    by_id = {str(record.get("id") or record.get("record_id")): record for record in records(model_bank)}
    protected_field_changes = []

    for record_id, explanation in explanations.items():
        record = by_id[record_id]
        before = copy.deepcopy(record)
        record["explanation"] = explanation
        changed = [key for key in set(before) | set(record) if key != "explanation" and before.get(key) != record.get(key)]
        if changed:
            protected_field_changes.append({"id": record_id, "fields": changed})
    if protected_field_changes:
        raise ValueError(f"Protected question fields changed: {protected_field_changes}")

    OUTPUT_BANK.write_text(json.dumps(model_bank, ensure_ascii=False, indent=2), encoding="utf-8")
    report = {
        "source": supplied["source"],
        "updatedModelQuestions": len(explanations),
        "recordIds": sorted(explanations),
        "output": str(OUTPUT_BANK),
        "guarantees": [
            "The uploaded file was parsed as inert literal data and never executed.",
            "Only explanation fields changed.",
            "All recoverable targets are Physics model-bank records in the pending revision list.",
            "The missing source IDs were not invented or reconstructed.",
        ],
    }
    OUTPUT_REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"updatedModelQuestions": len(explanations), "output": str(OUTPUT_BANK)}, indent=2))


if __name__ == "__main__":
    main()
