from pathlib import Path

from PIL import Image, ImageOps

source = Path("/home/ubuntu/webdev-static-assets/candidate-source-diagrams/biology-0396-schoolngr-original.png")
output = Path("/home/ubuntu/webdev-static-assets/candidate-source-diagrams/biology-0396-schoolngr-source-panel.png")

# The SchoolNGR source exactly matches the held JAMB 2005 graph question. The box
# removes only source text surrounding the graph and preserves the original axes,
# temperature curves, Days scale, and Number of Cockroaches scale.
image = Image.open(source).convert("RGB")
panel = ImageOps.expand(image.crop((30, 85, 340, 290)), border=10, fill="#ffffff")
panel.save(output, "PNG", optimize=True)
print(output)
