/**
 * Talking-portrait engine: animates a still photograph on a plain 2D canvas, on the CPU.
 *
 * How it works
 *  - The face is split into small triangles (a regular grid) only around the eyes, brows and
 *    mouth. Each frame the grid vertices are displaced by smooth, local fields and the photo's
 *    own pixels are re-drawn through those triangles (affine texture mapping).
 *  - Blink: the upper-lid region is compressed down onto the lower lid.
 *  - Speech: the jaw and lower lip drop, the upper lip lifts a little and the mouth widens or
 *    narrows. The gap between the lips is filled with a mouth interior (cavity, teeth, tongue).
 *  - The mouth drive (`open`, `wide`) is meant to come from the real audio signal
 *    (see audioEnergy.ts), so lip movement follows the voice that is actually playing.
 *
 * Honest limits: this is a 2D puppet of one photograph. It cannot turn the head, show real
 * teeth or reproduce exact phonemes; it gives convincing blinking and jaw/lip movement locked
 * to loudness and brightness of the voice, with no GPU and no cloud service.
 */
import type { DoctorFaceData } from './doctorFaceData'

export interface PortraitPose {
  /** 0..1 eyelid closure. */
  blink: number
  /** 0..1 mouth opening (from audio loudness). */
  open: number
  /** ~0.9 (rounded "oo") .. ~1.1 (spread "ee"); 1 is neutral. */
  wide: number
  /** 0..1 eyebrow lift. */
  brow: number
}

interface Cell {
  /** Source rectangle in image px. */
  x0: number
  y0: number
  x1: number
  y1: number
  zone: 'eyeL' | 'eyeR' | 'mouth' | 'browL' | 'browR'
  /** True for mouth cells that straddle the lip line (they open up when speaking). */
  seam: boolean
}

interface Anchors {
  eye: { cx: number; cy: number; w: number; lid: number; low: number; outer: number[]; inner: number[] }[]
  brow: { cx: number; cy: number; w: number }[]
  mouth: { cx: number; seam: number; w: number; innerHalf: number; top: number; bottom: number }
}

const CELL = 3.5

const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1])
const mean = (vals: number[]) => vals.reduce((s, v) => s + v, 0) / vals.length
const smooth = (t: number) => {
  const c = Math.max(0, Math.min(1, t))
  return c * c * (3 - 2 * c)
}

function buildAnchors(face: DoctorFaceData): Anchors {
  const p = face.points
  const eyeFrom = (a: number, b: number) => {
    const ring = p.slice(a, b)
    const w = dist(p[a], p[a + 3])
    return {
      cx: mean(ring.map((q) => q[0])),
      cy: mean(ring.map((q) => q[1])),
      w,
      lid: mean([p[a + 1][1], p[a + 2][1]]),
      low: mean([p[a + 4][1], p[a + 5][1]]),
      outer: p[a],
      inner: p[a + 3],
    }
  }
  const browFrom = (a: number, b: number) => {
    const ring = p.slice(a, b)
    return { cx: mean(ring.map((q) => q[0])), cy: mean(ring.map((q) => q[1])), w: dist(p[a], p[b - 1]) }
  }
  const inner = p.slice(60, 68)
  const seam = mean([p[61][1], p[62][1], p[63][1], p[65][1], p[66][1], p[67][1]])
  return {
    eye: [eyeFrom(36, 42), eyeFrom(42, 48)],
    brow: [browFrom(17, 22), browFrom(22, 27)],
    mouth: {
      cx: mean(inner.map((q) => q[0])),
      seam,
      w: dist(p[48], p[54]),
      innerHalf: dist(p[60], p[64]) / 2,
      top: Math.min(p[50][1], p[51][1], p[52][1]),
      bottom: Math.max(p[57][1], p[58][1], p[56][1]),
    },
  }
}

function buildCells(a: Anchors): Cell[] {
  const cells: Cell[] = []
  const add = (zone: Cell['zone'], x0: number, y0: number, x1: number, y1: number, seamY?: number, seamHalf?: number, cx?: number) => {
    for (let y = y0; y < y1; y += CELL) {
      for (let x = x0; x < x1; x += CELL) {
        const seam =
          seamY !== undefined && seamHalf !== undefined && cx !== undefined
            ? y < seamY + CELL * 0.6 && y + CELL > seamY - CELL * 0.6 && Math.abs(x + CELL / 2 - cx) < seamHalf
            : false
        cells.push({ x0: x, y0: y, x1: x + CELL, y1: y + CELL, zone, seam })
      }
    }
  }
  a.eye.forEach((e, i) => {
    const rx = e.w * 0.95
    add(i === 0 ? 'eyeL' : 'eyeR', e.cx - rx, e.lid - e.w * 0.85, e.cx + rx, e.low + e.w * 0.45)
  })
  a.brow.forEach((b, i) => add(i === 0 ? 'browL' : 'browR', b.cx - b.w * 0.7, b.cy - b.w * 0.32, b.cx + b.w * 0.7, b.cy + b.w * 0.34))
  const m = a.mouth
  add('mouth', m.cx - m.w * 0.9, m.top - m.w * 0.4, m.cx + m.w * 0.9, m.bottom + m.w * 0.85, m.seam, m.innerHalf * 0.98, m.cx)
  return cells
}

