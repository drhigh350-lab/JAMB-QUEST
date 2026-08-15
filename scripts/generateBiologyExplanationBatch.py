import json
import os
import time
from pathlib import Path
from openai import OpenAI

batch = int(os.environ.get('BIOLOGY_EXPLANATION_BATCH', '1'))
size = int(os.environ.get('BIOLOGY_EXPLANATION_BATCH_SIZE', '20'))
parsed = json.loads(Path('reports/biology_docx_parsed.json').read_text())
audit = json.loads(Path('reports/biology_quality_audit.json').read_text())
by_id = {item['sourceId']: item for item in parsed['records']}
eligible = [item for item in audit['details'] if item['releaseCandidate']]
selected = eligible[(batch - 1) * size: batch * size]
if not selected:
    raise SystemExit(f'No Biology candidates for batch {batch}')
client = OpenAI()
results = []
for position, audit_item in enumerate(selected, start=1):
    item = by_id[audit_item['sourceId']]
    prompt = {
        'question': item['questionText'],
        'options': item['options'],
        'answer': item['answerLetter'],
        'answer_text': item['answerText'],
        'source_explanation': item['explanation'],
        'syllabus_topic': audit_item['topic'],
    }
    content = None
    last_error = None
    for _attempt in range(3):
        try:
            response = client.chat.completions.create(
                model='gpt-5-mini',
                messages=[
                    {'role': 'system', 'content': 'You are a careful JAMB Biology teacher. Output JSON only. Preserve the supplied answer key. Write exactly four concise, natural, student-facing explanation lines. Each line must add a distinct point: identify the concept, explain why the keyed option is correct, reject the closest alternative or misconception, and state the exam takeaway. Do not invent facts beyond the question and source explanation. Do not use headings, bullets, numbering, or line breaks inside a line.'},
                    {'role': 'user', 'content': json.dumps(prompt, ensure_ascii=False)},
                ],
                max_completion_tokens=700,
                response_format={
                    'type': 'json_schema',
                    'json_schema': {
                        'name': 'biology_explanation',
                        'strict': True,
                        'schema': {
                            'type': 'object',
                            'properties': {
                                'lines': {'type': 'array', 'items': {'type': 'string'}, 'minItems': 4, 'maxItems': 4},
                            },
                            'required': ['lines'],
                            'additionalProperties': False,
                        },
                    },
                },
            )
            content = response.choices[0].message.content if response.choices else None
            if content:
                break
            last_error = 'empty structured response'
        except Exception as exc:
            last_error = str(exc)
        time.sleep(2)
    if not content:
        results.append({
            'position': position,
            'sourceId': item['sourceId'],
            'sourceNumber': item['sourceNumber'],
            'topic': audit_item['topic'],
            'answerLetter': item['answerLetter'],
            'lines': [],
            'lineCount': 0,
            'status': 'hold',
            'holdReason': f'model-response-failure: {last_error}',
        })
        continue
    try:
        data = json.loads(content)
        lines = [line.strip().replace('\n', ' ') for line in data['lines']]
    except Exception as exc:
        lines = []
        last_error = str(exc)
    valid = len(lines) == 4 and all(8 <= len(line.split()) <= 50 for line in lines)
    results.append({
        'position': position,
        'sourceId': item['sourceId'],
        'sourceNumber': item['sourceNumber'],
        'topic': audit_item['topic'],
        'answerLetter': item['answerLetter'],
        'lines': lines,
        'lineCount': len(lines),
        'status': 'ready' if valid else 'hold',
        'holdReason': None if valid else (f'parse-failure: {last_error}' if not lines else 'line-count-or-length-contract'),
    })
output = Path(f'reports/biology_explanation_batch_{batch:03d}.json')
output.write_text(json.dumps({'batch': batch, 'sourceCount': len(selected), 'readyCount': sum(item['status'] == 'ready' for item in results), 'holdCount': sum(item['status'] == 'hold' for item in results), 'records': results}, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({'batch': batch, 'selectedCount': len(selected), 'readyCount': sum(item['status'] == 'ready' for item in results), 'holdCount': sum(item['status'] == 'hold' for item in results), 'output': str(output)}, indent=2))
