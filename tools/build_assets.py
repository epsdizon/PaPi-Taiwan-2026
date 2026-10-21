"""Rebuild the site's fonts, icons and link-preview image.

Run this after adding places with new Chinese characters, so they render in the site's font:

    python tools/build_assets.py --sofia path/to/fontsource-packages

What it does
  1. Collects every Chinese character used in index.html, assets/data.js and assets/app.js,
     then subsets Noto Sans CJK TC (Regular and Black) to just those characters (a few KB each).
  2. Copies the Sofia Sans variable fonts (from the @fontsource-variable npm packages) if --sofia is given.
  3. Draws the app icons and the 1200x630 link-preview image (assets/og.png).

Needs: Python 3, fontTools, brotli, Pillow, and the Noto Sans CJK .ttc files (Debian/Ubuntu: fonts-noto-cjk).
"""
import argparse
import io
import re
import shutil
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTCollection, TTFont
from fontTools.varLib import instancer
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "assets" / "fonts"
ICONS = ROOT / "assets" / "icons"
CJK_DIR = Path("/usr/share/fonts/opentype/noto")
SKY_TOP, SKY_LOW, CITY, SIGN, GOLD, CREAM = "#081230", "#1D3473", "#070F2B", "#C41E2A", "#F0BE4C", "#FFF3D6"


CJK = r"[　-〿㐀-鿿豈-﫿＀-￯]"


def cjk_chars(names_only=False):
    """All Chinese characters on the site, or only those in place names and the cover sign (for the bold font)."""
    if names_only:
        data = (ROOT / "assets/data.js").read_text(encoding="utf-8")
        text = "".join(re.findall(r'zh: "([^"]+)"', data)) + "台灣之旅"
    else:
        text = "".join((ROOT / f).read_text(encoding="utf-8") for f in ["index.html", "assets/data.js", "assets/app.js"])
    return "".join(sorted(set(re.findall(CJK, text))))


def tc_face(weight):
    coll = TTCollection(str(CJK_DIR / f"NotoSansCJK-{weight}.ttc"))
    for font in coll.fonts:
        if font["name"].getDebugName(1).startswith("Noto Sans CJK TC"):
            return font
    raise SystemExit(f"No TC face in NotoSansCJK-{weight}.ttc")


def build_cjk_subsets():
    for weight, out, names_only in [("Regular", "noto-sans-tc-400.woff2", False), ("Black", "noto-sans-tc-900.woff2", True)]:
        chars = cjk_chars(names_only) + " /"
        font = tc_face(weight)
        buf = io.BytesIO()
        font.save(buf)
        buf.seek(0)
        font = TTFont(buf)
        opts = subset.Options()
        opts.flavor = "woff2"
        opts.layout_features = ["*"]
        opts.name_IDs = ["*"]
        opts.notdef_outline = True
        sub = subset.Subsetter(opts)
        sub.populate(text=chars)
        sub.subset(font)
        font.flavor = "woff2"
        font.save(str(FONTS / out))
        print(f"{out}: {len(chars)} characters, {(FONTS / out).stat().st_size // 1024} KB")


def copy_sofia(src):
    src = Path(src)
    for pkg, base in [("fontsource-variable-sofia-sans", "sofia-sans"),
                      ("fontsource-variable-sofia-sans-extra-condensed", "sofia-sans-extra-condensed")]:
        folder = next((x for x in src.glob(pkg + "-[0-9]*") if x.is_dir()), None)
        if folder is None or not folder.is_dir():
            print(f"skip {pkg}: not found in {src}")
            continue
        for sub_name in ["latin", "latin-ext"]:
            f = folder / "files" / f"{base}-{sub_name}-wght-normal.woff2"
            shutil.copy(f, FONTS / f.name)
            print("copied", f.name)


def static_font(woff2_path, weight, size):
    font = TTFont(str(woff2_path))
    font.flavor = None
    font = instancer.instantiateVariableFont(font, {"wght": weight})
    buf = io.BytesIO()
    font.save(buf)
    buf.seek(0)
    return ImageFont.truetype(buf, size)


def cjk_font(size):
    return ImageFont.truetype(str(CJK_DIR / "NotoSansCJK-Black.ttc"), size, index=3)


def sky(w, h):
    img = Image.new("RGB", (w, h))
    top, low = Image.new("RGB", (1, 1), SKY_TOP).getpixel((0, 0)), Image.new("RGB", (1, 1), SKY_LOW).getpixel((0, 0))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(1, h - 1)
        d.line([(0, y), (w, y)], fill=tuple(int(top[i] + (low[i] - top[i]) * t) for i in range(3)))
    return img


def lantern(img, x, y, s):
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([x - 26 * s, y - 30 * s, x + 26 * s, y + 30 * s], fill=(255, 150, 60, 120))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(18 * s)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([x - 12 * s, y - 16 * s, x + 12 * s, y + 16 * s], radius=int(10 * s), fill="#F49A3A")
    d.rounded_rectangle([x - 8 * s, y - 11 * s, x + 8 * s, y + 9 * s], radius=int(7 * s), fill="#FFC766")
    d.ellipse([x - 4 * s, y + 9 * s, x + 4 * s, y + 13 * s], fill="#FFF4C2")


