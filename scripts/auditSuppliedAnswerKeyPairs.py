import ast
import json
from pathlib import Path

UPLOAD = Path('/home/ubuntu/upload')
PAIRS = {
    'english_2004': ('english_2004.py', 'english_2004_answers_p1.py'),
    'biology_2004': ('biology_2004.py', 'biology_2004_answers.py'),
    'chemistry_2021': ('chemistry_2021.py', 'chemistry_2021_answers.py'),
}

def assigned_values(path: Path):
    tree = ast.parse(path.read_text(encoding='utf-8'))
    values = {}
    for node in tree.body:
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    try:
                        values[target.id] = ast.literal_eval(node.value)
                    except Exception:
                        pass
    return values

def flatten(value):
    if isinstance(value, list):
        for item in value:
            yield from flatten(item)
    else:
        yield value

def question_records(value):
    return [item for item in flatten(value) if isinstance(item, dict) and ('num' in item or 'question' in item or 'stem' in item)]


def ast_question_records(path: Path):
    tree = ast.parse(path.read_text(encoding='utf-8'))
    records = []
    for node in tree.body:
        if not isinstance(node, ast.Assign) or not isinstance(node.value, ast.List):
            continue
        names = [target.id for target in node.targets if isinstance(target, ast.Name)]
        if not any(name in {'questions', 'question_bank', 'records'} for name in names):
            continue
        for element in node.value.elts:
            if not isinstance(element, ast.Dict):
                continue
            record = {}
            for key_node, value_node in zip(element.keys, element.values):
                if not isinstance(key_node, ast.Constant) or not isinstance(key_node.value, str):
                    continue
                key = key_node.value
                try:
                    record[key] = ast.literal_eval(value_node)
                except Exception:
                    record[key] = ast.unparse(value_node)
            if 'num' in record or 'stem' in record or 'options' in record:
                records.append(record)
    return records

def answer_records(value):
    if isinstance(value, dict):
        if all(str(k).isdigit() for k in value.keys()):
            records = []
            for key, item in value.items():
                if isinstance(item, dict):
                    records.append({'num': int(key), **item})
                else:
                    records.append({'num': int(key), 'answer': item})
            return records
        return [item for item in value.values() if isinstance(item, dict) and ('answer' in item or 'correct_answer' in item or 'correct' in item)]
    return [item for item in flatten(value) if isinstance(item, dict) and ('answer' in item or 'correct_answer' in item or 'correct' in item)]


def assignment_shapes(path: Path):
    tree = ast.parse(path.read_text(encoding='utf-8'))
    shapes = {}
    for node in tree.body:
        if isinstance(node, ast.Assign):
            shape = type(node.value).__name__
            for target in node.targets:
                if isinstance(target, ast.Name):
                    shapes[target.id] = shape
    return shapes

def main():
    report = {'pairs': {}}
    for label, (question_file, answer_file) in PAIRS.items():
        q_path = UPLOAD / question_file
        a_path = UPLOAD / answer_file
        q_values = assigned_values(q_path)
        a_values = assigned_values(a_path)
        q_records = max((question_records(v) for v in q_values.values()), key=len, default=[])
        if not q_records:
            q_records = ast_question_records(q_path)
        a_records = max((answer_records(v) for v in a_values.values()), key=len, default=[])
        q_numbers = [r.get('num', r.get('number', r.get('question'))) for r in q_records]
        a_numbers = [r.get('num', r.get('number', r.get('question'))) for r in a_records]
        answer_letters = [r.get('answer', r.get('correct_answer', r.get('correct'))) for r in a_records]
        report['pairs'][label] = {
            'questionFile': question_file,
            'answerFile': answer_file,
            'questionRecordCount': len(q_records),
            'answerRecordCount': len(a_records),
            'questionNumbers': q_numbers,
            'answerNumbers': a_numbers,
            'answerLetters': answer_letters,
            'questionNumberSetMatchesAnswerNumberSet': set(q_numbers) == set(a_numbers),
            'answerLettersValid': all(str(letter).strip().upper() in {'A','B','C','D','E'} for letter in answer_letters),
            'questionAssignments': assignment_shapes(q_path),
            'answerAssignments': assignment_shapes(a_path),
            'questionSample': q_records[:2],
            'answerSample': a_records[:4],
        }
    out = Path('/home/ubuntu/jamb-quiz-game/reports/supplied_answer_key_pair_audit.json')
    out.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2, ensure_ascii=False))

if __name__ == '__main__':
    main()
