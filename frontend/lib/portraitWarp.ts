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
  mouth: {
    cx: number
    cy: number
    cos: number
    sin: number
    /** Lip-contact curve in the mouth frame: v = a + b*u + c*u^2. */
    a: number
    b: number
    c: number
    w: number
    innerHalf: number
    top: number
    bottom: number
  }
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
  const left = p[60]
  const right = p[64]
  const cx = (left[0] + right[0]) / 2
  const cy = (left[1] + right[1]) / 2
  const theta = Math.atan2(right[1] - left[1], right[0] - left[0])
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)
  const avg = (i: number, j: number) => [(p[i][0] + p[j][0]) / 2, (p[i][1] + p[j][1]) / 2]
  const lineSamples = [left, avg(61, 67), avg(62, 66), avg(63, 65), right].map((q) => {
    const dx = q[0] - cx
    const dy = q[1] - cy
    return { u: dx * cos + dy * sin, v: -dx * sin + dy * cos }
  })
  const [qa, qb, qc] = fitQuadratic(lineSamples)
  const outerY = p.slice(48, 60).map((q) => q[1])
  return {
    eye: [eyeFrom(36, 42), eyeFrom(42, 48)],
    brow: [browFrom(17, 22), browFrom(22, 27)],
    mouth: {
      cx,
      cy,
      cos,
      sin,
      a: qa,
      b: qb,
      c: qc,
      w: dist(p[48], p[54]),
      innerHalf: dist(left, right) / 2,
      top: Math.min(...outerY),
      bottom: Math.max(...outerY),
    },
  }
}

