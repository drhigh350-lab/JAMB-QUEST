import csv, json, re
from pathlib import Path
src=Path('/home/ubuntu/upload/questions_rows(3).csv'); bank_path=Path('/home/ubuntu/jamb-quiz-game/reports/jamb_quest_question_bank_aug17.json'); out=Path('/home/ubuntu/jamb-quiz-game/reports/questions_rows3_clean_supported_payload.json')
def norm(s): return re.sub(r'\s+',' ',re.sub(r'[^\w\s]',' ',(s or '').casefold())).strip()
bank=json.loads(bank_path.read_text(encoding='utf-8'))['questions']; bank_keys={norm(q.get('question')) for q in bank}
raw_latex=re.compile(r'\\(?:frac|text|sqrt|times|pm|alpha|beta|leq|geq|rightarrow)|\$\$?|\\\(')
generic=re.compile(r'(?i)(the main skill tested|compare each option with the exact condition|for the topic|this question tests the concept)')
rows=list(csv.DictReader(src.open('r',encoding='utf-8-sig',newline='')))
allowed={'Biology','Chemistry','Physics','Use of English'}; clean=[]; held=[]
for r in rows:
    flags=[]; subject=(r.get('subject') or '').strip(); stem=(r.get('stem') or '').strip(); exp=(r.get('explanation') or '').strip()
    try: opts=json.loads(r.get('options') or '')
    except: opts=None; flags.append('options_not_json')
    if norm(stem) in bank_keys: flags.append('already_in_bank')
    if subject not in allowed: flags.append('unsupported_subject')
    if isinstance(opts,list) and opts and isinstance(opts[0],dict): opts=[str(x.get('text','')).strip() for x in opts]
    if not isinstance(opts,list) or len(opts)!=4: flags.append('options_not_four')
    if isinstance(opts,list) and any(not str(x).strip() for x in opts): flags.append('blank_option')
    answer=(r.get('correct_option') or '').strip().upper()
    if answer not in {'A','B','C','D'}: flags.append('invalid_correct_option')
    if raw_latex.search(stem+' '+exp+' '+(r.get('options') or '')): flags.append('raw_latex')
    if generic.search(exp): flags.append('generic_template')
    rec={'id':r['id'],'subject':subject,'topic':(r.get('topic') or '').strip(),'difficulty':{'easy':'easy','medium':'medium','hard':'hard'}.get((r.get('difficulty_rating') or '').strip().lower(),'medium'),'question':stem,'options':opts if isinstance(opts,list) else [],'answerIndex':'ABCD'.find(answer),'explanation':exp,'flags':flags}
    (clean if not flags else held).append(rec)
payload=[{k:v for k,v in x.items() if k!='flags'} for x in clean]
report={'source':str(src),'candidateCount':len(payload),'heldCount':len(held),'candidateBySubject':{},'heldByReason':{},'heldExamples':held[:100]}
for x in clean: report['candidateBySubject'][x['subject']]=report['candidateBySubject'].get(x['subject'],0)+1
for x in held:
 for f in x['flags']: report['heldByReason'][f]=report['heldByReason'].get(f,0)+1
out.write_text(json.dumps({'records':payload,'report':report},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
