import csv, json, re
from collections import Counter
from pathlib import Path
src=Path('/home/ubuntu/upload/questions_rows(3).csv')
out=Path('/home/ubuntu/jamb-quiz-game/reports/questions_rows3_quality_gate.json')
with src.open('r',encoding='utf-8-sig',newline='') as f: rows=list(csv.DictReader(f))
raw_latex=re.compile(r'\\(?:frac|text|sqrt|times|pm|alpha|beta|leq|geq|rightarrow)|\$\$?|\\\(')
generic=re.compile(r'(?i)(the main skill tested|compare each option with the exact condition|for the topic|this question tests the concept)')
issues=[]; clean=[]
for r in rows:
    flags=[]
    stem=(r.get('stem') or '').strip(); exp=(r.get('explanation') or '').strip(); subj=(r.get('subject') or '').strip()
    try: opts=json.loads(r.get('options') or '')
    except Exception: opts=None; flags.append('options_not_json')
    if not stem: flags.append('missing_stem')
    if not exp: flags.append('missing_explanation')
    if not isinstance(opts,list) or len(opts)!=4: flags.append('options_not_four')
    elif any(not str(x).strip() for x in opts): flags.append('blank_option')
    ans=(r.get('correct_option') or '').strip().upper()
    if ans not in {'A','B','C','D'}: flags.append('invalid_correct_option')
    if raw_latex.search(stem+' '+exp+' '+(r.get('options') or '')): flags.append('raw_latex')
    if generic.search(exp): flags.append('generic_template')
    if subj=='Mathematics': flags.append('unsupported_subject')
    rec={'id':r.get('id'),'subject':subj,'topic':r.get('topic'),'flags':flags,'stem':stem}
    if flags: issues.append(rec)
    else: clean.append(r.get('id'))
summary={'rowCount':len(rows),'cleanCount':len(clean),'flaggedCount':len(issues),'flagsByType':dict(Counter(f for x in issues for f in x['flags'])),'cleanBySubject':dict(Counter(r.get('subject') for r in rows if r.get('id') in set(clean))),'flaggedExamples':issues[:100]}
out.parent.mkdir(parents=True,exist_ok=True); out.write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False,indent=2))
