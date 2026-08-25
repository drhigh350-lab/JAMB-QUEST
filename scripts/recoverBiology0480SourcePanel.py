from pathlib import Path

from PIL import Image, ImageOps

source = Path("/home/ubuntu/webdev-static-assets/candidate-source-diagrams/biology-0480-schoolngr-original.webp")
output = Path("/home/ubuntu/webdev-static-assets/candidate-source-diagrams/biology-0480-schoolngr-source-panel.png")

# The exact-source image has faint source residue only at the far-left edge.
# This crop preserves all four dogs and their I–IV labels without redrawing any content.
image = Image.open(source).convert("RGB")
panel = image.crop((28, 0, image.width, image.height))
panel = ImageOps.expand(panel, border=8, fill="#ffffff")
panel.save(output, "PNG", optimize=True)
print(output)
