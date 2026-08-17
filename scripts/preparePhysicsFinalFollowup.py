import json
from pathlib import Path

INPUTS = [Path(f"/home/ubuntu/upload/pasted_content_{i}.txt") for i in range(6, 11)]
OUT = Path("/home/ubuntu/jamb-import-staging/physics_final_followup_candidates.json")
AUDIT = Path("/home/ubuntu/jamb-quiz-game/reports/physics_final_followup_profile.json")
OFFICIAL = {
    "Measurements and units", "Motion", "Gravitational field", "Equilibrium of forces", "Work, energy and power", "Machines", "Elasticity", "Pressure", "Liquids at rest", "Temperature and measurement", "Quantity of heat", "Change of state", "Thermal expansion", "Gas laws", "Vapours", "Structure of matter and kinetic theory", "Heat transfer", "Waves", "Propagation of sound", "Characteristics of sound", "Light energy", "Reflection", "Refraction", "Optical instruments", "Dispersion and colours", "Electrostatics", "Capacitors", "Electric cells", "Current electricity", "Electrical energy and power", "Magnets and magnetic fields", "Force on a current-carrying conductor", "Electromagnetic induction", "AC circuits", "Conduction of electricity", "Modern physics", "Introductory electronics", "Fibre optics and lasers"
}

def topic(label: str):
    s = label.lower()
    if "measurement" in s or "si unit" in s or "vector" in s or "scalar" in s: return "Measurements and units"
    if "newton" in s or "kinematic" in s or "projectile" in s or "free fall" in s or "inertia" in s or "momentum" in s or "circular" in s or "simple harmonic" in s: return "Motion"
    if "work" in s or "energy" in s or "impulse" in s: return "Work, energy and power"
    if "equilibrium" in s: return "Equilibrium of forces"
    if "machine" in s: return "Machines"
    if "elastic" in s or "stress" in s: return "Elasticity"
    if "pressure" in s or "barometer" in s: return "Pressure"
    if "temperature" in s or "specific heat" in s: return "Temperature and measurement" if "scale" in s or "temperature" in s else "Quantity of heat"
    if "latent" in s or "calor" in s: return "Quantity of heat"
    if "change of state" in s: return "Change of state"
    if "gas law" in s or "humidity" in s: return "Gas laws"
    if "heat transfer" in s: return "Heat transfer"
    if "sound" in s: return "Characteristics of sound"
    if "wave" in s: return "Waves"
    if "mirror" in s or "reflection" in s: return "Reflection"
    if "refraction" in s or "refractive" in s or "total internal" in s: return "Refraction"
    if "lens" in s: return "Optical instruments"
    if "dispersion" in s or "rainbow" in s: return "Dispersion and colours"
    if "capac" in s: return "Capacitors"
    if "electrostatic" in s or "electric field" in s or "potential" in s or "charge" in s: return "Electrostatics"
    if "current" in s or "ohm" in s or "resistance" in s or "electrical" in s or "rectif" in s or "fuse" in s: return "Current electricity"
    if "transform" in s or "induct" in s: return "Electromagnetic induction"
    if "magnet" in s: return "Magnets and magnetic fields"
    if "semiconductor" in s or "electronics" in s or "doping" in s: return "Introductory electronics"
    if "nuclear" in s or "quantum" in s or "atomic" in s or "photoelectric" in s or "thermionic" in s: return "Modern physics"
    if "gravitation" in s or "gravity" in s: return "Gravitational field"
    if "fluid" in s or "molecular" in s: return None
    return None

def load_tolerant(path: Path):
    raw = path.read_text()
    try:
        return json.loads(raw), 0
    except json.JSONDecodeError:
        import re
        items = []
        malformed = 0
        chunks = re.findall(r"\{.*?(?=\n  \},?\n  \{|\n  \]$)", raw, flags=re.S)
        for chunk in chunks:
            candidate = chunk.strip().rstrip(",") + "}"
            try:
                items.append(json.loads(candidate))
            except json.JSONDecodeError:
                malformed += 1
        return items, malformed

rows = []
holds = []
for path in INPUTS:
    data, malformed = load_tolerant(path)
    for i, item in enumerate(data):
        options = [item.get(f"option_{c}") for c in "abcd"]
        answer = str(item.get("answer", "")).strip().upper()
        explanation = str(item.get("explanation", "")).strip()
        raw_topic = str(item.get("topic", ""))
        resolved = topic(raw_topic)
        external = f"{path.name}:{item.get('source_url') or 'record'}:{i + 1}"
        reason = None
        if len(options) != 4 or any(not isinstance(x, str) or not x.strip() for x in options): reason = "incomplete four-option record"
        elif answer not in "ABCD": reason = "invalid answer marker"
        elif "wait" in explanation.lower() or "i'll correct" in explanation.lower() or "not shown" in explanation.lower() or "typical values" in explanation.lower(): reason = "contradictory or assumption-based explanation"
        elif resolved not in OFFICIAL: reason = "topic does not resolve to one official Physics syllabus area"
        if reason:
            holds.append({"externalId": external, "reason": reason, "topic": raw_topic})
            continue
        rows.append({"externalId": external, "subject": "Physics", "topic": resolved, "difficulty": "medium", "question": str(item.get("question", "")).strip(), "options": options, "answerIndex": "ABCD".index(answer), "explanation": explanation, "sourceLabel": f"Owner-provided final Physics attachments · {path.name}", "permissionNote": f"Owner-provided final Physics attachment {path.name}; supplied answer key and explanation preserved; source URL retained in original attachment metadata."})

OUT.write_text(json.dumps(rows, indent=2) + "\n")
parsed_total = sum(len(load_tolerant(p)[0]) for p in INPUTS)
malformed_total = sum(load_tolerant(p)[1] for p in INPUTS)
AUDIT.write_text(json.dumps({"inputFiles": [p.name for p in INPUTS], "parsed": parsed_total, "malformedFragments": malformed_total, "candidates": len(rows), "held": len(holds), "holds": holds}, indent=2) + "\n")
print(json.dumps({"parsed": parsed_total, "malformedFragments": malformed_total, "candidates": len(rows), "held": len(holds), "holdReasons": {r: sum(1 for h in holds if h['reason'] == r) for r in sorted({h['reason'] for h in holds})}}, indent=2))
