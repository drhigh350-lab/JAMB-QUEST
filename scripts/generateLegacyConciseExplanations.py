import json
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import requests

batch_number = int(os.environ.get('LEGACY_EXPLANATION_BATCH', '1'))
root = Path('/home/ubuntu/jamb-quiz-game/reports')
input_path = root / f'legacy_explanation_batch_{batch_number:03d}_input.json'
output_path = root / f'legacy_explanation_batch_{batch_number:03d}_output.json'
payload = json.loads(input_path.read_text(encoding='utf-8'))
base = os.environ['OPENAI_API_BASE'].rstrip('/')
headers = {'Authorization': f"Bearer {os.environ['OPENAI_API_KEY']}", 'Content-Type': 'application/json'}
schema = {'type': 'json_schema', 'json_schema': {'name': 'concise_explanation', 'strict': True, 'schema': {'type': 'object', 'properties': {'explanation': {'type': 'string'}}, 'required': ['explanation'], 'additionalProperties': False}}}

def generate_one(position, item):
    prompt = f'''Create an answer-safe JAMB {item['subject']} explanation using exactly FOUR newline-separated lines. Preserve the provided correct answer and explain only why it is correct. Do not add a heading, numbering, option labels beyond the final answer reference, unsupported facts, or discussion of other choices. Use clear student-friendly English.\nTopic: {item['topic']}\nQuestion: {item['question']}\nOptions: {json.dumps(item['options'], ensure_ascii=False)}\nCorrect answer index: {item['answerIndex']}\nCorrect answer text: {item['answerText']}\nOriginal source explanation: {item['originalExplanation']}'''
    request = {'model': 'gpt-5-mini', 'messages': [{'role': 'system', 'content': 'You are a precise JAMB editor. Return only valid JSON.'}, {'role': 'user', 'content': prompt}], 'response_format': schema, 'max_completion_tokens': 500}
    last_error = None
    for _attempt in range(3):
        try:
            response = requests.post(f'{base}/chat/completions', headers=headers, json=request, timeout=90)
            response.raise_for_status()
            data = response.json()
            content = data.get('choices', [{}])[0].get('message', {}).get('content')
            if not content:
                raise RuntimeError(f"empty model response: {data.get('error', 'unknown error')}")
            generated = json.loads(content)['explanation'].strip()
            lines = [line.strip() for line in generated.splitlines() if line.strip()]
            status = 'ready' if len(lines) == 4 and 28 <= len(generated.split()) <= 110 else 'hold'
            return position, {'id': item['id'], 'sourceLabel': item['sourceLabel'], 'explanation': generated, 'lineCount': len(lines), 'wordCount': len(generated.split()), 'status': status, 'holdReason': None if status == 'ready' else 'line-count-or-word-count-contract'}
        except Exception as exc:
            last_error = str(exc)
            time.sleep(2)
    return position, {'id': item['id'], 'sourceLabel': item['sourceLabel'], 'explanation': '', 'lineCount': 0, 'wordCount': 0, 'status': 'hold', 'holdReason': f'model-response-failure: {last_error}'}

records_by_position = {}
with ThreadPoolExecutor(max_workers=4) as executor:
    futures = [executor.submit(generate_one, position, item) for position, item in enumerate(payload['records'], start=1)]
    for future in as_completed(futures):
        position, record = future.result()
        records_by_position[position] = record
        print(json.dumps({'position': position, 'id': record['id'], 'status': record['status'], 'lineCount': record['lineCount']}))
records = [records_by_position[position] for position in sorted(records_by_position)]
result = {'batchNumber': batch_number, 'inputCount': len(payload['records']), 'readyCount': sum(record['status'] == 'ready' for record in records), 'holdCount': sum(record['status'] != 'ready' for record in records), 'records': records}
output_path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'output': str(output_path), 'readyCount': result['readyCount'], 'holdCount': result['holdCount']}))
