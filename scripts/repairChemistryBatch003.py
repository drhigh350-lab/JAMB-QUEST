import json
from pathlib import Path

batch_number = 4
path = Path(f'/home/ubuntu/jamb-quiz-game/reports/chemistry_explanation_batch_{batch_number:03d}.json')
payload = json.loads(path.read_text(encoding='utf-8'))
for record in payload['records']:
    if record['externalId'] == 'chem-docx-122':
        record['explanation'] = ('Reaction rate increases when reactant particles collide more frequently and effectively.\n'
                                'Increasing hydrochloric acid concentration places more acid particles in each unit of volume.\n'
                                'This produces more collisions with the zinc surface per second and speeds hydrogen production.\n'
                                'Therefore, increasing the acid concentration is correct: option C.')
        record['explanationLineCount'] = 4
        record['explanationWordCount'] = len(record['explanation'].split())
        record['explanationStatus'] = 'candidate'
        record['explanationHoldReason'] = None
path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print({'repaired': 'chem-docx-122', 'lineCount': 4})
