from pathlib import Path
from PIL import Image, ImageDraw

output = Path('/home/ubuntu/webdev-static-assets/jamb-quest-official-mark.png')
canvas = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
draw = ImageDraw.Draw(canvas)

navy = '#102D4B'
gold = '#F5A623'

# Four slanted square tiles matching the CSS .brand-symbol mark used in JAMB Quest.
tiles = [
    (220, 128, navy),
    (610, 128, gold),
    (220, 518, navy),
    (610, 518, navy),
]

for left, top, color in tiles:
    size = 332
    slant = 58
    draw.polygon([
        (left + slant, top),
        (left + size + slant, top),
        (left + size, top + size),
        (left, top + size),
    ], fill=color)

canvas.save(output, 'PNG', optimize=True)
print(output)
