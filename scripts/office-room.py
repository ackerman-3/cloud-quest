# 사무실 아이소메트릭 방·가구 픽셀 아트 생성기
# 실행: python3 scripts/office-room.py
#  → src/assets/office/room.png, src/assets/office/<가구id>.png, src/data/officeSprites.ts
# 좌표: 바닥 위 점(x, y, z) → 화면 (OX + 2x − 2y, OY + x + y − z). x는 오른쪽 아래, y는 왼쪽 아래, z는 위.
import json, math, os
from PIL import Image, ImageDraw

OUT = 'src/assets/office'
os.makedirs(OUT, exist_ok=True)

RX, RY, RH = 64, 76, 56      # 방 크기: 오른쪽 벽 길이, 왼쪽 벽 길이, 벽 높이
T = 3                         # 벽 두께
SLAB = 5                      # 바닥 두께
W = 2 * (RX + RY) + 2 * T * 2 + 4
OX = 2 * RY + 2 * T + 2
OY = RH + T + 3
H = OY + RX + RY + SLAB + 3

def hexc(h, a=255):
    h = h.lstrip('#'); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)
def shade(c, f):
    return tuple(max(0, min(255, round(v * f))) for v in c[:3]) + (c[3],)

OUTLINE = hexc('#2b3550')

# ── 방 배경 ──
def P(x, y, z=0):
    return (OX + 2 * x - 2 * y, OY + x + y - z)

room = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(room)
FLOOR = hexc('#dfe4ee'); GRID = hexc('#cfd6e3'); SLABC = hexc('#7f8cab')
WALL_L = hexc('#f6efe4'); WALL_R = hexc('#ece2d2'); CAP = hexc('#34507f'); BASE = hexc('#cdbfa8')

# 바닥 + 두께
d.polygon([P(0, 0), P(RX, 0), P(RX, RY), P(0, RY)], fill=FLOOR)
for i in range(8, RX, 8): d.line([P(i, 0), P(i, RY)], fill=GRID)
for j in range(8, RY, 8): d.line([P(0, j), P(RX, j)], fill=GRID)
d.polygon([P(0, RY), P(RX, RY), P(RX, RY, -SLAB), P(-T, RY, -SLAB), P(-T, RY)], fill=SLABC)
d.polygon([P(RX, -T), P(RX, RY), P(RX, RY, -SLAB), P(RX, -T, -SLAB)], fill=shade(SLABC, 0.82))
# 벽 안쪽 면
d.polygon([P(0, 0), P(0, RY), P(0, RY, RH), P(0, 0, RH)], fill=WALL_L)
d.polygon([P(0, 0), P(RX, 0), P(RX, 0, RH), P(0, 0, RH)], fill=WALL_R)
# 걸레받이
d.polygon([P(0, 0), P(0, RY), P(0, RY, 2), P(0, 0, 2)], fill=BASE)
d.polygon([P(0, 0), P(RX, 0), P(RX, 0, 2), P(0, 0, 2)], fill=shade(BASE, 0.92))
# 창문(왼쪽 벽): 벽 평면에서 (y, z) → 화면
WY0, WY1, WZ0, WZ1 = 12, 64, 22, 47
def Wp(y, z): return P(0, y, z)
SKY_T = hexc('#9fcdf3'); SKY_B = hexc('#d6ebfb')
for z in range(WZ0, WZ1):
    f = (z - WZ0) / (WZ1 - WZ0)
    c = tuple(round(SKY_B[k] + (SKY_T[k] - SKY_B[k]) * f) for k in range(3)) + (255,)
    d.polygon([Wp(WY0, z), Wp(WY1, z), Wp(WY1, z + 1), Wp(WY0, z + 1)], fill=c)
# 구름
for (cy, cz, r) in ((20, 42, 3), (23, 43, 2.4), (52, 41, 2.6), (55, 42, 2)):
    for yy in range(int(cy - r * 2), int(cy + r * 2) + 1):
        for zz in range(int(cz - r), int(cz + r) + 1):
            if ((yy - cy) / (r * 1.8)) ** 2 + ((zz - cz) / r) ** 2 <= 1:
                d.polygon([Wp(yy, zz), Wp(yy + 1, zz), Wp(yy + 1, zz + 1), Wp(yy, zz + 1)], fill=(255, 255, 255, 235))
