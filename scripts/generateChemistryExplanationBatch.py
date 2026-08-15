import json
import concurrent.futures as cf
import re
import sys
from pathlib import Path
from openai import OpenAI

AUDIT = Path('/home/ubuntu/jamb-quiz-game/reports/chemistry_docx_audit.json')
BATCH_SIZE = 20
BATCH_NUMBER = int(sys.argv[1]) if len(sys.argv) > 1 else 1
OUT = Path(f'/home/ubuntu/jamb-quiz-game/reports/chemistry_explanation_batch_{BATCH_NUMBER:03d}.json')
client = OpenAI()

payload = json.loads(AUDIT.read_text(encoding='utf-8'))
candidates = [record for record in payload['records'] if record['status'] == 'candidate']
start = (BATCH_NUMBER - 1) * BATCH_SIZE
records = candidates[start:start + BATCH_SIZE]

schema = {
    'type': 'json_schema',
    'json_schema': {
        'name': 'chemistry_explanation',
        'strict': True,
        'schema': {
            'type': 'object',
            'properties': {'explanation': {'type': 'string'}},
            'required': ['explanation'],
            'additionalProperties': False,
        },
    },
}

def clean_lines(text):
    lines = [re.sub(r'^\s*(?:[-*•]\s*)?', '', line).strip() for line in text.splitlines()]
    return [line for line in lines if line]

def generate(record):
    options = '\n'.join(f'{chr(65+i)}. {option}' for i, option in enumerate(record['options']))
    prompt = f'''Create one accurate, learner-facing Chemistry explanation for this JAMB question.

Official syllabus topic: {record['mappedTopic']}
Question: {record['question']}
Options:
{options}
Correct answer: {record['answerKey']}. {record['options'][record['answerIndex']]}

Rules:
- Write exactly 4 concise non-empty lines, or at most 5 if a calculation needs one extra line.
- Use a uniform medium teaching style: state the governing principle, show the key reasoning or calculation, and connect it directly to the correct option.
- Do not use a heading, bullets, labels, generic praise, or mention AI/source verification.
- Do not change the answer or introduce facts not needed to justify it.
- Return only the explanation string.'''
    response = client.chat.completions.create(
        model='gpt-5-mini',
        messages=[
            {'role': 'system', 'content': 'You are a careful JAMB Chemistry editor. Accuracy is more important than speed.'},
            {'role': 'user', 'content': prompt},
        ],
        max_completion_tokens=300,
        response_format=schema,
    )
    data = json.loads(response.choices[0].message.content)
    lines = clean_lines(data['explanation'])
    valid = 4 <= len(lines) <= 5 and len(' '.join(lines).split()) >= 24
    return {**record, 'explanation': '\n'.join(lines), 'explanationLineCount': len(lines), 'explanationWordCount': len(' '.join(lines).split()), 'explanationStatus': 'candidate' if valid else 'hold', 'explanationHoldReason': None if valid else 'outside four-to-five-line or medium-length contract'}

with cf.ThreadPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(generate, records))

OUT.write_text(json.dumps({'batchNumber': BATCH_NUMBER, 'model': 'gpt-5-mini',
 'recordCount': len(results), 'records': results}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'batchNumber': BATCH_NUMBER, 'recordCount': len(results),
 'approvedForReview': sum(r['explanationStatus'] == 'candidate' for r in results), 'held': sum(r['explanationStatus'] == 'hold' for r in results)}))
