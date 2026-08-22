import json, re
from collections import Counter
from pathlib import Path

source = Path("reports/questions_rows3_topic_hold_inventory.json")
out = Path("reports/questions_rows3_topic_mapping_audit.json")
data = json.loads(source.read_text(encoding="utf-8"))

topic_map = {
  ("Biology", "Co-ordination and control"): "Coordination and control",
  ("Biology", "Factors affecting the distribution of organisms"): "Factors affecting distribution",
  ("Biology", "Living organisms"): "Living organisms and organization",
  ("Chemistry", "Air"): "Non-metals and their compounds",
  ("Chemistry", "Water"): "Environmental pollution",
  ("Physics", "Electrical Measuring Instruments"): "Current electricity",
  ("Physics", "Friction"): "Equilibrium of forces",
  ("Physics", "Nuclear Physics"): "Modern physics",
  ("Physics", "Scalars and Vectors"): "Measurements and units",
  ("Physics", "Semiconductors"): "Introductory electronics",
  ("Use of English", "Appropriate word choice"): "Ordinary, figurative and idiomatic usage",
  ("Use of English", "Error identification"): "Mechanics",
  ("Use of English", "Grammatical usage"): "Tense, aspect, number and agreement",
  ("Use of English", "Sentence completion"): "Sentence meaning",
  ("Use of English", "Sentence structure"): "Clause and sentence patterns",
  ("Use of English", "Stress"): "Word stress",
  ("Use of English", "Vocabulary"): "Ordinary, figurative and idiomatic usage",
  ("Use of English", "Vocabulary and expressions in context"): "Ordinary, figurative and idiomatic usage",
}

unsafe = re.compile(r"\b(no explanation available|without the diagram|placeholder)\b", re.I)
diagram_ref = re.compile(r"\b(labelled?|diagram|figure|shown above|shown below)\b", re.I)
mapped, held = [], []
for row in data["held"]:
    official = topic_map.get((row["subject"], row["topic"]))
    flags = []
    if not official:
        flags.append("no_official_mapping")
    blob = " ".join([row["question"], row["explanation"], *row["options"]])
    if unsafe.search(blob): flags.append("placeholder_or_missing_context")
    if diagram_ref.search(row["question"]) and not any(flag == "placeholder_or_missing_context" for flag in flags):
        flags.append("diagram_or_label_reference_needs_asset_check")
    record = {**row, "officialTopic": official, "flags": flags}
    (held if flags else mapped).append(record)

audit = {
  "inputCount": len(data["held"]), "mappedReady": len(mapped), "heldCount": len(held),
  "mappedByOfficialTopic": dict(Counter(f'{r["subject"]}::{r["officialTopic"]}' for r in mapped)),
  "heldByReason": dict(Counter(flag for r in held for flag in r["flags"])),
  "mapped": mapped, "held": held,
}
out.write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({k:audit[k] for k in ["inputCount", "mappedReady", "heldCount", "mappedByOfficialTopic", "heldByReason"]}, ensure_ascii=False, indent=2))