# 남산 + 타워
HILL = hexc('#7fa9d6'); TOWER = hexc('#5c80b3')
for yy in range(40, WY1):
    top = WZ0 + 13 * math.exp(-((yy - 54) / 7.5) ** 2)
    d.polygon([Wp(yy, WZ0), Wp(yy + 1, WZ0), Wp(yy + 1, top), Wp(yy, top)], fill=HILL)
d.line([Wp(54, WZ0 + 12), Wp(54, WZ0 + 22)], fill=TOWER, width=1)
d.polygon([Wp(53, WZ0 + 17), Wp(55, WZ0 + 17), Wp(55, WZ0 + 19), Wp(53, WZ0 + 19)], fill=TOWER)
# 빌딩
BLD = [hexc('#6f9fd2'), hexc('#5a8cc4'), hexc('#86b3df')]
for i, (y0, w, h) in enumerate(((13, 5, 12), (19, 4, 8), (24, 6, 15), (31, 4, 10), (36, 5, 13), (42, 4, 7), (46, 3, 9), (58, 5, 6))):
    c = BLD[i % 3]
    d.polygon([Wp(y0, WZ0), Wp(y0 + w, WZ0), Wp(y0 + w, WZ0 + h), Wp(y0, WZ0 + h)], fill=c)
    for wy in range(y0 + 1, y0 + w - 1, 2):
        for wz in range(WZ0 + 2, WZ0 + h - 1, 3):
            d.point(Wp(wy, wz), fill=hexc('#d7e8f8'))
# 창틀
FR = hexc('#2f4a78')
for y in (WY0, 29, 47, WY1):
    d.line([Wp(y, WZ0), Wp(y, WZ1)], fill=FR, width=2)
d.line([Wp(WY0, WZ0), Wp(WY1, WZ0)], fill=FR, width=1); d.line([Wp(WY0, WZ0 - 1), Wp(WY1, WZ0 - 1)], fill=FR, width=1)
d.line([Wp(WY0, WZ1), Wp(WY1, WZ1)], fill=FR, width=1); d.line([Wp(WY0, WZ1 + 1), Wp(WY1, WZ1 + 1)], fill=FR, width=1)
# 오른쪽 벽: 시계와 액자 대신 작은 게시판
BOARD = hexc('#cfe3d9')
d.polygon([P(8, 0, 44), P(22, 0, 44), P(22, 0, 34), P(8, 0, 34)], fill=BOARD, outline=FR)
for (bx, bz, c) in ((10, 41, '#f5c84c'), (14, 40, '#8fb4ff'), (18, 41, '#f4a3bd'), (11, 37, '#ffffff'), (16, 37, '#a8eedd')):
    d.polygon([P(bx, 0, bz), P(bx + 3, 0, bz), P(bx + 3, 0, bz - 2), P(bx, 0, bz - 2)], fill=hexc(c))
# 벽 윗면(두께)과 끝면
d.polygon([P(-T, -T, RH), P(-T, RY, RH), P(0, RY, RH), P(0, 0, RH)], fill=CAP)
d.polygon([P(-T, -T, RH), P(RX, -T, RH), P(RX, 0, RH), P(0, 0, RH)], fill=shade(CAP, 1.12))
d.polygon([P(-T, RY, RH), P(0, RY, RH), P(0, RY, -SLAB), P(-T, RY, -SLAB)], fill=shade(CAP, 0.85))
d.polygon([P(RX, -T, RH), P(RX, 0, RH), P(RX, 0, -SLAB), P(RX, -T, -SLAB)], fill=shade(CAP, 0.7))
# 안쪽 모서리 선
d.line([P(0, 0, 0), P(0, 0, RH)], fill=shade(WALL_R, 0.85))
room.save(f'{OUT}/room.png')

