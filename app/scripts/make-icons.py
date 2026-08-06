from PIL import Image, ImageDraw
import os

S = 512          # المقاس المرجعي
SS = 4           # عيّنة فائقة ثم تصغير — بديل التنعيم في PIL
W = S * SS

DEEP  = (6, 95, 70)      # #065F46
LIGHT = (16, 138, 100)   # #108A64
MINT  = (236, 253, 245)  # #ECFDF5
ARC   = (110, 231, 183)  # #6EE7B7

def gradient():
    """تدرّج قُطري خفيف — عمق بلا ضجيج"""
    g = Image.new("RGB", (W, W))
    d = ImageDraw.Draw(g)
    for y in range(W):
        t = y / (W - 1)
        d.line([(0, y), (W, y)],
               fill=tuple(int(LIGHT[i] + (DEEP[i] - LIGHT[i]) * t) for i in range(3)))
    return g

def crescent_mask(cx, cy, r_out, dx, dy, r_in):
    """الهلال = دائرة ناقص دائرة مزاحة"""
    m = Image.new("L", (W, W), 0)
    d = ImageDraw.Draw(m)
    d.ellipse([(cx-r_out)*SS, (cy-r_out)*SS, (cx+r_out)*SS, (cy+r_out)*SS], fill=255)
    d.ellipse([(dx-r_in)*SS, (dy-r_in)*SS, (dx+r_in)*SS, (dy+r_in)*SS], fill=0)
    return m

def build(scale=1.0, arcs=True, radius_ratio=0.1875):
    """scale<1 يترك هامش أمان لأيقونة maskable"""
    img = gradient().convert("RGBA")

    art = Image.new("RGBA", (W, W), (0, 0, 0, 0))

    # ---- الهلال (يسار) — الفتحة نحو اليمين حيث تخرج الصوت
    cm = crescent_mask(196, 256, 140, 250, 240, 130)
    layer = Image.new("RGBA", (W, W), MINT + (255,))
    art.paste(layer, (0, 0), cm)

    # ---- موجات الصوت (يمين) — المنصة كلها لضبط النطق، لا للقراءة وحدها
    if arcs:
        for r, wdt, alpha in ((92, 20, 235), (132, 17, 175), (172, 14, 115)):
            l = Image.new("RGBA", (W, W), (0, 0, 0, 0))
            ImageDraw.Draw(l).arc(
                [(300-r)*SS, (256-r)*SS, (300+r)*SS, (256+r)*SS],
                start=-48, end=48, fill=ARC + (alpha,), width=wdt*SS,
            )
            art = Image.alpha_composite(art, l)

    # توسيط المجموعة وتحجيمها
    if scale != 1.0:
        n = int(W * scale)
        art = art.resize((n, n), Image.LANCZOS)
        pad = Image.new("RGBA", (W, W), (0, 0, 0, 0))
        pad.paste(art, ((W-n)//2, (W-n)//2), art)
        art = pad

    img = Image.alpha_composite(img, art)

    if radius_ratio > 0:
        mask = Image.new("L", (W, W), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, W-1, W-1],
                                               radius=int(W*radius_ratio), fill=255)
        out = Image.new("RGBA", (W, W), (0, 0, 0, 0))
        out.paste(img, (0, 0), mask)
        img = out
    return img

def save(img, path, size):
    img.resize((size, size), Image.LANCZOS).save(path, optimize=True)

OUT = "/sessions/blissful-determined-cerf/mnt/hadissss/app/public"
os.makedirs(OUT + "/icons", exist_ok=True)

rounded = build(radius_ratio=0.1875)                    # أيقونات المتصفح والتطبيق
square  = build(radius_ratio=0.0)                       # iOS يقصّ بنفسه
maskbl  = build(scale=0.62, radius_ratio=0.0)           # هامش أمان لقناع أندرويد
simple  = build(arcs=False, radius_ratio=0.1875)        # 32px: الموجات تختفي فتُوسّخ

for s in (192, 256, 384, 512):
    save(rounded, f"{OUT}/icons/icon-{s}.png", s)
save(square,  f"{OUT}/icons/apple-touch-icon.png", 180)
save(maskbl,  f"{OUT}/icons/maskable-512.png", 512)
save(simple,  f"{OUT}/favicon-32.png", 32)

# ---- صورة المشاركة (Open Graph) — العلامة على خلفية المشروع
og = Image.new("RGB", (1200, 630), DEEP)
gd = ImageDraw.Draw(og)
for y in range(630):
    t = y / 629
    gd.line([(0, y), (1200, y)],
            fill=tuple(int(LIGHT[i] + (DEEP[i]-LIGHT[i]) * t) for i in range(3)))
mark = build(radius_ratio=0.0).resize((360, 360), Image.LANCZOS)
og.paste(mark, (420, 135), mark)
og.save(f"{OUT}/icons/og.png", optimize=True)

print("done")
