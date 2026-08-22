import csv, json, re
from collections import Counter
from pathlib import Path

src = Path('/home/ubuntu/upload/questions_rows(3).csv')
bank_path = Path('/home/ubuntu/jamb-quiz-game/reports/jamb_quest_question_bank_aug17.json')
out = Path('/home/ubuntu/jamb-quiz-game/reports/questions_rows3_bank_comparison.json')

def norm(s):
    s = (s or '').casefold().replace('’', "'")
    return re.sub(r'\s+', ' ', re.sub(r'[^\w\s]', ' ', s, flags=re.UNICODE)).strip()
with src.open('r', encoding='utf-8-sig', newline='') as f:
    rows = list(csv.DictReader(f))
bank = json.loads(bank_path.read_text(encoding='utf-8'))
questions = bank.get('questions', [])
bank_by_question = {}
for q in questions:
    k = norm(q.get('question'))
    if k: bank_by_question.setdefault(k, []).append(q)
bank_subject = Counter(q.get('subject','') for q in questions)
matched=[]; new=[]; ambiguous=[]
for r in rows:
    k = norm(r.get('stem'))
    hits = bank_by_question.get(k, [])
    if len(hits) == 1: matched.append({'csvId':r['id'],'bankId':hits[0].get('id'),'subject':r['subject']})
    elif len(hits) > 1: ambiguous.append({'csvId':r['id'],'subject':r['subject'],'matches':[h.get('id') for h in hits]})
    else: new.append({'csvId':r['id'],'subject':r['subject'],'topic':r.get('topic'),'stem':r.get('stem')})
new_subject = Counter(x['subject'] for x in new)
comparison = {
 'csvRows':len(rows),'bankTotal':len(questions),'exactStemMatches':len(matched),'ambiguousStemMatches':len(ambiguous),'unmatchedLikelyNew':len(new),
 'newBySubject':dict(new_subject),'bankBySubject':dict(bank_subject),
 'matchedExamples':matched[:20],'ambiguousExamples':ambiguous[:20],'newExamples':new[:20]
}
out.write_text(json.dumps(comparison, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(comparison, ensure_ascii=False, indent=2))