# ── 가구(각자 캔버스, 바닥 중심 기준점) ──
SPR = {}
class Spr:
    def __init__(s, size=140):
        s.im = Image.new('RGBA', (size, size), (0, 0, 0, 0)); s.d = ImageDraw.Draw(s.im); s.c = (size // 2, size // 2 + 30)
    def p(s, x, y, z=0): return (s.c[0] + 2 * x - 2 * y, s.c[1] + x + y - z)
    def box(s, x, y, z, a, b, h, col, top=None, left=None, right=None, outline=OUTLINE):
        col = hexc(col) if isinstance(col, str) else col
        top = hexc(top) if isinstance(top, str) else (top or shade(col, 1.12))
        left = hexc(left) if isinstance(left, str) else (left or col)
        right = hexc(right) if isinstance(right, str) else (right or shade(col, 0.8))
        zt = z + h; P_ = s.p
        if h > 0:
            s.d.polygon([P_(x, y + b, zt), P_(x + a, y + b, zt), P_(x + a, y + b, z), P_(x, y + b, z)], fill=left, outline=outline)
            s.d.polygon([P_(x + a, y, zt), P_(x + a, y + b, zt), P_(x + a, y + b, z), P_(x + a, y, z)], fill=right, outline=outline)
        s.d.polygon([P_(x, y, zt), P_(x + a, y, zt), P_(x + a, y + b, zt), P_(x, y + b, zt)], fill=top, outline=outline)
    def lface(s, x, y, z, a, h, col):   # 왼쪽 면(y=일정) 위 사각형
        s.d.polygon([s.p(x, y, z + h), s.p(x + a, y, z + h), s.p(x + a, y, z), s.p(x, y, z)], fill=hexc(col))
    def rface(s, x, y, z, b, h, col):   # 오른쪽 면(x=일정) 위 사각형
        s.d.polygon([s.p(x, y, z + h), s.p(x, y + b, z + h), s.p(x, y + b, z), s.p(x, y, z)], fill=hexc(col))
    def ell(s, cx, cy, rx, ry, col, out=True):
        s.d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=hexc(col), outline=OUTLINE if out else None)
    def save(s, name, front):
        """front: 겹침 순서용 앞쪽 끝(x+y)"""
        bb = s.im.getbbox(); im = s.im.crop(bb)
        im.save(f'{OUT}/{name}.png')
        SPR[name] = {'w': im.width, 'h': im.height, 'ax': s.c[0] - bb[0], 'ay': s.c[1] - bb[1], 'front': front}

WOOD = '#dcaa6e'; WOODD = '#b9834b'; CREAM = '#f3ead9'; NAVY = '#2c4775'; WHITE = '#f6f8fb'

# 책상(고정): 왼쪽 벽 창문 아래. 기준점 = 책상 중심
def desk_fixed():
    s = Spr(160)
    s.box(-6, -14, 0, 2, 2, 13, CREAM); s.box(-6, 12, 0, 12, 2, 13, CREAM)   # 다리 판
    s.box(4, -14, 0, 2, 2, 13, CREAM)
    s.box(-7, -15, 13, 14, 30, 2, WOOD, right=WOODD)
    s.box(-5, -6, 15, 2, 10, 1, '#3a4660')                                    # 모니터 받침
    s.box(-5, -7, 16, 1, 12, 9, '#2b3550', right='#8fb4ff')                    # 모니터(화면은 오른쪽 면)
    s.rface(-3.5, -6, 17.5, 10, 6, '#b9d6ff')
    s.box(-2, 7, 15, 4, 5, 3, '#e8eef7')                                        # 책
    s.box(-2, 7, 18, 4, 5, 1, '#3b6fd8')
    s.box(1, -12, 15, 2, 2, 3, '#f6f8fb')                                       # 펜꽂이
    # 의자
    s.box(9, -4, 0, 1, 1, 6, '#3a4660'); s.box(7, -6, 6, 6, 6, 2, NAVY); s.box(12, -6, 8, 1, 6, 7, NAVY)
    s.save('desk_fixed', 20)

