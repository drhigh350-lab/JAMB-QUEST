import json
import os
from pathlib import Path
from openai import OpenAI

input_path = Path(os.environ.get("EXPLANATION_INPUT", "authorised-final-queue-2.input.json"))
model = os.environ.get("EXPLANATION_MODEL", "gpt-5-mini")
item = json.loads(input_path.read_text())[0]
client = OpenAI()
schema = {"type": "json_schema", "json_schema": {"name": "explanation_probe", "strict": True, "schema": {"type": "object", "properties": {"lines": {"type": "array", "items": {"type": "string"}, "minItems": 6, "maxItems": 6}, "confidence": {"type": "string", "enum": ["high", "medium", "low"]}, "needs_review": {"type": "boolean"}}, "required": ["lines", "confidence", "needs_review"], "additionalProperties": False}}}
request = {"model": model, "messages": [{"role": "system", "content": "Write exactly six accurate JAMB revision-note sentences for the supplied question. Return JSON only."}, {"role": "user", "content": json.dumps(item)}], "response_format": schema}
if model.startswith("gemini-") or model.startswith("claude-"):
    request["max_tokens"] = 900
else:
    request["max_completion_tokens"] = 900
    request["extra_body"] = {"reasoning": {"effort": "minimal"}}
try:
    response = client.chat.completions.create(**request)
    print(json.dumps({"model": model, "choices": len(response.choices or []), "content": response.choices[0].message.content if response.choices else None, "finish_reason": response.choices[0].finish_reason if response.choices else None}, ensure_ascii=False, indent=2))
except Exception as error:
    print(json.dumps({"model": model, "error_type": type(error).__name__, "error": str(error)}, ensure_ascii=False, indent=2))
