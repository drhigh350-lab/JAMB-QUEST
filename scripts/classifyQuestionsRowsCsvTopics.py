import json
from pathlib import Path

from openai import OpenAI


ROOT = Path("/home/ubuntu/jamb-quiz-game")
RAW = Path("/home/ubuntu/jamb-import-staging/questions_rows_1.raw.json")
AUDIT = ROOT / "reports/questions_rows_1_duplicate_audit.json"
OUTPUT = ROOT / "reports/questions_rows_1_topic_classification.json"

OFFICIAL = {
    "Use of English": ["Comprehension passages", "Summary", "Cloze passages", "Reading text", "Sentence meaning", "Synonyms", "Antonyms", "Clause and sentence patterns", "Word classes", "Tense, aspect, number and agreement", "Mechanics", "Ordinary, figurative and idiomatic usage", "Vowels", "Consonants", "Rhymes and homophones", "Word stress", "Emphatic stress", "Approved reading text"],
    "Biology": ["Living organisms and organization", "Evolution and classification", "Adaptations of organisms", "Plant and mammal structure", "Nutrition and digestion", "Transport", "Respiration", "Excretion", "Support and movement", "Reproduction", "Growth", "Coordination and control", "Factors affecting distribution", "Symbiotic interactions", "Natural habitats", "Nigerian biomes", "Population ecology", "Soil", "Humans and environment", "Variation", "Heredity", "Biotechnology", "Theories of evolution", "Evidence of evolution"],
    "Chemistry": ["Separation of mixtures", "Chemical combination", "Kinetic theory of matter and gases", "Atomic structure and bonding", "Nuclear chemistry", "Solubility", "Environmental pollution", "Acids, bases and salts", "Oxidation and reduction", "Electrolysis", "Energy changes", "Rates of reaction", "Chemical equilibria", "Non-metals and their compounds", "Metals and their compounds", "Organic compounds", "Chemistry and industry", "Astronomical chemistry"],
    "Physics": ["Measurements and units", "Motion", "Gravitational field", "Equilibrium of forces", "Work, energy and power", "Machines", "Elasticity", "Pressure", "Liquids at rest", "Temperature and measurement", "Quantity of heat", "Change of state", "Thermal expansion", "Gas laws", "Vapours", "Structure of matter and kinetic theory", "Heat transfer", "Waves", "Propagation of sound", "Characteristics of sound", "Light energy", "Reflection", "Refraction", "Optical instruments", "Dispersion and colours", "Electrostatics", "Capacitors", "Electric cells", "Current electricity", "Electrical energy and power", "Magnets and magnetic fields", "Force on a current-carrying conductor", "Electromagnetic induction", "AC circuits", "Conduction of electricity", "Modern physics", "Introductory electronics", "Fibre optics and lasers"],
}

raw = json.loads(RAW.read_text(encoding="utf-8"))
audit = json.loads(AUDIT.read_text(encoding="utf-8"))
hold_ids = {hold["externalId"] for hold in audit["holds"] if hold["reason"] == "no safe official syllabus mapping"}
records = [record for record in raw if record["externalId"] in hold_ids]

prompt_records = [{
    "externalId": record["externalId"],
    "subject": record["subject"],
    "suppliedTopic": record["topic"],
    "suppliedSubtopic": record["subtopic"],
    "question": record["question"],
    "allowedOfficialAreas": OFFICIAL[record["subject"]],
} for record in records]

system = """Map each supplied JAMB question to exactly one official JAMB syllabus area from the allowed list for its subject. Do not rewrite or judge the question, its options, its key, or its explanation. Return JSON only as {\"results\":[{\"externalId\":\"...\",\"topic\":\"exact allowed label or null\",\"confidence\":\"high|medium|hold\",\"reason\":\"short clause\"}]}. Use null only when the question is genuinely too ambiguous."""
client = OpenAI()
response = client.chat.completions.create(
    model="gpt-5-mini",
    messages=[
        {"role": "system", "content": system},
        {"role": "user", "content": json.dumps(prompt_records, ensure_ascii=False)},
    ],
    max_completion_tokens=4000,
)
result = json.loads(response.choices[0].message.content or "{}")
by_id = {entry.get("externalId"): entry for entry in result.get("results", []) if isinstance(entry, dict)}
classified = []
for record in records:
    entry = by_id.get(record["externalId"], {})
    topic = entry.get("topic")
    if topic not in OFFICIAL[record["subject"]]:
        topic = None
    classified.append({
        "externalId": record["externalId"],
        "subject": record["subject"],
        "suggestedTopic": topic,
        "confidence": entry.get("confidence") if entry.get("confidence") in {"high", "medium", "hold"} else "hold",
        "reason": str(entry.get("reason", "invalid or missing classifier response")),
    })
report = {
    "input": len(records),
    "mapped": sum(1 for row in classified if row["suggestedTopic"]),
    "held": sum(1 for row in classified if not row["suggestedTopic"]),
    "records": classified,
}
OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({key: report[key] for key in ("input", "mapped", "held")}, indent=2))
