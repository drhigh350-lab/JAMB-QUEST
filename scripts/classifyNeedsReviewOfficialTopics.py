import json
import time
from pathlib import Path

from openai import OpenAI


ROOT = Path("/home/ubuntu/jamb-quiz-game")
INVENTORY = ROOT / "reports/needs_review_blocker_inventory.json"
OUTPUT = ROOT / "reports/needs_review_official_topic_classification.json"

OFFICIAL = {
    "Use of English": ["Comprehension passages", "Summary", "Cloze passages", "Reading text", "Sentence meaning", "Synonyms", "Antonyms", "Clause and sentence patterns", "Word classes", "Tense, aspect, number and agreement", "Mechanics", "Ordinary, figurative and idiomatic usage", "Vowels", "Consonants", "Rhymes and homophones", "Word stress", "Emphatic stress", "Approved reading text"],
    "Biology": ["Living organisms and organization", "Evolution and classification", "Adaptations of organisms", "Plant and mammal structure", "Nutrition and digestion", "Transport", "Respiration", "Excretion", "Support and movement", "Reproduction", "Growth", "Coordination and control", "Factors affecting distribution", "Symbiotic interactions", "Natural habitats", "Nigerian biomes", "Population ecology", "Soil", "Humans and environment", "Variation", "Heredity", "Biotechnology", "Theories of evolution", "Evidence of evolution"],
    "Chemistry": ["Separation of mixtures", "Chemical combination", "Kinetic theory of matter and gases", "Atomic structure and bonding", "Nuclear chemistry", "Solubility", "Environmental pollution", "Acids, bases and salts", "Oxidation and reduction", "Electrolysis", "Energy changes", "Rates of reaction", "Chemical equilibria", "Non-metals and their compounds", "Metals and their compounds", "Organic compounds", "Chemistry and industry", "Astronomical chemistry"],
    "Physics": ["Measurements and units", "Motion", "Gravitational field", "Equilibrium of forces", "Work, energy and power", "Machines", "Elasticity", "Pressure", "Liquids at rest", "Temperature and measurement", "Quantity of heat", "Change of state", "Thermal expansion", "Gas laws", "Vapours", "Structure of matter and kinetic theory", "Heat transfer", "Waves", "Propagation of sound", "Characteristics of sound", "Light energy", "Reflection", "Refraction", "Optical instruments", "Dispersion and colours", "Electrostatics", "Capacitors", "Electric cells", "Current electricity", "Electrical energy and power", "Magnets and magnetic fields", "Force on a current-carrying conductor", "Electromagnetic induction", "AC circuits", "Conduction of electricity", "Modern physics", "Introductory electronics", "Fibre optics and lasers"],
}

inventory = json.loads(INVENTORY.read_text(encoding="utf-8"))
records = [record for record in inventory["records"] if "missing official topic mapping" in record["blockers"]]
client = OpenAI()
system = """You assign each JAMB question to exactly one official syllabus area from the specific allowed list included with that question. Do not change or audit the question, options, answer key, source, or explanation. Return JSON only with this exact schema: {\"results\":[{\"id\":number,\"topic\":string|null,\"confidence\":\"high\"|\"medium\"|\"hold\",\"reason\":string}]}. Use null only if the stem cannot be responsibly classified."""
results = []
for start in range(0, len(records), 20):
    batch = records[start:start + 20]
    payload = [{
        "id": record["id"],
        "subject": record["subject"],
        "question": record["question"],
        "allowedOfficialAreas": OFFICIAL[record["subject"]],
    } for record in batch]
    response = None
    for attempt in range(3):
        try:
            response = client.chat.completions.create(
                model="gpt-5-mini",
                messages=[{"role": "system", "content": system}, {"role": "user", "content": json.dumps(payload, ensure_ascii=False)}],
                max_completion_tokens=3500,
            )
            break
        except Exception as error:
            if attempt == 2:
                for record in batch:
                    results.append({"id": record["id"], "subject": record["subject"], "topic": None, "confidence": "hold", "reason": f"classifier request failed: {error}"})
            else:
                time.sleep(2 ** attempt)
    if not response:
        continue
    try:
        parsed = json.loads(response.choices[0].message.content or "{}")
    except json.JSONDecodeError:
        parsed = {}
    entries = {entry.get("id"): entry for entry in parsed.get("results", []) if isinstance(entry, dict)}
    for record in batch:
        entry = entries.get(record["id"], {})
        topic = entry.get("topic")
        if topic not in OFFICIAL[record["subject"]]:
            topic = None
        confidence = entry.get("confidence") if entry.get("confidence") in {"high", "medium", "hold"} else "hold"
        results.append({
            "id": record["id"],
            "subject": record["subject"],
            "topic": topic,
            "confidence": confidence if topic else "hold",
            "reason": str(entry.get("reason", "invalid or missing classifier response")),
        })
    print(f"classified {min(start + len(batch), len(records))}/{len(records)}", flush=True)

report = {
    "input": len(records),
    "mapped": sum(1 for result in results if result["topic"]),
    "high": sum(1 for result in results if result["topic"] and result["confidence"] == "high"),
    "medium": sum(1 for result in results if result["topic"] and result["confidence"] == "medium"),
    "held": sum(1 for result in results if not result["topic"]),
    "results": results,
}
OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({key: report[key] for key in ("input", "mapped", "high", "medium", "held")}, indent=2))
