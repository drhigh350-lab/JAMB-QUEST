import json
from pathlib import Path
from collections import Counter

root = Path('/home/ubuntu/jamb-quiz-game/reports')
records = []
for path in sorted(root.glob('chemistry_explanation_batch_*.json')):
    if '_staged' in path.name:
        continue
    payload = json.loads(path.read_text(encoding='utf-8'))
    records.extend(payload.get('records', []))

seen = Counter(r.get('externalId') for r in records)
violations = []
for record in records:
    options = record.get('options') or []
    key = record.get('answerKey')
    key_index = ord(key) - ord('A') if isinstance(key, str) and len(key) == 1 else -1
    explanation = record.get('explanation') or ''
    lines = [line.strip() for line in explanation.splitlines() if line.strip()]
    if len(options) not in (4, 5):
        violations.append((record.get('externalId'), 'option-count'))
    if key_index < 0 or key_index >= len(options):
        violations.append((record.get('externalId'), 'answer-key-range'))
    if len(lines) > 5 or len(lines) < 4:
        violations.append((record.get('externalId'), f'explanation-lines:{len(lines)}'))
    if not record.get('mappedTopic'):
        violations.append((record.get('externalId'), 'missing-topic'))
    if record.get('explanationStatus') == 'hold':
        violations.append((record.get('externalId'), 'explanation-held'))
    if record.get('status') == 'hold':
        violations.append((record.get('externalId'), 'record-held'))

summary = {
    'processedCandidateRecords': len(records),
    'batches': len({r.get('batchNumber') for r in records}),
    'duplicateExternalIds': {k: v for k, v in seen.items() if v > 1},
    'explanationLineCounts': dict(sorted(Counter(len([line for line in (r.get('explanation') or '').splitlines() if line.strip()]) for r in records).items())),
    'topicCounts': dict(sorted(Counter(r.get('mappedTopic') for r in records).items())),
    'violationCount': len(violations),
    'violations': [{'externalId': ext, 'reason': reason} for ext, reason in violations],
}
(root / 'chemistry_processed_candidate_audit.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({k: summary[k] for k in ('processedCandidateRecords','batches','duplicateExternalIds','explanationLineCounts','violationCount')}, indent=2))