def lamp(name, kind):
    # 작은 소품이라 아이소 상자 대신 화면 기준으로 직접 그린다(기준점 = 받침 가운데)
    s = Spr(60); cx, cy = s.p(0, 0, 0); d = s.d; O = OUTLINE
    def px(x, y, c): d.point((cx + x, cy + y), fill=hexc(c) if isinstance(c, str) else c)
    def rect(x0, y0, x1, y1, c): d.rectangle([cx + x0, cy + y0, cx + x1, cy + y1], fill=hexc(c))
    if kind == 'basic':
        rect(-4, -2, 3, 0, '#2b3550'); rect(-3, -2, 2, -1, '#c5ccd8')
        rect(-1, -11, 0, -2, '#2b3550'); rect(-1, -10, -1, -3, '#8f99aa')
        d.polygon([(cx - 3, cy - 15), (cx + 2, cy - 15), (cx + 4, cy - 10), (cx - 5, cy - 10)], fill=hexc('#f6f8fb'), outline=O)
        rect(-3, -9, 2, -9, '#fff3b0')
    elif kind == 'brass':
        rect(-4, -2, 3, 0, '#2b3550'); rect(-3, -2, 2, -1, '#e0b456')
        d.line([(cx - 1, cy - 2), (cx - 3, cy - 10)], fill=hexc('#9e7426'), width=2)
        d.line([(cx - 3, cy - 10), (cx + 2, cy - 15)], fill=hexc('#9e7426'), width=2)
        d.polygon([(cx + 1, cy - 17), (cx + 5, cy - 17), (cx + 7, cy - 12), (cx - 1, cy - 12)], fill=hexc('#2c4775'), outline=O)
        rect(0, -11, 5, -10, '#fff3b0'); rect(1, -9, 4, -9, '#fff8d6')
    else:
        rect(-4, -3, 3, 0, '#2b3550'); rect(-3, -3, 2, -1, '#dcaa6e')
        s.ell(cx - 0.5, cy - 8, 4.5, 5, '#a8eedd'); s.ell(cx - 2, cy - 10, 1.5, 1.2, '#ffffff', out=False)
    s.save(name, 0)

# 커피 코너: 오른쪽 벽에 붙은 수납장(a=10, b=18) 위 기계
def cabinet(s):
    s.box(-5, -9, 0, 1, 1, 2, WOODD); s.box(4, 8, 0, 1, 1, 2, WOODD); s.box(-5, 8, 0, 1, 1, 2, WOODD)
    s.box(-5, -9, 2, 10, 18, 12, CREAM, top=WOOD)
    s.lface(-4, 9, 4, 4, 8, '#e6dac4'); s.lface(1, 9, 4, 3, 8, '#e6dac4')
    s.rface(5, -8, 4, 7, 8, '#e3d6bf'); s.rface(5, 0.5, 4, 7, 8, '#e3d6bf')
def coffee(name, kind):
    s = Spr(120); cabinet(s)
    if kind == 'basic':
        s.box(-3, -4, 14, 6, 6, 10, WHITE); s.box(-2, -3, 24, 4, 4, 5, '#8fb4ff', top='#c9dcff')
        s.rface(3, -2, 17, 2, 2, '#3b6fd8')
    elif kind == 'capsule':
        s.box(-3, -5, 14, 6, 6, 9, '#e25b52'); s.box(-3, -5, 23, 6, 6, 1, '#2b3550'); s.rface(3, -3.5, 16, 3, 3, '#2b3550')
        s.box(-2, 3, 14, 4, 4, 4, NAVY)
    elif kind == 'espresso':
        s.box(-3, -7, 14, 7, 9, 8, '#e7ebf0', right='#a9b2bf'); s.box(-3, -7, 22, 7, 9, 1, '#2b3550')
        s.rface(4, -5, 15, 5, 3, '#2b3550'); s.box(4.5, -4, 14, 1, 2, 2, WHITE)
        s.box(-2, 4, 14, 4, 4, 9, '#2b3550'); s.box(-2, 4, 23, 4, 4, 3, '#c9dcff')
    else:
        cx, cy = s.p(0, -3, 18); s.ell(cx, cy, 5, 4, '#a8eedd'); s.ell(cx + 4, cy - 1, 2, 1, '#3fc8a9')
        s.box(-1, 3, 14, 3, 3, 2, WHITE); s.box(-1, 7, 14, 3, 3, 2, WHITE); s.box(-3, 2, 14, 2, 6, 1, '#f1e1c4')
    s.save(name, 9)

