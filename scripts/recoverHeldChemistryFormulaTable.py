from pathlib import Path

from PIL import Image, ImageOps

source = Path('/home/ubuntu/upload/Screenshot_2026-08-17-07-32-30-140_com.myschool.cbt.jpg')
destination = Path('/home/ubuntu/webdev-static-assets/jamb-quest-diagrams/owner-chem-diagram-2026-009-source-table.png')

destination.parent.mkdir(parents=True, exist_ok=True)
image = Image.open(source).convert('RGB')

# The source panel contains the complete I–V formula table at this exact region.
# The crop deliberately excludes the question prompt, answer choices, explanation control,
# and source-app headers so it cannot reveal an answer or source UI to the learner.
table = image.crop((48, 380, 654, 440))
table = ImageOps.expand(table, border=10, fill='#ffffff')
table.save(destination, 'PNG', optimize=True)
print(destination)
