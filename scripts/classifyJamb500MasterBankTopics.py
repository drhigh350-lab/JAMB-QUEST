import json
from pathlib import Path

from openai import OpenAI


ROOT = Path("/home/ubuntu/jamb-quiz-game")
SOURCE = Path("/home/ubuntu/jamb-import-staging/new_pdf_aug16/JAMB_500_QUESTION_MASTER_BANK.txt")
AUDIT = ROOT / "reports/jamb_500_master_bank_pdf_audit.json"
OUTPUT = ROOT / "reports/jamb_500_master_bank_topic_classification.json"
BATCH_SIZE = 25

OFFICIAL = {
    "Use of English": ["Comprehension passages", "Summary", "Cloze passages", "Reading text", "Sentence meaning", "Synonyms", "Antonyms", "Clause and sentence patterns", "Word classes", "Tense, aspect, number and agreement", "Mechanics", "Ordinary, figurative and idiomatic usage", "Vowels", "Consonants", "Rhymes and homophones", "Word stress", "Emphatic stress", "Approved reading text"],
    "Biology": ["Living organisms and organization", "Evolution and classification", "Adaptations of organisms", "Plant and mammal structure", "Nutrition and digestion", "Transport", "Respiration", "Excretion", "Support and movement", "Reproduction", "Growth", "Coordination and control", "Factors affecting distribution", "Symbiotic interactions", "Natural habitats", "Nigerian biomes", "Population ecology", "Soil", "Humans and environment", "Variation", "Heredity", "Biotechnology", "Theories of evolution", "Evidence of evolution"],
    "Chemistry": ["Separation of mixtures", "Chemical combination", "Kinetic theory of matter and gases", "Atomic structure and bonding", "Nuclear chemistry", "Solubility", "Environmental pollution", "Acids, bases and salts", "Oxidation and reduction", "Electrolysis", "Energy changes", "Rates of reaction", "Chemical equilibria", "Non-metals and their compounds", "Metals and their compounds", "Organic compounds", "Chemistry and industry", "Astronomical chemistry"],
    "Physics": ["Measurements and units", "Motion", "Gravitational field", "Equilibrium of forces", "Work, energy and power", "Machines", "Elasticity", "Pressure", "Liquids at rest", "Temperature and measurement", "Quantity of heat", "Change of state", "Thermal expansion", "Gas laws", "Vapours", "Structure of matter and kinetic theory", "Heat transfer", "Waves", "Propagation of sound", "Characteristics of sound", "Light energy", "Reflection", "Refraction", "Optical instruments", "Dispersion and colours", "Electrostatics", "Capacitors", "Electric cells", "Current electricity", "Electrical energy and power", "Magnets and magnetic fields", "Force on a current-carrying conductor", "Electromagnetic induction", "AC circuits", "Conduction of electricity", "Modern physics", "Introductory electronics", "Fibre optics and lasers"],
}

SUBJECTS = {"Use of English", "Biology", "Chemistry", "Physics"}
SLUGS = {"Use of English": "english", "Biology": "biology", "Chemistry": "chemistry", "Physics": "physics"}