# 러그(바닥)
def rug(name, fill, border, pat=None):
    s = Spr(160); a, b = 24, 28
    s.d.polygon([s.p(-a / 2, -b / 2), s.p(a / 2, -b / 2), s.p(a / 2, b / 2), s.p(-a / 2, b / 2)], fill=hexc(border))
    s.d.polygon([s.p(-a / 2 + 2, -b / 2 + 2), s.p(a / 2 - 2, -b / 2 + 2), s.p(a / 2 - 2, b / 2 - 2), s.p(-a / 2 + 2, b / 2 - 2)], fill=hexc(fill))
    if pat == 'stripe':
        for i in range(-int(a / 2) + 4, int(a / 2) - 2, 4):
            s.d.polygon([s.p(i, -b / 2 + 2), s.p(i + 2, -b / 2 + 2), s.p(i + 2, b / 2 - 2), s.p(i, b / 2 - 2)], fill=hexc('#a8eedd'))
    elif pat == 'check':
        for i in range(-10, 10, 4):
            for j in range(-12, 12, 4):
                if (i // 4 + j // 4) % 2 == 0:
                    s.d.polygon([s.p(i, j), s.p(i + 2, j), s.p(i + 2, j + 2), s.p(i, j + 2)], fill=hexc('#c9dcff'))
    elif pat == 'line':
        s.d.polygon([s.p(-a / 2 + 4, -b / 2 + 4), s.p(a / 2 - 4, -b / 2 + 4), s.p(a / 2 - 4, b / 2 - 4), s.p(-a / 2 + 4, b / 2 - 4)], outline=hexc('#8fb4ff'))
    s.save(name, -999)

# 전시 선반: 오른쪽 벽을 따라(a=24, b=8, h=20). 윗면에 기념품을 올림
SH_A, SH_B, SH_H = 24, 8, 20
def shelf(name, kind):
    s = Spr(140); x0, y0 = -SH_A / 2, -SH_B / 2
    if kind == 'basic':
        s.box(x0, y0, 0, SH_A, SH_B, SH_H, WHITE, right='#c9d0db')
        s.lface(x0 + 1, y0 + SH_B, 2, 11, 16, '#eef1f6'); s.lface(x0 + 12, y0 + SH_B, 2, 11, 16, '#eef1f6')
        s.d.point(s.p(x0 + 11, y0 + SH_B, 11), fill=hexc('#8f99aa')); s.d.point(s.p(x0 + 13, y0 + SH_B, 11), fill=hexc('#8f99aa'))
    elif kind == 'wood':
        s.box(x0, y0, 0, SH_A, SH_B, SH_H, WOOD, right=WOODD)
        cols = ['#3b6fd8', '#2c4775', '#3fc8a9', '#e25b52', '#f5c84c', '#8f7fe0', '#86b3df']
        for row, z in enumerate((3, 11)):
            s.lface(x0 + 1, y0 + SH_B, z, SH_A - 2, 7, '#8a5d33')
            x = x0 + 2; i = row
            while x < x0 + SH_A - 3:
                hgt = 5 + (i % 3 == 0)
                s.lface(x, y0 + SH_B, z, 1.6, hgt, cols[i % len(cols)]); x += 2 + (i % 4 == 3); i += 1
    else:
        s.box(x0, y0, 0, SH_A, SH_B, SH_H, NAVY, right='#1f3358')
        for xx in (x0 + 1.5, x0 + 12.5):
            s.lface(xx, y0 + SH_B, 2, 10, 16, '#c9dcff')
            s.d.line([s.p(xx + 2, y0 + SH_B, 16), s.p(xx + 5, y0 + SH_B, 9)], fill=(255, 255, 255, 220))
        s.lface(x0 + 4, y0 + SH_B, 3, 3, 4, '#f5c84c'); s.lface(x0 + 16, y0 + SH_B, 3, 3, 4, '#3fc8a9')
    s.save(name, SH_A / 2 + SH_B / 2)

def whiteboard():
    s = Spr(140)
    s.box(-1, -9, 0, 2, 1, 10, '#a9b2bf'); s.box(-1, 8, 0, 2, 1, 10, '#a9b2bf')
    s.box(-1, -11, 10, 1, 22, 16, '#e7ebf0', left='#e7ebf0', right=WHITE)
    s.rface(0, -9, 13, 18, 11, '#ffffff')
    for (yy, zz, c) in ((-7, 21, '#8fb4ff'), (-1, 19, '#3fc8a9'), (4, 22, '#e25b52')):
        s.rface(0, yy, zz, 3, 2, c)
    s.d.line([s.p(0, -4, 22), s.p(0, -1, 20)], fill=hexc('#3b6fd8')); s.d.line([s.p(0, 2, 20), s.p(0, 4, 22)], fill=hexc('#3b6fd8'))
    s.save('whiteboard', 0)
def beanbag():
    s = Spr(120); cx, cy = s.p(0, 0, 4)
    s.ell(cx, cy + 2, 13, 7, '#21907c'); s.ell(cx - 1, cy, 12, 6.5, '#3fc8a9'); s.ell(cx - 3, cy - 4, 7, 4.5, '#a8eedd'); s.ell(cx - 5, cy - 6, 2.5, 1.5, '#ffffff', out=False)
    s.save('beanbag', 0)
def arcade():
    s = Spr(140)
    s.box(-4, -4, 0, 8, 8, 30, NAVY, right='#1f3358')
    s.lface(-3, 4, 15, 6, 9, '#2b3550'); s.lface(-2.5, 4, 16, 5, 7, '#5e50b0')
    s.lface(-2, 4, 18, 1.5, 2, '#f5c84c'); s.lface(1, 4, 20, 1.5, 1.5, '#3fc8a9')
    s.box(-4, 4, 12, 8, 3, 2, '#3b6fd8'); s.lface(-3, 4, 26, 6, 3, '#f4a3bd')
    s.save('arcade', 4)

# 화분: 앞에서 본 잎(officeArt.ts 그림) + 아이소 화분
def plant_from_rows(name, rows, pal, pot):
    s = Spr(120)
    s.box(-3, -3, 0, 6, 6, 7, pot)
    px = s.p(0, 0, 7); w = len(rows[0]); h = len(rows)
    # 그림의 아래쪽 화분 부분(행 끝 7줄)은 잘라내고 잎만 사용
    leaf = [r for r in rows if not set(r) <= set('.')]
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch != '.' and y < h - 7:
                s.d.point((px[0] - w // 2 + x, px[1] - (h - 7) + y + 1), fill=hexc(pal[ch]))
    s.save(name, 3)

def build():
    desk_fixed()
    for n, k in (('lamp_basic', 'basic'), ('lamp_brass', 'brass'), ('lamp_mint', 'mint')): lamp(n, k)
    for n, k in (('coffee_basic', 'basic'), ('coffee_capsule', 'capsule'), ('coffee_espresso', 'espresso'), ('coffee_tea', 'tea')): coffee(n, k)
    rug('rug_navy', '#2c4775', '#8fb4ff', 'line'); rug('rug_mint', '#3fc8a9', '#21907c', 'stripe'); rug('rug_check', '#8fb4ff', '#3b6fd8', 'check')
    for n, k in (('shelf_basic', 'basic'), ('shelf_wood', 'wood'), ('shelf_glass', 'glass')): shelf(n, k)
    whiteboard(); beanbag(); arcade()
    # 화분 잎은 기존 앞모습 그림 재사용
    import re
    src = open('src/data/officeArt.ts').read()
    pal = json.loads(re.search(r'ART_PAL: Record<string, string> = (\{.*\})', src).group(1))
    arts = {m.group(1): json.loads(m.group(2)) for m in re.finditer(r'  (\w+): (\[.*\]),', src)}
    for n, pot in (('plant_basic', WHITE), ('monstera', WOOD), ('olive', '#d0774f'), ('palm', NAVY)):
        plant_from_rows(n, arts[n], pal, pot)
build()

meta = {'W': W, 'H': H, 'OX': OX, 'OY': OY, 'RX': RX, 'RY': RY, 'SHELF_H': SH_H}
with open('src/data/officeSprites.ts', 'w') as f:
    f.write('// 자동 생성 파일: scripts/office-room.py 를 고친 뒤 python3 scripts/office-room.py 로 다시 만드세요.\n')
    f.write('// 방 크기와 투영 원점, 가구 그림별 크기(w,h)와 기준점(ax,ay: 바닥 중심이 그림에서 놓이는 위치)\n')
    f.write(f'export const ROOM = {json.dumps(meta)}\n')
    f.write('export const SPRITES: Record<string, { w: number; h: number; ax: number; ay: number; front: number }> = ' + json.dumps(SPR, indent=1) + '\n')
print('room', W, H, len(SPR), 'sprites')

# 미리보기: 방 + 기본 배치
pv = room.copy()
def put(name, x, y, z=0):
    m = SPR[name]; im = Image.open(f'{OUT}/{name}.png'); sx, sy = P(x, y, z); pv.alpha_composite(im, (int(sx - m['ax']), int(sy - m['ay'])))
put('rug_navy', 34, 46); put('coffee_espresso', 22, 6); put('shelf_wood', 48, 5); put('desk_fixed', 8, 38); put('lamp_brass', 6, 30, 15)
put('palm', 6, 70); put('arcade', 58, 24)
pv.resize((W * 3, H * 3), Image.NEAREST).save('/tmp/room-preview.png')
