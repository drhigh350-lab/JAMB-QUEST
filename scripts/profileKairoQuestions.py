import json
import re
from collections import Counter
from pathlib import Path

records = json.loads(Path('/home/ubuntu/jamb-import-staging/kairo_questions_aug16.json').read_text())['records']

def clean(v):
    return re.sub(r'\s+', ' ', str(v or '')).strip()

def stem(v):
    return re.sub(r'[^a-z0-9]+', ' ', clean(v).lower()).strip()

summary = {}
for subject in sorted({r.get('subject') for r in records}):
    rows = [r for r in records if r.get('subject') == subject]
    option_counts = Counter(sum(bool(clean(r.get(k))) for k in ['option_a','option_b','option_c','option_d','option_e']) for r in rows)
    answer_values = Counter(clean(r.get('correct_answer')).upper() for r in rows)
    missing = {field: sum(not clean(r.get(field)) for r in rows) for field in ['question','option_a','option_b','option_c','option_d','correct_answer','explanation','topic']}
    valid_answer = sum(clean(r.get('correct_answer')).upper() in {'A','B','C','D','E'} for r in rows)
    valid_options = sum(4 <= sum(bool(clean(r.get(k))) for k in ['option_a','option_b','option_c','option_d','option_e']) <= 5 for r in rows)
    summary[subject] = {'rows': len(rows), 'option_counts': dict(option_counts), 'missing': missing, 'valid_answer': valid_answer, 'valid_option_count': valid_options}
all_stems = Counter((r.get('subject'), stem(r.get('question'))) for r in records if stem(r.get('question')))
internal_dupes = sum(count - 1 for count in all_stems.values() if count > 1)
print(json.dumps({'total': len(records), 'summary': summary, 'internal_duplicate_rows': internal_dupes}, indent=2))
