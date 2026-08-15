import json
import sys
from pathlib import Path

batch_number = int(sys.argv[1]) if len(sys.argv) > 1 else 1
source = Path(f'/home/ubuntu/jamb-quiz-game/reports/chemistry_explanation_batch_{batch_number:03d}.json')
out = Path(f'/home/ubuntu/jamb-quiz-game/reports/chemistry_explanation_batch_{batch_number:03d}_staged.json')
payload = json.loads(source.read_text(encoding='utf-8'))
records = []
for record in payload['records']:
    if record['explanationStatus'] != 'candidate' or not record['mappedTopic']:
        continue
    records.append({
        'externalId': record['externalId'],
        'subject': 'Chemistry',
        'topic': record['mappedTopic'],
        'difficulty': 'medium',
        'question': record['question'],
        'options': record['options'],
        'answerIndex': record['answerIndex'],
        'explanation': record['explanation'],
        'sourceLabel': f'Owner Chemistry DOCX · Uniform explanation batch {batch_number:03d}',
        'permissionNote': 'Owner-provided Chemistry past-question DOCX supplied for JAMB Quest processing; wording and answer key preserved, explanation edited for uniform learner clarity.',
    })
out.write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'stagedRecords': len(records), 'topics': sorted({r['topic'] for r in records})}))
