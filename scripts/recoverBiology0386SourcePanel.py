from pathlib import Path

from PIL import Image, ImageOps

source = Path("/home/ubuntu/webdev-static-assets/candidate-source-diagrams/biology-0386-schoolngr-original.png")
output = Path("/home/ubuntu/webdev-static-assets/candidate-source-diagrams/biology-0386-schoolngr-source-panel.png")

# The source page exactly matches the protected 2005 JAMB prompt. This crop removes
# only clipped source text above the panel, retaining the original I–IV plant figure.
# No prompt, options, answer marker, explanation, or semantic redrawing is included.
image = Image.open(source).convert("RGB")
panel = ImageOps.expand(image.crop((80, 65, 325, 326)), border=10, fill="#ffffff")
panel.save(output, "PNG", optimize=True)
print(output)
