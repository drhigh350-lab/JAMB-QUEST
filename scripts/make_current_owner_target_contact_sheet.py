from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

assets_dir = Path('/home/ubuntu/webdev-static-assets')
output_path = Path('/home/ubuntu/jamb-quiz-game/reports/current_owner_target_diagrams_contact_sheet.png')
filenames = [
    'owner-bio-diagram-2026-011.png', 'owner-phy-diagram-2026-001.png',
    'owner-chem-diagram-2026-009-source-table.png', 'owner-phy-diagram-2026-003-source-panel.png',
    'owner-phy-diagram-2026-004.png', 'owner-bio-diagram-2026-001.png',
    'owner-phy-diagram-2026-002.png', 'owner-bio-diagram-2026-005.png',
    'owner-phy-diagram-2026-005-source-panel.png', 'owner-bio-diagram-2026-002.png',
    'owner-phy-diagram-2026-006.png', 'owner-bio-diagram-2026-010.png',
    'owner-bio-diagram-2026-009.png', 'owner-phy-diagram-2026-008-source-panel.png',
    'owner-phy-diagram-2026-011.png', 'owner-phy-diagram-2026-009.png',
    'owner-phy-diagram-2026-013.png', 'owner-bio-diagram-2026-004.png',
    'owner-phy-diagram-2026-012.png', 'owner-phy-diagram-2026-015.png',
    'owner-phy-diagram-2026-010.png', 'owner-bio-diagram-2026-006.png',
    'biology-1111-myschool-exact-reference.png', 'owner-bio-diagram-2026-007.png',
]

paths = []
for filename in filenames:
    matches = list(assets_dir.rglob(filename))
    if not matches:
        raise FileNotFoundError(filename)
    paths.append(matches[0])

cell_width, cell_height, label_height = 310, 230, 34
columns = 4
rows = (len(paths) + columns - 1) // columns
canvas = Image.new('RGB', (columns * cell_width, rows * (cell_height + label_height)), 'white')
draw = ImageDraw.Draw(canvas)
font = ImageFont.load_default()

for index, path in enumerate(paths):
    source = Image.open(path).convert('RGB')
    source.thumbnail((cell_width - 18, cell_height - 18))
    x = (index % columns) * cell_width + (cell_width - source.width) // 2
    y = (index // columns) * (cell_height + label_height) + (cell_height - source.height) // 2
    canvas.paste(source, (x, y))
    label = path.name.replace('.png', '')[:48]
    draw.text(((index % columns) * cell_width + 8, (index // columns) * (cell_height + label_height) + cell_height + 10), label, fill='black', font=font)

output_path.parent.mkdir(parents=True, exist_ok=True)
canvas.save(output_path)
print(output_path)