/** Least-squares fit of v = a + b*u + c*u^2. */
function fitQuadratic(samples: { u: number; v: number }[]): [number, number, number] {
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, t0 = 0, t1 = 0, t2 = 0
  for (const { u, v } of samples) {
    s0 += 1; s1 += u; s2 += u * u; s3 += u * u * u; s4 += u * u * u * u
    t0 += v; t1 += u * v; t2 += u * u * v
  }
  const det = (m: number[][]) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  const A = [[s0, s1, s2], [s1, s2, s3], [s2, s3, s4]]
  const D = det(A)
  if (Math.abs(D) < 1e-9) return [t0 / s0, 0, 0]
  const rep = (col: number) => A.map((row, i) => row.map((val, j) => (j === col ? [t0, t1, t2][i] : val)))
  return [det(rep(0)) / D, det(rep(1)) / D, det(rep(2)) / D]
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
  add('mouth', m.cx - m.w * 0.95, m.top - m.w * 0.45, m.cx + m.w * 0.95, m.bottom + m.w * 0.85)
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
    this.maxOpenPx = this.a.mouth.w * 0.22
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
    // Work in the mouth's own frame (u along the lip line, v across it) so a head tilt opens the
    // mouth perpendicular to the lips instead of straight down the screen.
    const dx = x - m.cx
    const dy = y - m.cy
    const u = dx * m.cos + dy * m.sin
    const v0 = -dx * m.sin + dy * m.cos
    const v = v0 - (m.a + m.b * u + m.c * u * u)
    // Jaw drop is strongest at the centre and fades toward the corners, which stay anchored.
    const wu = smooth(1 - Math.abs(u) / (m.innerHalf * 1.3))
    let dv = 0
    if (v >= 0) dv = openPx * wu * smooth(1 - (v / (m.w * 0.95)) * 0.8)
    else dv = -openPx * 0.16 * wu * smooth(1 - -v / (m.w * 0.42))
    const wideU = smooth(1 - Math.abs(u) / (m.w * 0.82))
    const gv = smooth(1 - Math.abs(v) / (m.w * 0.9))
    const nu = u + u * (pose.wide - 1) * wideU * gv
    const nv0 = v0 + dv
    return [m.cx + nu * m.cos - nv0 * m.sin, m.cy + nu * m.sin + nv0 * m.cos]
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

    for (const c of this.cells) {
      if (c.zone.startsWith('eye') && pose.blink < 0.01) continue
      if (c.zone.startsWith('brow') && pose.brow < 0.01) continue
      if (c.zone === 'mouth' && !mouthOpen && Math.abs(pose.wide - 1) < 0.01) continue
      const p00 = this.displace(c.x0, c.y0, c.zone, pose, openPx)
      const p10 = this.displace(c.x1, c.y0, c.zone, pose, openPx)
      const p01 = this.displace(c.x0, c.y1, c.zone, pose, openPx)
      const p11 = this.displace(c.x1, c.y1, c.zone, pose, openPx)
      this.tri(ctx, img, [c.x0, c.y0], [c.x1, c.y0], [c.x0, c.y1], p00, p10, p01)
      this.tri(ctx, img, [c.x1, c.y0], [c.x1, c.y1], [c.x0, c.y1], p10, p11, p01)
    }
    ctx.globalAlpha = 1

    // Painted over the stretched lips: the interior sits exactly in the gap between the displaced
    // inner-lip landmarks.
    if (mouthOpen) this.drawMouthInterior(ctx, pose, openPx)

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

  /** Fill the gap between the displaced inner-lip landmarks with a soft, shaded mouth interior. */
  private drawMouthInterior(ctx: CanvasRenderingContext2D, pose: PortraitPose, openPx: number) {
    const pts = this.face.points
    const m = this.a.mouth
    const at = (i: number): [number, number] => this.displace(pts[i][0], pts[i][1], 'mouth', pose, openPx)
    // Inner-lip loop: left corner, upper edge L->R, right corner, lower edge R->L.
    const loop = [60, 61, 62, 63, 64, 65, 66, 67].map(at)
    const cx = loop.reduce((sum, q) => sum + q[0], 0) / loop.length
    const cy = loop.reduce((sum, q) => sum + q[1], 0) / loop.length
    // Pull the outline slightly inside the lips so interior colour never spills onto them.
    const ring = loop.map((q): [number, number] => [cx + (q[0] - cx) * 0.94, cy + (q[1] - cy) * 0.86])
    const top = Math.min(...ring.map((q) => q[1]))
    const bottom = Math.max(...ring.map((q) => q[1]))
    const left = Math.min(...ring.map((q) => q[0]))
    const right = Math.max(...ring.map((q) => q[0]))
    const h = Math.max(0.5, bottom - top)
    const w = Math.max(1, right - left)

    // A smooth closed curve through the loop (midpoint quadratic technique): a lens, not a polygon.
    const path = new Path2D()
    const n = ring.length
    const mid = (i: number): [number, number] => {
      const q = ring[i % n]
      const r = ring[(i + 1) % n]
      return [(q[0] + r[0]) / 2, (q[1] + r[1]) / 2]
    }
    const start = mid(n - 1)
    path.moveTo(start[0], start[1])
    for (let i = 0; i < n; i++) {
      const c = ring[i]
      const e = mid(i)
      path.quadraticCurveTo(c[0], c[1], e[0], e[1])
    }
    path.closePath()

    // Soft-edged base so the opening melts into the lips instead of having a cut-out edge.
    ctx.save()
    ctx.filter = `blur(${Math.max(0.35, h * 0.06).toFixed(2)}px)`
    const base = ctx.createLinearGradient(0, top, 0, bottom)
    base.addColorStop(0, '#2a0f12')
    base.addColorStop(0.55, '#4a1b1f')
    base.addColorStop(1, '#6a2d31')
    ctx.fillStyle = base
    ctx.fill(path)
    ctx.restore()

    // Details are clipped to a slightly smaller outline and lightly blurred.
    const innerPath = new Path2D()
    const sc = (q: [number, number]): [number, number] => [cx + (q[0] - cx) * 0.9, cy + (q[1] - cy) * 0.84]
    const r2 = ring.map(sc)
    const mid2 = (i: number): [number, number] => {
      const q = r2[i % n]
      const r = r2[(i + 1) % n]
      return [(q[0] + r[0]) / 2, (q[1] + r[1]) / 2]
    }
    const s2 = mid2(n - 1)
    innerPath.moveTo(s2[0], s2[1])
    for (let i = 0; i < n; i++) {
      const c = r2[i]
      const e = mid2(i)
      innerPath.quadraticCurveTo(c[0], c[1], e[0], e[1])
    }
    innerPath.closePath()
    ctx.save()
    ctx.clip(innerPath)
    ctx.filter = `blur(${Math.max(0.3, h * 0.035).toFixed(2)}px)`

    // Tongue: only once the mouth is open enough to see it.
    if (openPx > this.maxOpenPx * 0.3) {
      const tg = ctx.createRadialGradient(cx, bottom - h * 0.1, 0, cx, bottom - h * 0.1, w * 0.36)
      tg.addColorStop(0, 'rgba(188,104,108,0.95)')
      tg.addColorStop(1, 'rgba(120,52,58,0)')
      ctx.fillStyle = tg
      ctx.fillRect(left, top, w, h + 2)
    }

    // Upper teeth: curved along the upper lip, soft top shade, darker toward the corners.
    if (openPx > this.maxOpenPx * 0.14) {
      const th = Math.min(h * 0.5, Math.max(1, openPx * 0.7))
      const tx = cx - w * 0.32
      const tw = w * 0.64
      const tg = ctx.createLinearGradient(0, top, 0, top + th)
      tg.addColorStop(0, 'rgba(176,164,154,0.95)')
      tg.addColorStop(0.45, 'rgba(222,214,203,0.96)')
      tg.addColorStop(1, 'rgba(184,172,162,0.55)')
      ctx.fillStyle = tg
      ctx.fillRect(tx, top - 0.5, tw, th + 0.5)
      // faint gaps between incisors
      ctx.fillStyle = 'rgba(90,60,55,0.1)'
      for (const f of [0.25, 0.5, 0.75]) ctx.fillRect(tx + tw * f - 0.2, top, 0.45, th)
      // fade at the sides: teeth sit deeper in the mouth there
      const sg = ctx.createLinearGradient(tx, 0, tx + tw, 0)
      sg.addColorStop(0, 'rgba(42,16,18,0.85)')
      sg.addColorStop(0.28, 'rgba(42,16,18,0)')
      sg.addColorStop(0.72, 'rgba(42,16,18,0)')
      sg.addColorStop(1, 'rgba(42,16,18,0.85)')
      ctx.fillStyle = sg
      ctx.fillRect(tx, top - 0.5, tw, th + 0.5)
    }

    // The upper lip shades the interior; a dark inner edge sells the depth.
    const shade = ctx.createLinearGradient(0, top, 0, top + h * 0.55)
    shade.addColorStop(0, 'rgba(10,2,3,0.55)')
    shade.addColorStop(1, 'rgba(10,2,3,0)')
    ctx.fillStyle = shade
    ctx.fillRect(left - 2, top - 2, w + 4, h * 0.6 + 2)
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
