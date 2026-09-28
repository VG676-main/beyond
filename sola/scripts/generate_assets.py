"""Draw the Sola icon and iPhone launch images."""

from pathlib import Path
import math

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "icons"
SPLASH_DIR = ROOT / "splash"
BG = (244, 239, 230)
SUN = (226, 138, 60)
SUN_SOFT = (243, 181, 106)
HORIZON = (196, 138, 86)
INK = (58, 49, 40)
SERIF = "/usr/share/fonts/truetype/noto/NotoSerif-Regular.ttf"

SPLASHES = [
    (750, 1334),
    (1242, 2208),
    (1125, 2436),
    (828, 1792),
    (1170, 2532),
    (1284, 2778),
    (1179, 2556),
    (1290, 2796),
    (1206, 2622),
    (1320, 2868),
]


def _mark(size, maskable=False):
    image = Image.new("RGB", (size, size), BG)
    draw = ImageDraw.Draw(image)
    cx = size / 2
    cy = size * 0.455
    radius = size * (0.145 if maskable else 0.162)
    thickness = size * 0.026
    inner = radius + size * 0.04
    outer = radius + size * (0.095 if maskable else 0.112)
    for index in range(8):
        angle = math.radians(index * 45 - 90)
        px = math.cos(angle + math.pi / 2) * thickness / 2
        py = math.sin(angle + math.pi / 2) * thickness / 2
        x1 = cx + math.cos(angle) * inner
        y1 = cy + math.sin(angle) * inner
        x2 = cx + math.cos(angle) * outer
        y2 = cy + math.sin(angle) * outer
        draw.polygon(
            [(x1 + px, y1 + py), (x2 + px, y2 + py), (x2 - px, y2 - py), (x1 - px, y1 - py)],
            fill=SUN,
        )
        cap = thickness / 2
        draw.ellipse((x2 - cap, y2 - cap, x2 + cap, y2 + cap), fill=SUN)
    draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=SUN)
    gloss = radius * 0.28
    draw.ellipse(
        (cx - radius * 0.42, cy - radius * 0.5, cx - radius * 0.42 + gloss, cy - radius * 0.5 + gloss),
        fill=SUN_SOFT,
    )
    bar_w = radius * 1.55
    bar_h = size * 0.03
    bar_y = cy + radius + size * 0.075
    draw.rounded_rectangle(
        (cx - bar_w / 2, bar_y, cx + bar_w / 2, bar_y + bar_h),
        radius=bar_h / 2,
        fill=HORIZON,
    )
    return image


def draw_mark(size, maskable=False):
    big = _mark(size * 4, maskable=maskable)
    return big.resize((size, size), Image.Resampling.LANCZOS)


def draw_splash(width, height):
    image = Image.new("RGB", (width, height), BG)
    mark = draw_mark(512)
    side = int(min(width, height) * 0.22)
    mark = mark.resize((side, side), Image.Resampling.LANCZOS)
    x = (width - side) // 2
    y = int(height * 0.40) - side // 2
    image.paste(mark, (x, y))
    draw = ImageDraw.Draw(image)
    font_size = max(28, int(min(width, height) * 0.045))
    font = ImageFont.truetype(SERIF, font_size)
    text = "Sola"
    box = draw.textbbox((0, 0), text, font=font)
    text_w = box[2] - box[0]
    text_x = (width - text_w) // 2
    text_y = y + side + int(side * 0.08)
    draw.text((text_x, text_y), text, font=font, fill=INK)
    return image


def main():
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    SPLASH_DIR.mkdir(parents=True, exist_ok=True)
    regular = {
        32: False,
        180: False,
        192: False,
        512: False,
    }
    for size, maskable in regular.items():
        image = draw_mark(size, maskable=maskable)
        image.save(ICON_DIR / f"icon-{size}.png", optimize=True)
    draw_mark(180).save(ICON_DIR / "apple-touch-icon.png", optimize=True)
    draw_mark(512, maskable=True).save(ICON_DIR / "icon-maskable-512.png", optimize=True)
    for width, height in SPLASHES:
        draw_splash(width, height).save(SPLASH_DIR / f"{width}x{height}.png", optimize=True)
    print(f"wrote icons and {len(SPLASHES)} launch images")


if __name__ == "__main__":
    main()