def parse_source():
    records = []
    current_subject = None
    current_topic = ""
    current = None
    def flush():
        nonlocal current
        if current_subject and current and current["answerIndex"] >= 0:
            records.append({**current, "subject": current_subject, "suppliedTopic": current_topic, "externalId": f"jamb-500-master-{SLUGS[current_subject]}-{current['sourceNumber']:03d}"})
        current = None
    for raw_line in SOURCE.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        subject_match = __import__("re").match(r"^(Use of English|Chemistry|Biology|Physics)\s+—\s+100\s+QUESTIONS$", line, __import__("re").I)
        if subject_match:
            flush()
            value = subject_match.group(1)
            current_subject = value if value == "Use of English" else value.capitalize()
            current_topic = ""
            continue
        if not current_subject or not line or "Master Bank" in line and "Page" in line:
            continue
        topic_match = __import__("re").match(r"^Topic:\s*(.+)$", line, __import__("re").I)
        if topic_match and not current:
            current_topic = topic_match.group(1).strip()
            continue
        question_match = __import__("re").match(r"^(\d{1,3})\.\s+(.+)$", line)
        if question_match:
            flush()
            current = {"sourceNumber": int(question_match.group(1)), "question": question_match.group(2).strip(), "options": [], "answerIndex": -1, "explanation": ""}
            continue
        if not current:
            continue
        option_match = __import__("re").match(r"^([A-E])\.\s+(.+)$", line)
        if option_match:
            current["options"].append(option_match.group(2).strip())
            continue
        answer_match = __import__("re").match(r"^Answer:\s*([A-E])\s*\|\s*Topic:\s*(.+)$", line, __import__("re").I)
        if answer_match:
            current["answerIndex"] = ord(answer_match.group(1).upper()) - ord("A")
            current_topic = answer_match.group(2).strip()
            continue
        explanation_match = __import__("re").match(r"^Explanation:\s*(.+)$", line, __import__("re").I)
        if explanation_match:
            current["explanation"] = explanation_match.group(1).strip()
    flush()
    return records

raw = parse_source()
audit = json.loads(AUDIT.read_text(encoding="utf-8"))
hold_ids = {hold["externalId"] for hold in audit["holds"] if hold["reason"] == "no safe official syllabus mapping"}
records = [record for record in raw if record["externalId"] in hold_ids]

client = OpenAI()
classified = []
for subject in OFFICIAL:
    subject_records = [record for record in records if record["subject"] == subject]
    for offset in range(0, len(subject_records), BATCH_SIZE):
        batch = subject_records[offset:offset + BATCH_SIZE]
        prompt = [{
            "externalId": record["externalId"],
            "suppliedTopic": record["suppliedTopic"],
            "question": record["question"],
        } for record in batch]
        response = client.chat.completions.create(
            model="gpt-5-mini",
            messages=[
                {"role": "system", "content": "You classify supplied JAMB question stems into the exact official syllabus area. Do not assess, change, or infer an answer key, option, fact, or explanation. Return one result for every given externalId. Choose topic only from the allowed list; use null and confidence hold if a precise mapping is genuinely impossible."},
                {"role": "user", "content": json.dumps({"subject": subject, "allowedOfficialAreas": OFFICIAL[subject], "records": prompt}, ensure_ascii=False)},
            ],
            max_completion_tokens=3000,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "jamb_topic_classification",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "results": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "externalId": {"type": "string"},
                                        "topic": {"type": "string", "enum": OFFICIAL[subject] + ["HOLD"]},
                                        "confidence": {"type": "string", "enum": ["high", "medium", "hold"]},
                                        "reason": {"type": "string"},
                                    },
                                    "required": ["externalId", "topic", "confidence", "reason"],
                                    "additionalProperties": False,
                                },
                            },
                        },
                        "required": ["results"],
                        "additionalProperties": False,
                    },
                },
            },
        )
        payload = json.loads(response.choices[0].message.content or "{}")
        by_id = {item.get("externalId"): item for item in payload.get("results", []) if isinstance(item, dict)}
        for record in batch:
            item = by_id.get(record["externalId"], {})
            topic = item.get("topic") if item.get("topic") in OFFICIAL[subject] else None
            confidence = item.get("confidence") if item.get("confidence") in {"high", "medium", "hold"} else "hold"
            classified.append({
                "externalId": record["externalId"],
                "subject": subject,
                "suggestedTopic": topic,
                "confidence": confidence if topic else "hold",
                "reason": str(item.get("reason", "invalid or missing classifier response")),
            })

report = {
    "input": len(records),
    "mapped": sum(1 for row in classified if row["suggestedTopic"]),
    "held": sum(1 for row in classified if not row["suggestedTopic"]),
    "records": classified,
}
OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({key: report[key] for key in ("input", "mapped", "held")}, indent=2))
