import json
from pathlib import Path

path = Path('/home/ubuntu/jamb-quiz-game/reports/chemistry_explanation_batch_003.json')
payload = json.loads(path.read_text(encoding='utf-8'))
for record in payload['records']:
    if record['externalId'] == 'chem-docx-097':
        record['explanation'] = ('A physical change alters form or physical properties without producing a new chemical substance.\n'
                                'Magnetization aligns domains in the iron rod but does not change iron into another compound.\n'
                                'Burning, rusting, and fermentation form new substances, so they are chemical changes.\n'
                                'Therefore, magnetization of an iron rod is the physical change: option C.')
        record['explanationLineCount'] = 4
        record['explanationWordCount'] = len(record['explanation'].split())
        record['explanationStatus'] = 'candidate'
        record['explanationHoldReason'] = None
path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print({'repaired': 'chem-docx-097', 'lineCount': 4})
