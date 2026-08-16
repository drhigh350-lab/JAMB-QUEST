import json
from pathlib import Path

from openai import OpenAI


inventory = json.loads(Path("/home/ubuntu/jamb-quiz-game/reports/unmapped_authorised_topic_inventory.json").read_text(encoding="utf-8"))
record = next(record for record in inventory["records"] if record["explanationStatus"] == "approved")
client = OpenAI()
response = client.chat.completions.create(
    model="gpt-5-mini",
    messages=[
        {"role": "system", "content": "Return one valid JSON object with keys topic and confidence. Classify the question into one official JAMB syllabus topic."},
        {"role": "user", "content": json.dumps({
            "subject": record["subject"],
            "currentTopic": record["currentTopic"],
            "question": record["question"],
        }, ensure_ascii=False)},
    ],
    max_completion_tokens=300,
)
print(json.dumps(response.model_dump(), ensure_ascii=False, indent=2))
