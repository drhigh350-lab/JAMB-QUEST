import json
import sys
from pathlib import Path

batch_number = int(sys.argv[1]) if len(sys.argv) > 1 else 1
parsed = {item['sourceId']: item for item in json.loads(Path('reports/biology_docx_parsed.json').read_text())['records']}
audit = {item['sourceId']: item for item in json.loads(Path('reports/biology_quality_audit.json').read_text())['details']}
generated = json.loads(Path(f'reports/biology_explanation_batch_{batch_number:03d}.json').read_text())
records = []
for item in generated['records']:
    source = parsed[item['sourceId']]
    quality = audit[item['sourceId']]
    if item['status'] != 'ready' or not quality['releaseCandidate']:
        continue
    answer_index = ord(source['answerLetter']) - ord('A')
    records.append({
        'externalId': source['sourceId'],
        'subject': 'Biology',
        'topic': quality['topic'],
        'difficulty': 'medium',
        'question': source['questionText'],
        'options': source['options'],
        'answerIndex': answer_index,
        'explanation': '\n'.join(item['lines']),
        'sourceLabel': f'Owner Biology DOCX · Uniform explanation batch {batch_number:03d}',
        'permissionNote': 'Owner-provided Biology past-question DOCX supplied for JAMB Quest processing; supplied wording and answer key preserved, explanation formatted for uniform learner clarity.',
    })
out = Path(f'reports/biology_explanation_batch_{batch_number:03d}_staged.json')
out.write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'stagedRecords': len(records), 'topics': sorted({r['topic'] for r in records})}))