export class PortraitWarp {
  private readonly a: Anchors
  private readonly cells: Cell[]
  /** Pixel size the mouth interior grows to at full opening. */
  readonly maxOpenPx: number

  constructor(private readonly face: DoctorFaceData) {
    this.a = buildAnchors(face)
    this.cells = buildCells(this.a)
    this.maxOpenPx = this.a.mouth.w * 0.3
  }

  /** Displace one source point. Returns new [x, y]. */
  private displace(x: number, y: number, zone: Cell['zone'], pose: PortraitPose, openPx: number): [number, number] {
    const a = this.a
    if (zone === 'eyeL' || zone === 'eyeR') {
      const e = a.eye[zone === 'eyeL' ? 0 : 1]
      const gx = smooth(1 - Math.abs(x - e.cx) / (e.w * 0.95))
      if (y <= e.low) {
        // Upper lid and the skin just above it slide down onto the lower lid; the effect fades
        // out well before the brow so the brow never smears.
        const u = e.low - y
        const k = pose.blink * gx * (1 - smooth(u / (e.w * 0.6)))
        return [x, e.low - u * (1 - k * 0.96)]
      }
      const gy = smooth(1 - (y - e.low) / (e.w * 0.4))
      return [x, y - pose.blink * gx * gy * e.w * 0.06]
    }
    if (zone === 'browL' || zone === 'browR') {
      const b = a.brow[zone === 'browL' ? 0 : 1]
      const g = smooth(1 - Math.abs(x - b.cx) / (b.w * 0.7)) * smooth(1 - Math.abs(y - b.cy) / (b.w * 0.34))
      return [x, y - pose.brow * g * b.w * 0.07]
    }
    const m = a.mouth
    // Jaw drop is strongest at the centre and fades toward the mouth corners, which stay anchored.
    const wx = smooth(1 - Math.abs(x - m.cx) / (m.innerHalf * 1.3))
    const wxWide = smooth(1 - Math.abs(x - m.cx) / (m.w * 0.82))
    let ny = y
    if (y >= m.seam) {
      const t = (y - m.seam) / (m.w * 0.95)
      ny = y + openPx * wx * smooth(1 - t * 0.8)
    } else {
      const t = (m.seam - y) / (m.w * 0.42)
      ny = y - openPx * 0.16 * wx * smooth(1 - t)
    }
    const gy = smooth(1 - Math.abs(y - m.seam) / (m.w * 0.9))
    const nx = x + (x - m.cx) * (pose.wide - 1) * wxWide * gy
    return [nx, ny]
  }

  /**
   * Draw the animated face regions on top of an already-drawn base photo.
   * `ctx` must be set up so that image px (0..width, 0..height) map to the photo's placement.
   */
  draw(ctx: CanvasRenderingContext2D, img: CanvasImageSource, pose: PortraitPose) {
    const a = this.a
    const m = a.mouth
    const openPx = Math.max(0, pose.open) * this.maxOpenPx
    const mouthOpen = openPx > 0.35

    if (mouthOpen) this.drawMouthInterior(ctx, pose, openPx)

    for (const c of this.cells) {
      if (c.zone.startsWith('eye') && pose.blink < 0.01) continue
      if (c.zone.startsWith('brow') && pose.brow < 0.01) continue
      if (c.zone === 'mouth' && !mouthOpen && Math.abs(pose.wide - 1) < 0.01) continue
      const alpha = c.seam ? Math.max(0, 1 - openPx / (CELL * 1.2)) : 1
      if (alpha <= 0.02) continue
      const p00 = this.displace(c.x0, c.y0, c.zone, pose, openPx)
      const p10 = this.displace(c.x1, c.y0, c.zone, pose, openPx)
      const p01 = this.displace(c.x0, c.y1, c.zone, pose, openPx)
      const p11 = this.displace(c.x1, c.y1, c.zone, pose, openPx)
      ctx.globalAlpha = alpha
      this.tri(ctx, img, [c.x0, c.y0], [c.x1, c.y0], [c.x0, c.y1], p00, p10, p01)
      this.tri(ctx, img, [c.x1, c.y0], [c.x1, c.y1], [c.x0, c.y1], p10, p11, p01)
    }
    ctx.globalAlpha = 1

    if (pose.blink > 0.5) {
      // A soft lash line where the closed lid meets the cheek.
      for (const e of a.eye) {
        ctx.save()
        ctx.globalAlpha = Math.min(0.75, (pose.blink - 0.5) * 1.6)
        ctx.strokeStyle = '#2a1a17'
        ctx.lineWidth = Math.max(0.8, e.w * 0.055)
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(e.outer[0], e.outer[1] + e.w * 0.02)
        ctx.quadraticCurveTo(e.cx, e.low + e.w * 0.1, e.inner[0], e.inner[1] + e.w * 0.02)
        ctx.stroke()
        ctx.restore()
      }
    }
    void m
  }

