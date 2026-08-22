import csv, json, hashlib
from collections import Counter
from pathlib import Path

src = Path('/home/ubuntu/upload/questions_rows(3).csv')
out = Path('/home/ubuntu/jamb-quiz-game/reports/questions_rows3_profile.json')
with src.open('r', encoding='utf-8-sig', newline='') as f:
    rows = list(csv.DictReader(f))
fields = list(rows[0].keys()) if rows else []
subject_counts = Counter((r.get('subject') or '').strip() or '<missing>' for r in rows)
missing = {k: sum(1 for r in rows if not (r.get(k) or '').strip()) for k in fields}
def norm(s):
    return ' '.join((s or '').casefold().split())
keys = [norm(r.get('question')) for r in rows]
key_counts = Counter(keys)
internal_dupes = {k: v for k, v in key_counts.items() if k and v > 1}
ids = [norm(r.get('id') or r.get('question_id') or r.get('external_id')) for r in rows]
id_counts = Counter(i for i in ids if i)
profile = {
    'source': str(src), 'rowCount': len(rows), 'columns': fields,
    'subjectCounts': dict(subject_counts), 'missingByColumn': missing,
    'internalDuplicateQuestionCount': sum(v-1 for v in internal_dupes.values()),
    'internalDuplicateQuestionGroups': len(internal_dupes),
    'duplicateQuestionExamples': [{'question': k, 'count': v} for k,v in list(internal_dupes.items())[:20]],
    'duplicateIdCount': sum(v-1 for v in id_counts.values()),
    'duplicateIdGroups': sum(1 for v in id_counts.values() if v > 1),
    'sampleRows': rows[:3],
}
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(profile, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({k: profile[k] for k in ['rowCount','columns','subjectCounts','missingByColumn','internalDuplicateQuestionCount','duplicateIdCount']}, ensure_ascii=False, indent=2))
