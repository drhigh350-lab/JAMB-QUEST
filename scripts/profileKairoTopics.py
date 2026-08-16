import json
from collections import Counter, defaultdict
from pathlib import Path
records = json.loads(Path('/home/ubuntu/jamb-import-staging/kairo_questions_aug16.json').read_text())['records']
for subject in ['BIO','CHEM','ENG','PHY']:
    counts = Counter(str(r.get('topic') or '').strip() for r in records if r.get('subject') == subject)
    print(subject, json.dumps({'distinct': len(counts), 'nonempty': sum(n for t,n in counts.items() if t), 'values': [{'topic': t, 'count': n} for t,n in counts.most_common(50) if t]}, ensure_ascii=False))
