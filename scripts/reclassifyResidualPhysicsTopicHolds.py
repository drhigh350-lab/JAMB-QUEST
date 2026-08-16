import json
from pathlib import Path

from openai import OpenAI


ROOT = Path("/home/ubuntu/jamb-quiz-game")
INVENTORY = ROOT / "reports/needs_review_blocker_inventory.json"
OUTPUT = ROOT / "reports/residual_physics_topic_reclassification.json"
AREAS = ["Measurements and units", "Motion", "Gravitational field", "Equilibrium of forces", "Work, energy and power", "Machines", "Elasticity", "Pressure", "Liquids at rest", "Temperature and measurement", "Quantity of heat", "Change of state", "Thermal expansion", "Gas laws", "Vapours", "Structure of matter and kinetic theory", "Heat transfer", "Waves", "Propagation of sound", "Characteristics of sound", "Light energy", "Reflection", "Refraction", "Optical instruments", "Dispersion and colours", "Electrostatics", "Capacitors", "Electric cells", "Current electricity", "Electrical energy and power", "Magnets and magnetic fields", "Force on a current-carrying conductor", "Electromagnetic induction", "AC circuits", "Conduction of electricity", "Modern physics", "Introductory electronics", "Fibre optics and lasers"]

inventory = json.loads(INVENTORY.read_text(encoding="utf-8"))
records = [record for record in inventory["records"] if record["subject"] == "Physics" and "missing official topic mapping" in record["blockers"]]
payload = [{"id": record["id"], "currentLabel": record["topic"], "question": record["question"], "allowedOfficialAreas": AREAS} for record in records]
client = OpenAI()
response = client.chat.completions.create(
    model="gpt-5",
    messages=[
        {"role": "system", "content": "You are a careful JAMB Physics syllabus mapper. Assign each question to exactly one label from its allowed official syllabus areas. Use the question and current label as evidence. Return JSON only: {\"results\":[{\"id\":number,\"topic\":string|null,\"confidence\":\"high\"|\"medium\"|\"hold\",\"reason\":string}]}. Choose null only if no exact official area is defensible."},
        {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
    ],
    max_completion_tokens=4000,
    extra_body={"reasoning": {"effort": "high"}},
)
parsed = json.loads(response.choices[0].message.content or "{}")
by_id = {entry.get("id"): entry for entry in parsed.get("results", []) if isinstance(entry, dict)}
results = []
for record in records:
    entry = by_id.get(record["id"], {})
    topic = entry.get("topic") if entry.get("topic") in AREAS else None
    confidence = entry.get("confidence") if entry.get("confidence") in {"high", "medium", "hold"} else "hold"
    results.append({"id": record["id"], "topic": topic, "confidence": confidence if topic else "hold", "reason": str(entry.get("reason", "invalid response"))})
report = {"input": len(records), "mapped": sum(1 for row in results if row["topic"]), "held": sum(1 for row in results if not row["topic"]), "results": results}
OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"input": report["input"], "mapped": report["mapped"], "held": report["held"]}, indent=2))
