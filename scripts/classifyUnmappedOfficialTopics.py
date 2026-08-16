import concurrent.futures as cf
import json
import time
from pathlib import Path

from openai import OpenAI


ROOT = Path("/home/ubuntu/jamb-quiz-game")
INPUT = ROOT / "reports/unmapped_authorised_topic_inventory.json"
OUTPUT = ROOT / "reports/unmapped_authorised_topic_classification.json"
MODEL = "gpt-5-mini"
BATCH_SIZE = 6
MAX_WORKERS = 4

OFFICIAL = {
    "Use of English": [
        "Comprehension passages", "Summary", "Cloze passages", "Reading text",
        "Sentence meaning", "Synonyms", "Antonyms", "Clause and sentence patterns",
        "Word classes", "Tense, aspect, number and agreement", "Mechanics",
        "Ordinary, figurative and idiomatic usage", "Vowels", "Consonants",
        "Rhymes and homophones", "Word stress", "Emphatic stress", "Approved reading text",
    ],
    "Biology": [
        "Living organisms and organization", "Evolution and classification", "Adaptations of organisms",
        "Plant and mammal structure", "Nutrition and digestion", "Transport", "Respiration", "Excretion",
        "Support and movement", "Reproduction", "Growth", "Coordination and control",
        "Factors affecting distribution", "Symbiotic interactions", "Natural habitats", "Nigerian biomes",
        "Population ecology", "Soil", "Humans and environment", "Variation", "Heredity", "Biotechnology",
        "Theories of evolution", "Evidence of evolution",
    ],
    "Chemistry": [
        "Separation of mixtures", "Chemical combination", "Kinetic theory of matter and gases",
        "Atomic structure and bonding", "Nuclear chemistry", "Solubility", "Environmental pollution",
        "Acids, bases and salts", "Oxidation and reduction", "Electrolysis", "Energy changes",
        "Rates of reaction", "Chemical equilibria", "Non-metals and their compounds",
        "Metals and their compounds", "Organic compounds", "Chemistry and industry", "Astronomical chemistry",
    ],
    "Physics": [
        "Measurements and units", "Motion", "Gravitational field", "Equilibrium of forces",
        "Work, energy and power", "Machines", "Elasticity", "Pressure", "Liquids at rest",
        "Temperature and measurement", "Quantity of heat", "Change of state", "Thermal expansion",
        "Gas laws", "Vapours", "Structure of matter and kinetic theory", "Heat transfer", "Waves",
        "Propagation of sound", "Characteristics of sound", "Light energy", "Reflection", "Refraction",
        "Optical instruments", "Dispersion and colours", "Electrostatics", "Capacitors", "Electric cells",
        "Current electricity", "Electrical energy and power", "Magnets and magnetic fields",
        "Force on a current-carrying conductor", "Electromagnetic induction", "AC circuits",
        "Conduction of electricity", "Modern physics", "Introductory electronics", "Fibre optics and lasers",
    ],
}

SYSTEM = """You are mapping supplied JAMB practice questions to official JAMB syllabus areas. Select exactly one official area from the allowed list for that question's subject, or use null only when the stem is genuinely too ambiguous. Use the question content and supplied current label as evidence. Do not judge answer-key correctness, rewrite text, or invent an area. Keep the reason to one short clause. A medium confidence mapping is acceptable when the concept is clear but the exact official grouping is broad; use hold only when no defensible mapping exists. Return JSON only, exactly in this shape: {\"results\":[{\"id\":123,\"topic\":\"one allowed official area or null\",\"confidence\":\"high|medium|hold\",\"reason\":\"short clause\"}]}."""


def batch_prompt(records):
    payload = []
    for record in records:
        payload.append({
            "id": record["id"],
            "subject": record["subject"],
            "currentTopic": record["currentTopic"],
            "question": record["question"],
            "allowedOfficialAreas": OFFICIAL[record["subject"]],
        })
    return json.dumps(payload, ensure_ascii=False)


def classify(records):
    client = OpenAI()
    expected = {record["id"]: record for record in records}
    last_error = "unknown classification error"
    for attempt in range(1, 4):
        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM},
                    {"role": "user", "content": batch_prompt(records)},
                ],
                max_completion_tokens=1800,
            )
            content = response.choices[0].message.content
            data = json.loads(content or "{}")
            results = data.get("results", [])
            by_id = {row.get("id"): row for row in results if isinstance(row, dict)}
            if set(by_id) != set(expected):
                raise ValueError("response IDs do not match requested records")
            validated = []
            for record_id, record in expected.items():
                result = by_id[record_id]
                topic = result.get("topic")
                confidence = result.get("confidence")
                if topic is not None and topic not in OFFICIAL[record["subject"]]:
                    raise ValueError(f"invalid official topic for {record_id}: {topic}")
                if confidence not in {"high", "medium", "hold"}:
                    raise ValueError(f"invalid confidence for {record_id}")
                if confidence == "hold":
                    topic = None
                validated.append({
                    "id": record_id,
                    "externalId": record["externalId"],
                    "subject": record["subject"],
                    "currentTopic": record["currentTopic"],
                    "suggestedTopic": topic,
                    "confidence": confidence,
                    "reason": str(result.get("reason", "")).strip(),
                })
            return validated
        except Exception as exc:
            last_error = str(exc)
            time.sleep(attempt * 2)
    return [{
        "id": record["id"],
        "externalId": record["externalId"],
        "subject": record["subject"],
        "currentTopic": record["currentTopic"],
        "suggestedTopic": None,
        "confidence": "hold",
        "reason": f"classifier unavailable: {last_error}",
    } for record in records]


inventory = json.loads(INPUT.read_text(encoding="utf-8"))
records = [record for record in inventory["records"] if record["explanationStatus"] == "approved"]
batches = [records[index:index + BATCH_SIZE] for index in range(0, len(records), BATCH_SIZE)]
classified = []
with cf.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
    futures = [executor.submit(classify, batch) for batch in batches]
    for index, future in enumerate(futures, start=1):
        classified.extend(future.result())
        print(json.dumps({"completedBatches": index, "totalBatches": len(batches), "mapped": sum(1 for row in classified if row["suggestedTopic"]), "held": sum(1 for row in classified if not row["suggestedTopic"])}))

report = {
    "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "model": MODEL,
    "inputApprovedUnmapped": len(records),
    "mapped": sum(1 for row in classified if row["suggestedTopic"]),
    "held": sum(1 for row in classified if not row["suggestedTopic"]),
    "byConfidence": {level: sum(1 for row in classified if row["confidence"] == level) for level in ("high", "medium", "hold")},
    "records": sorted(classified, key=lambda row: row["id"]),
}
OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({key: report[key] for key in ("inputApprovedUnmapped", "mapped", "held", "byConfidence")}, indent=2))
