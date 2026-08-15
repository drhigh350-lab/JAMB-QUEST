from pathlib import Path
from PIL import Image

SOURCE = Path("/home/ubuntu/webdev-static-assets/jamb-quest-official-mark.png")
OUT_DIR = Path("/home/ubuntu/webdev-static-assets")
NAVY = (17, 43, 71, 255)

def render(size: int, maskable: bool) -> Image.Image:
    source = Image.open(SOURCE).convert("RGBA")
    canvas = Image.new("RGBA", (size, size), NAVY)
    safe_ratio = 0.62 if maskable else 0.72
    target = int(size * safe_ratio)
    source.thumbnail((target, target), Image.Resampling.LANCZOS)
    x = (size - source.width) // 2
    y = (size - source.height) // 2
    canvas.alpha_composite(source, (x, y))
    return canvas

for size in (192, 512):
    render(size, False).save(OUT_DIR / f"jamb-quest-official-icon-{size}.png")
    render(size, True).save(OUT_DIR / f"jamb-quest-official-icon-maskable-{size}.png")
