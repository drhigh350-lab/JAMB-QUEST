import json
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from openai import OpenAI

INPUT = Path(os.environ.get("EXPLANATION_INPUT", "biology-explanation-pilot.input.json"))
OUTPUT = Path(os.environ.get("EXPLANATION_OUTPUT", "biology-explanation-pilot.output.json"))
MODEL = os.environ.get("EXPLANATION_MODEL", "gpt-5-mini")
WORKERS = max(1, int(os.environ.get("EXPLANATION_WORKERS", "5")))
client = OpenAI()

SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "biology_explanation",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "lines": {"type": "array", "items": {"type": "string"}, "minItems": 6, "maxItems": 6},
                "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
                "needs_review": {"type": "boolean"},
            },
            "required": ["lines", "confidence", "needs_review"],
            "additionalProperties": False,
        },
    },
}

def enrich(item):
    prompt = {
        "subject": item["subject"],
        "topic": item["topic"],
        "question": item["question"],
        "options": item["options"],
        "correct_answer": item["options"][item["answer_index"]],
        "current_explanation": item.get("explanation", ""),
    }
    result = None
    for attempt in range(3):
        try:
            request = {
                "model": MODEL,
                "messages": [
                    {"role": "system", "content": "You are a careful Nigerian senior-secondary teacher writing JAMB revision notes for the subject supplied in the question data. Output exactly six concise but meaningful sentences as six separate lines. Explain the concept tested, why the correct option is correct, and distinguish the most plausible alternatives when possible. Use only facts supported by standard senior-secondary knowledge for that subject and the question. Do not claim this is an official JAMB question. If the stem, answer key, diagram reference, or wording appears ambiguous or factually uncertain, set needs_review=true and explain the uncertainty rather than inventing a fact. Avoid generic study advice, repeated filler, source labels, and phrases such as 'this question tests your understanding'."},
                    {"role": "user", "content": json.dumps(prompt, ensure_ascii=False)},
                ],
                "response_format": SCHEMA,
            }
            if MODEL.startswith("gemini-"):
                request["max_tokens"] = 900
            elif MODEL.startswith("claude-"):
                request["max_tokens"] = 900
            else:
                request["max_completion_tokens"] = 900
                request["extra_body"] = {"reasoning": {"effort": "minimal"}}
            response = client.chat.completions.create(**request)
            content = response.choices[0].message.content if response.choices else None
            if content:
                result = json.loads(content)
                break
        except Exception:
            pass
        time.sleep(1.5 * (attempt + 1))
    if result is None:
        return {"id": item["id"], "subject": item["subject"], "topic": item["topic"], "question": item["question"], "answer_index": item["answer_index"], "answer_text": item["options"][item["answer_index"]], "original_explanation": item.get("explanation", ""), "lines": ["This record could not be safely enriched automatically."] * 6, "confidence": "low", "needs_review": True, "word_count": 0, "quality_gate": False}
    lines = [" ".join(line.split()).strip() for line in result["lines"]]
    joined = " ".join(lines).lower()
    generic = ["this question tests your understanding", "revisit", "before moving to the next question", "read the key wording"]
    result["lines"] = lines
    result["word_count"] = len(joined.split())
    result["quality_gate"] = len(lines) == 6 and result["word_count"] >= 75 and not any(phrase in joined for phrase in generic)
    if not result["quality_gate"]:
        result["needs_review"] = True
    return {"id": item["id"], "subject": item["subject"], "topic": item["topic"], "question": item["question"], "answer_index": item["answer_index"], "answer_text": item["options"][item["answer_index"]], "original_explanation": item.get("explanation", ""), **result}

items = json.loads(INPUT.read_text())
results = [None] * len(items)
with ThreadPoolExecutor(max_workers=WORKERS) as pool:
    futures = {pool.submit(enrich, item): index for index, item in enumerate(items)}
    for future in as_completed(futures):
        results[futures[future]] = future.result()
OUTPUT.write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"model": MODEL, "workers": WORKERS, "input": len(items), "output": len(results), "ready": sum(1 for result in results if result["quality_gate"] and not result["needs_review"]), "needs_review": sum(1 for result in results if result["needs_review"])}, indent=2))
