import json
import re
from pathlib import Path

source = Path('/home/ubuntu/jamb-quiz-game/reports/chemistry_docx_audit.json')
out = Path('/home/ubuntu/jamb-quiz-game/reports/chemistry_held_topic_suggestions.json')
payload = json.loads(source.read_text(encoding='utf-8'))
patterns = [
    (r'pressure.*half|volume.*pressure|boyle|charles|gas law|gas volume', 'Kinetic theory of matter and gases'),
    (r'ionization energy|noble gas|electron|sub-?level|l shell|periodic table|orbit', 'Atomic structure and bonding'),
    (r'fusion|fission|radioactive|isotope|nuclear|half life', 'Nuclear chemistry'),
    (r'hardness of water|drying agent|distillation|filtration|chromatography|sublimation|decantation|coffee stain', 'Separation of mixtures'),
    (r'solubility|soluble|slightly soluble|crystall|cuso4', 'Solubility'),
    (r'acid|base|salt|methyl orange|neutraliz|ph |rust', 'Acids, bases and salts'),
    (r'reducing agent|oxidizing agent|oxidation state|redox|corrosion', 'Oxidation and reduction'),
    (r'electrolys|deposited|faraday|current.*solution|electrode', 'Electrolysis'),
    (r'entropy|exothermic|endothermic|enthalpy|heat of|energy change', 'Energy changes'),
    (r'rate of reaction|catalyst|collision frequency|equilibrium constant|le chatelier|dynamic equilibrium', 'Rates of reaction'),
    (r'alkane|alkene|alkyne|benzene|hydrocarbon|alcohol|ester|organic|petroleum|combustion|iupac|methane|ethene', 'Organic compounds'),
    (r'iron|aluminium|copper|metal|ore|extraction|steel|alloy|corrosion protection', 'Metals and their compounds'),
    (r'oxygen|chlorine|ammonia|sulphur|nitrogen|non-metal|carbon monoxide', 'Non-metals and their compounds'),
    (r'fertilizer|cement|glass|soap|detergent|industry|industrial|urea', 'Chemistry and industry'),
]
held = [r for r in payload['records'] if r['status'] == 'hold' and not r.get('mappedTopic') and not (r.get('duplicateWithin') or r.get('duplicateStored'))]
suggestions = []
for record in held:
    text = record['question'].lower()
    matches = [topic for pattern, topic in patterns if re.search(pattern, text)]
    unique = list(dict.fromkeys(matches))
    suggestions.append({
        'externalId': record['externalId'],
        'sourceNumber': record['sourceNumber'],
        'question': record['question'],
        'suggestedTopic': unique[0] if len(unique) == 1 else None,
        'confidence': 'high' if len(unique) == 1 else 'held',
        'candidateTopics': unique,
    })
summary = {
    'heldUnmappedReviewed': len(held),
    'highConfidenceSuggestions': sum(1 for r in suggestions if r['confidence'] == 'high'),
    'stillHeld': sum(1 for r in suggestions if r['confidence'] == 'held'),
    'records': suggestions,
}
out.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({k: summary[k] for k in ('heldUnmappedReviewed','highConfidenceSuggestions','stillHeld')}, indent=2))
