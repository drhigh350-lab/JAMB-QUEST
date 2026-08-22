import csv,json,re
from collections import Counter
from pathlib import Path
src=Path('/home/ubuntu/upload/questions_rows(3).csv'); comp=json.loads(Path('/home/ubuntu/jamb-quiz-game/reports/questions_rows3_bank_comparison.json').read_text()); out=Path('/home/ubuntu/jamb-quiz-game/reports/questions_rows3_candidate_classification.json')
new_ids={x['csvId'] for x in comp['newExamples']}
# Recompute all unmatched IDs using bank stems.
def norm(s): return re.sub(r'\s+',' ',re.sub(r'[^\w\s]',' ',(s or '').casefold())).strip()
bank=json.loads(Path('/home/ubuntu/jamb-quiz-game/reports/jamb_quest_question_bank_aug17.json').read_text())['questions']
bank_keys={norm(q.get('question')) for q in bank}
raw_latex=re.compile(r'\\(?:frac|text|sqrt|times|pm|alpha|beta|leq|geq|rightarrow)|\$\$?|\\\(')
generic=re.compile(r'(?i)(the main skill tested|compare each option with the exact condition|for the topic|this question tests the concept)')
rows=list(csv.DictReader(src.open('r',encoding='utf-8-sig',newline='')))
new=[]; held=[]
for r in rows:
 if norm(r.get('stem')) in bank_keys: continue
 flags=[]; opts=None
 try: opts=json.loads(r.get('options') or '')
 except: flags.append('options_not_json')
 if not isinstance(opts,list) or len(opts)!=4: flags.append('options_not_four')
 if (r.get('correct_option') or '').strip().upper() not in {'A','B','C','D'}: flags.append('invalid_correct_option')
 if raw_latex.search((r.get('stem') or '')+' '+(r.get('explanation') or '')+' '+(r.get('options') or '')): flags.append('raw_latex')
 if generic.search(r.get('explanation') or ''): flags.append('generic_template')
 if r.get('subject')=='Mathematics': flags.append('unsupported_subject')
 rec={'id':r['id'],'subject':r['subject'],'topic':r['topic'],'flags':flags,'stem':r['stem']}
 (held if flags else new).append(rec)
result={'likelyNewRows':len(new)+len(held),'cleanNewCount':len(new),'heldNewCount':len(held),'cleanNewBySubject':dict(Counter(x['subject'] for x in new)),'heldNewByFlag':dict(Counter(f for x in held for f in x['flags'])),'heldExamples':held[:60]}
out.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8'); print(json.dumps(result,ensure_ascii=False,indent=2))