  /** Fill the gap between the displaced inner-lip landmarks with a mouth interior. */
  private drawMouthInterior(ctx: CanvasRenderingContext2D, pose: PortraitPose, openPx: number) {
    const pts = this.face.points
    const m = this.a.mouth
    const at = (i: number): [number, number] => this.displace(pts[i][0], pts[i][1], 'mouth', pose, openPx)
    // inner upper edge left->right, then inner lower edge right->left
    const upper = [60, 61, 62, 63, 64].map(at)
    const lower = [64, 65, 66, 67, 60].map(at)
    // Tuck the interior slightly inside the lips so no cavity colour spills onto them.
    const inset = (q: [number, number], up: boolean): [number, number] => [q[0], q[1] + (up ? 0.5 : -0.5)]
    const path = new Path2D()
    path.moveTo(upper[0][0], upper[0][1])
    for (let i = 1; i < upper.length; i++) {
      const [x, y] = inset(upper[i], true)
      const [px, py] = inset(upper[i - 1], true)
      path.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2)
    }
    for (let i = 1; i < lower.length; i++) {
      const [x, y] = inset(lower[i], false)
      const [px, py] = inset(lower[i - 1], false)
      path.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2)
    }
    path.closePath()
    const top = Math.min(...upper.map((q) => q[1]))
    const bottom = Math.max(...lower.map((q) => q[1]))
    const h = Math.max(1, bottom - top)
    ctx.save()
    ctx.clip(path)
    const g = ctx.createLinearGradient(0, top, 0, bottom)
    g.addColorStop(0, '#2b1013')
    g.addColorStop(1, '#4a1c20')
    ctx.fillStyle = g
    ctx.fillRect(m.cx - m.w, top - 1, m.w * 2, h + 2)
    if (openPx > this.maxOpenPx * 0.22) {
      // Upper teeth peeking under the upper lip.
      const th = Math.min(h * 0.42, openPx * 0.55)
      const tg = ctx.createLinearGradient(0, top, 0, top + th)
      tg.addColorStop(0, 'rgba(236,229,220,0.92)')
      tg.addColorStop(1, 'rgba(206,196,188,0.55)')
      ctx.fillStyle = tg
      ctx.fillRect(m.cx - m.innerHalf * 0.8, top - 1, m.innerHalf * 1.6, th + 1)
    }
    if (openPx > this.maxOpenPx * 0.4) {
      ctx.fillStyle = 'rgba(150, 70, 74, 0.8)'
      ctx.beginPath()
      ctx.ellipse(m.cx, bottom - h * 0.12, m.innerHalf * 0.5, h * 0.26, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  /** Draw the source triangle (s0,s1,s2) of `img` onto the destination triangle (d0,d1,d2). */
  private tri(
    ctx: CanvasRenderingContext2D,
    img: CanvasImageSource,
    s0: number[], s1: number[], s2: number[],
    d0: number[], d1: number[], d2: number[],
  ) {
    // Inflate the destination triangle a hair so neighbouring triangles overlap (no seams).
    const cx = (d0[0] + d1[0] + d2[0]) / 3
    const cy = (d0[1] + d1[1] + d2[1]) / 3
    const grow = (d: number[]) => {
      const vx = d[0] - cx
      const vy = d[1] - cy
      const l = Math.hypot(vx, vy) || 1
      return [d[0] + (vx / l) * 0.45, d[1] + (vy / l) * 0.45]
    }
    const g0 = grow(d0), g1 = grow(d1), g2 = grow(d2)
    const den = s0[0] * (s1[1] - s2[1]) + s1[0] * (s2[1] - s0[1]) + s2[0] * (s0[1] - s1[1])
    if (Math.abs(den) < 1e-9) return
    const a = (d0[0] * (s1[1] - s2[1]) + d1[0] * (s2[1] - s0[1]) + d2[0] * (s0[1] - s1[1])) / den
    const b = (d0[1] * (s1[1] - s2[1]) + d1[1] * (s2[1] - s0[1]) + d2[1] * (s0[1] - s1[1])) / den
    const c = (d0[0] * (s2[0] - s1[0]) + d1[0] * (s0[0] - s2[0]) + d2[0] * (s1[0] - s0[0])) / den
    const d = (d0[1] * (s2[0] - s1[0]) + d1[1] * (s0[0] - s2[0]) + d2[1] * (s1[0] - s0[0])) / den
    const e = (d0[0] * (s1[0] * s2[1] - s2[0] * s1[1]) + d1[0] * (s2[0] * s0[1] - s0[0] * s2[1]) + d2[0] * (s0[0] * s1[1] - s1[0] * s0[1])) / den
    const f = (d0[1] * (s1[0] * s2[1] - s2[0] * s1[1]) + d1[1] * (s2[0] * s0[1] - s0[0] * s2[1]) + d2[1] * (s0[0] * s1[1] - s1[0] * s0[1])) / den
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(g0[0], g0[1])
    ctx.lineTo(g1[0], g1[1])
    ctx.lineTo(g2[0], g2[1])
    ctx.closePath()
    ctx.clip()
    ctx.transform(a, b, c, d, e, f)
    ctx.drawImage(img, 0, 0)
    ctx.restore()
  }
}
