from pathlib import Path

from PIL import Image


SOURCE = Path("/home/ubuntu/upload/348847.webp")
TARGET = Path("/home/ubuntu/webdev-static-assets/jamb-quest-official-wordmark-transparent.png")


def main() -> None:
    with Image.open(SOURCE).convert("RGBA") as image:
        pixels = image.load()
        for y in range(image.height):
            for x in range(image.width):
                red, green, blue, _ = pixels[x, y]
                if red > 245 and green > 245 and blue > 245:
                    pixels[x, y] = (red, green, blue, 0)
        alpha = image.getchannel("A")
        bounds = alpha.getbbox()
        if bounds is None:
            raise RuntimeError("The approved wordmark image did not contain a visible logo")
        cropped = image.crop(bounds)
        padding = max(8, round(max(cropped.width, cropped.height) * 0.04))
        output = Image.new("RGBA", (cropped.width + padding * 2, cropped.height + padding * 2), (0, 0, 0, 0))
        output.alpha_composite(cropped, (padding, padding))
        output.save(TARGET)


if __name__ == "__main__":
    main()
