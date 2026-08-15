import json
from collections import Counter
from pathlib import Path

source = Path('/home/ubuntu/jamb-quiz-game/reports/chemistry_docx_audit.json')
out = Path('/home/ubuntu/jamb-quiz-game/reports/chemistry_held_records_summary.json')
payload = json.loads(source.read_text(encoding='utf-8'))
holds = [record for record in payload['records'] if record['status'] == 'hold']
reason_counts = Counter()
for record in holds:
    reasons = []
    if record.get('structuralReason'):
        reasons.append(record['structuralReason'])
    if record.get('duplicateWithin'):
        reasons.append('duplicate within supplied document')
    if record.get('duplicateStored'):
        reasons.append('duplicate against stored Chemistry bank')
    if not record.get('mappedTopic'):
        reasons.append('no official Chemistry syllabus mapping')
    for reason in reasons or ['unspecified hold']:
        reason_counts[reason] += 1
summary = {
    'totalHeld': len(holds),
    'reasonCounts': dict(sorted(reason_counts.items())),
    'unmappedRecords': [
        {'externalId': r['externalId'], 'sourceNumber': r['sourceNumber'], 'question': r['question']}
        for r in holds if not r.get('mappedTopic')
    ],
    'duplicateRecords': [
        {'externalId': r['externalId'], 'sourceNumber': r['sourceNumber'], 'question': r['question'], 'duplicateWithin': r.get('duplicateWithin'), 'duplicateStored': r.get('duplicateStored')}
        for r in holds if r.get('duplicateWithin') or r.get('duplicateStored')
    ],
}
out.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'totalHeld': summary['totalHeld'], 'reasonCounts': summary['reasonCounts'], 'unmapped': len(summary['unmappedRecords']), 'duplicates': len(summary['duplicateRecords'])}, indent=2))
