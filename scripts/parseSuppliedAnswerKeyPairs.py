import ast
import json
from pathlib import Path

UPLOAD = Path('/home/ubuntu/upload')
OUT = Path('/home/ubuntu/jamb-import-staging/supplied_answer_key_pairs_aug16.json')
PAIRS = {
    'Use of English': ('english_2004.py', 'english_2004_answers_p1.py', '2004'),
    'Biology': ('biology_2004.py', 'biology_2004_answers.py', '2004'),
    'Chemistry': ('chemistry_2021.py', 'chemistry_2021_answers.py', '2021'),
}

class SafeEval:
    def __init__(self, tree):
        self.tree = tree
        self.env = {}
        self.evaluate_assignments()

    def eval(self, node):
        if isinstance(node, ast.Constant):
            return node.value
        if isinstance(node, ast.Name):
            if node.id not in self.env:
                raise ValueError(f'unknown name: {node.id}')
            return self.env[node.id]
        if isinstance(node, ast.List):
            return [self.eval(x) for x in node.elts]
        if isinstance(node, ast.Tuple):
            return tuple(self.eval(x) for x in node.elts)
        if isinstance(node, ast.Dict):
            return {self.eval(k): self.eval(v) for k, v in zip(node.keys, node.values)}
        if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):
            return self.eval(node.left) + self.eval(node.right)
        raise ValueError(f'unsupported expression: {type(node).__name__}')

    def evaluate_assignments(self):
        pending = [node for node in self.tree.body if isinstance(node, ast.Assign)]
        for _ in range(len(pending) + 2):
            progressed = False
            for node in pending:
                try:
                    value = self.eval(node.value)
                except ValueError:
                    continue
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        self.env[target.id] = value
                        progressed = True
            if not pending or not progressed:
                break


def parse(path):
    tree = ast.parse(path.read_text(encoding='utf-8'))
    evaluator = SafeEval(tree)
    return evaluator.env


def find_question_list(env):
    candidates = [value for name, value in env.items() if name in {'questions', 'question_bank', 'records'} and isinstance(value, list)]
    return max(candidates, key=len, default=[])


def find_answer_dict(env):
    candidates = [value for name, value in env.items() if name in {'answers', 'answer_key', 'key'} and isinstance(value, dict)]
    return max(candidates, key=len, default={})


def main():
    records = []
    audit = {'subjects': {}, 'holds': []}
    for subject, (question_name, answer_name, year) in PAIRS.items():
        questions = find_question_list(parse(UPLOAD / question_name))
        answers = find_answer_dict(parse(UPLOAD / answer_name))
        subject_records = []
        for question in questions:
            if not isinstance(question, dict) or 'num' not in question:
                continue
            number = int(question['num'])
            key = answers.get(str(number), answers.get(number))
            if not isinstance(key, dict) or not isinstance(key.get('answer'), str):
                continue
            options = question.get('options')
            if not isinstance(options, dict):
                audit['holds'].append({'subject': subject, 'number': number, 'reason': 'missing options dictionary'})
                continue
            option_values = [options[label] for label in sorted(options) if label in {'A','B','C','D','E'}]
            subject_records.append({
                'subject': subject,
                'year': year,
                'sourceQuestionNumber': number,
                'question': str(question.get('stem', '')).strip(),
                'options': [str(value).strip() for value in option_values],
                'answerLetter': key['answer'].strip().upper(),
                'tag': str(key.get('tag', '')).strip(),
                'explanation': str(key.get('explanation', '')).strip(),
                'questionFile': question_name,
                'answerFile': answer_name,
            })
        audit['subjects'][subject] = {'questionCount': len(questions), 'answerCount': len(answers), 'joinedCount': len(subject_records)}
        records.extend(subject_records)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'records': records, 'audit': audit}, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps({'records': len(records), 'audit': audit}, indent=2, ensure_ascii=False))

if __name__ == '__main__':
    main()
