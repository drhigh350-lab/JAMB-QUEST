import json
import re
import subprocess
from pathlib import Path

root = Path('/home/ubuntu/jamb-quiz-game/research_answer_key_sources')
patterns = {
    'answer_section': r'(?i)\b(answer key|answers|correct answers|solution[s]?|solutions)\b',
    'letter_sequence': r'(?i)(?:\b\d{1,3}\s*[-.:)]?\s*[A-E]\b){3,}',
    'option_marker': r'(?i)\b(?:ans|answer)\s*[:.-]?\s*[A-E]\b',
}
results = []
for pdf in sorted(root.glob('*.pdf')):
    txt = pdf.with_suffix('.txt')
    subprocess.run(['pdftotext', '-layout', str(pdf), str(txt)], check=True)
    text = txt.read_text(errors='ignore')
    pages = subprocess.check_output(['pdfinfo', str(pdf)], text=True)
    page_count = next((int(line.split(':', 1)[1].strip()) for line in pages.splitlines() if line.startswith('Pages:')), None)
    matches = {name: len(re.findall(pattern, text)) for name, pattern in patterns.items()}
    tail = text[-5000:]
    results.append({'file': pdf.name, 'pages': page_count, 'characters': len(text), 'matches': matches, 'tail': tail})
Path('/home/ubuntu/jamb-quiz-game/reports/downloaded_answer_key_candidate_audit.json').write_text(json.dumps({'files': results}, indent=2, ensure_ascii=False) + '\n')
for row in results:
    print(json.dumps({k: row[k] for k in ('file', 'pages', 'characters', 'matches')}))
