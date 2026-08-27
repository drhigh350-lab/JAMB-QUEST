from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

paths = [
    Path('/home/ubuntu/upload/361163.png'),
    *sorted(Path('/home/ubuntu/upload').glob('361*.jpg')),
    Path('/home/ubuntu/upload/361319.png'),
    Path('/home/ubuntu/upload/361320.png'),
    Path('/home/ubuntu/upload/361429.png'),
    Path('/home/ubuntu/upload/361430.png'),
    Path('/home/ubuntu/upload/361433.png'),
    Path('/home/ubuntu/upload/361471.png'),
]
paths = [path for path in paths if path.exists()]
output_path = Path('/home/ubuntu/jamb-quiz-game/reports/remaining_owner_candidates_contact_sheet.png')
cell_width, cell_height, label_height = 280, 210, 30
columns = 4
rows = (len(paths) + columns - 1) // columns
canvas = Image.new('RGB', (columns * cell_width, rows * (cell_height + label_height)), 'white')
draw = ImageDraw.Draw(canvas)
font = ImageFont.load_default()

for index, path in enumerate(paths):
    source = Image.open(path).convert('RGB')
    source.thumbnail((cell_width - 16, cell_height - 16))
    x = (index % columns) * cell_width + (cell_width - source.width) // 2
    y = (index // columns) * (cell_height + label_height) + (cell_height - source.height) // 2
    canvas.paste(source, (x, y))
    draw.text(((index % columns) * cell_width + 8, (index // columns) * (cell_height + label_height) + cell_height + 9), path.name, fill='black', font=font)

canvas.save(output_path)
print(output_path)