def skyline(img, base_y, scale=1.0):
    d = ImageDraw.Draw(img)
    rects = [(0, 30, 40), (38, 44, 26), (62, 26, 34), (94, 52, 22), (114, 36, 40), (152, 60, 28), (178, 40, 36),
             (212, 30, 24), (234, 48, 46), (278, 70, 30), (306, 42, 40), (344, 56, 26), (368, 34, 38), (404, 64, 30),
             (432, 46, 44), (474, 38, 26), (498, 74, 34), (530, 50, 40), (568, 40, 28), (594, 58, 36), (628, 44, 30),
             (656, 36, 40), (694, 52, 22), (770, 42, 22), (790, 46, 30), (818, 62, 40), (856, 40, 26), (880, 54, 38),
             (916, 72, 30), (944, 44, 44), (986, 36, 28), (1012, 58, 36), (1046, 46, 30), (1074, 66, 42),
             (1114, 40, 28), (1140, 52, 36), (1174, 34, 26)]
    S = lambda v: v * scale
    for x, h, w in rects:
        d.rectangle([S(x), base_y - S(h), S(x + w), base_y], fill=CITY)
    cx = 740
    d.rectangle([S(cx - 26), base_y - S(20), S(cx + 26), base_y], fill=CITY)
    d.polygon([(S(cx - 18), base_y - S(20)), (S(cx + 18), base_y - S(20)), (S(cx + 14), base_y - S(48)), (S(cx - 14), base_y - S(48))], fill=CITY)
    for k in range(8):
        yb = 48 + 10 * k
        d.polygon([(S(cx - 12), base_y - S(yb)), (S(cx + 12), base_y - S(yb)), (S(cx + 16), base_y - S(yb + 10)), (S(cx - 16), base_y - S(yb + 10))], fill=CITY)
        d.rectangle([S(cx - 15), base_y - S(yb + 9.4), S(cx + 15), base_y - S(yb + 8.2)], fill="#7A6A3A")
    d.rectangle([S(cx - 9), base_y - S(138), S(cx + 9), base_y - S(128)], fill=CITY)
    d.rectangle([S(cx - 5), base_y - S(146), S(cx + 5), base_y - S(138)], fill=CITY)
    d.rectangle([S(cx - 1.4), base_y - S(168), S(cx + 1.4), base_y - S(146)], fill=CITY)


def sign(img, box, text, size):
    x0, y0, x1, y1 = box
    d = ImageDraw.Draw(img)
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(glow).rounded_rectangle([x0 - 10, y0 - 10, x1 + 10, y1 + 10], radius=18, fill=(255, 72, 52, 110))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(16)))
    d.rounded_rectangle(box, radius=max(6, size // 7), fill=SIGN)
    inset = max(4, size // 12)
    d.rounded_rectangle([x0 + inset, y0 + inset, x1 - inset, y1 - inset], radius=max(4, size // 9), outline=GOLD, width=max(2, size // 26))
    f = cjk_font(size)
    cx = (x0 + x1) / 2
    n = len(text)
    step = (y1 - y0 - 2 * inset) / n
    for i, ch in enumerate(text):
        d.text((cx, y0 + inset + step * (i + 0.5)), ch, font=f, fill=CREAM, anchor="mm")


def build_icons():
    ICONS.mkdir(parents=True, exist_ok=True)
    for size, name, pad in [(512, "icon-512.png", 0.16), (192, "icon-192.png", 0.16), (180, "apple-touch-icon.png", 0.16), (512, "maskable-512.png", 0.26)]:
        img = sky(size, size).convert("RGBA")
        lantern(img, size * 0.8, size * 0.2, size / 300)
        lantern(img, size * 0.18, size * 0.32, size / 520)
        w = size * (1 - 2 * pad) * 0.62
        h = size * (1 - 2 * pad)
        sign(img, [size / 2 - w / 2, size * pad, size / 2 + w / 2, size * pad + h], "台", int(w * 0.62))
        img.convert("RGB").save(ICONS / name, optimize=True)
        print("icon", name)


def build_og(sofia_dir):
    W, H = 1200, 630
    img = sky(W, H).convert("RGBA")
    for x, y, s in [(560, 120, 1.3), (690, 60, .8), (840, 170, 1.6), (980, 90, 1.0), (1110, 210, .7), (470, 250, .6), (1040, 330, 1.1)]:
        lantern(img, x, y, s)
    skyline(img, H, 1.0)
    sign(img, [70, 70, 170, 470], "台灣之旅", 64)
    d = ImageDraw.Draw(img)
    try:
        cond = FONTS / "sofia-sans-extra-condensed-latin-wght-normal.woff2"
        sans = FONTS / "sofia-sans-latin-wght-normal.woff2"
        big, mid, small = static_font(cond, 900, 230), static_font(cond, 800, 104), static_font(sans, 650, 38)
    except Exception as exc:  # fonts not copied yet
        print("og fonts fallback:", exc)
        big = mid = small = ImageFont.load_default()
    d.text((210, 52), "PaPi", font=big, fill=CREAM)
    d.text((214, 252), "Taiwan 2026", font=mid, fill=CREAM)
    d.text((218, 372), "Dec 4 to 9, 2026", font=small, fill="#C8D3F3")
    d.text((218, 420), "Our family trip plan", font=small, fill="#F6C453")
    img.convert("RGB").save(ROOT / "assets" / "og.png", optimize=True)
    print("og.png")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--sofia", help="folder holding the unpacked @fontsource-variable/sofia-sans* npm packages")
    args = ap.parse_args()
    FONTS.mkdir(parents=True, exist_ok=True)
    if args.sofia:
        copy_sofia(args.sofia)
    build_cjk_subsets()
    build_icons()
    build_og(args.sofia)
