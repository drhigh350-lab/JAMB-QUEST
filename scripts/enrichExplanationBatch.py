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
STYLE_REFERENCE = Path(os.environ.get("EXPLANATION_STYLE_REFERENCE", "")) if os.environ.get("EXPLANATION_STYLE_REFERENCE") else None
client = OpenAI()

def build_style_reference():
    if not STYLE_REFERENCE or not STYLE_REFERENCE.exists():
        return "No owner-supplied style reference is available; use the standard six-line JAMB explanation contract."
    try:
        records = json.loads(STYLE_REFERENCE.read_text())
        samples = []
        for record in records:
            explanation = str(record.get("explanation", "")).strip()
            if len(explanation.split()) >= 65:
                samples.append(explanation)
            if len(samples) == 3:
                break
        if not samples:
            return "No substantive owner-supplied style reference is available; use the standard six-line JAMB explanation contract."
        return "Owner-supplied rich explanation style reference. Follow its compact, natural teaching-paragraph voice: write two or three connected paragraphs with no headings, labels, bullets, numbering, or template phrases. Open directly with the relevant fact, process, or calculation; explain why the correct answer fits; then naturally contrast the most meaningful alternative(s) or condition(s). Preserve this approach without copying sentences, mentioning source material, or adding generic study advice.\n\n" + "\n\n---\n\n".join(samples)
    except Exception:
        return "Owner-supplied style reference could not be read; use the standard six-line JAMB explanation contract."

STYLE_CONTRACT = build_style_reference()

SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "biology_explanation",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "lines": {"type": "array", "items": {"type": "string"}, "minItems": 2, "maxItems": 3},
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
    last_error = "unknown model failure"
    for attempt in range(3):
        try:
            request = {
                "model": MODEL,
                "messages": [
                    {"role": "system", "content": "You are a careful Nigerian senior-secondary teacher writing JAMB revision notes for the subject supplied in the question data. Output two or three compact, natural explanatory paragraphs as separate strings. Do not use labels such as 'Concept', 'Mechanism', 'Observation', 'Distinction', 'Therefore', or 'Answer'; do not use bullets, numbering, or template-like study advice. Begin directly with the relevant fact, process, or calculation. Explain why the correct option fits and naturally contrast the most meaningful alternatives or conditions where useful. Use only facts supported by standard senior-secondary knowledge for the supplied question. Do not claim this is an official JAMB question. If the stem, answer key, diagram reference, or wording appears ambiguous or factually uncertain, set needs_review=true rather than inventing a fact.\n\n" + STYLE_CONTRACT},
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
            if response.choices:
                last_error = f"empty model content; finish_reason={response.choices[0].finish_reason}"
            else:
                last_error = "empty model response choices"
        except Exception as error:
            last_error = f"{type(error).__name__}: {error}"
        time.sleep(1.5 * (attempt + 1))
    if result is None:
        return {"id": item["id"], "subject": item["subject"], "topic": item["topic"], "question": item["question"], "answer_index": item["answer_index"], "answer_text": item["options"][item["answer_index"]], "original_explanation": item.get("explanation", ""), "lines": ["This record could not be safely enriched automatically."] * 2, "confidence": "low", "needs_review": True, "word_count": 0, "quality_gate": False, "generation_error": last_error}
    lines = [" ".join(line.split()).strip() for line in result["lines"]]
    joined = " ".join(lines).lower()
    generic = ["this question tests your understanding", "revisit", "before moving to the next question", "read the key wording"]
    result["lines"] = lines
    result["word_count"] = len(joined.split())
    label_led = ["concept:", "mechanism:", "observation:", "distinction:", "therefore:", "answer:"]
    result["quality_gate"] = 2 <= len(lines) <= 3 and result["word_count"] >= 65 and not any(phrase in joined for phrase in generic + label_led)
    if not result["quality_gate"]:
        result["needs_review"] = True
    return {"id": item["id"], "subject": item["subject"], "topic": item["topic"], "question": item["question"], "answer_index": item["answer_index"], "answer_text": item["options"][item["answer_index"]], "original_explanation": item.get("explanation", ""), "style_reference_used": bool(STYLE_REFERENCE and STYLE_REFERENCE.exists()), **result}

items = json.loads(INPUT.read_text())
results = [None] * len(items)
with ThreadPoolExecutor(max_workers=WORKERS) as pool:
    futures = {pool.submit(enrich, item): index for index, item in enumerate(items)}
    for future in as_completed(futures):
        results[futures[future]] = future.result()
OUTPUT.write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"model": MODEL, "workers": WORKERS, "input": len(items), "output": len(results), "ready": sum(1 for result in results if result["quality_gate"] and not result["needs_review"]), "needs_review": sum(1 for result in results if result["needs_review"])}, indent=2))
