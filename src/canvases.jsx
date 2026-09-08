import { useEffect, useRef } from 'react'
import { useScrub, useTickerInView, reducedMotion } from './engine'

/* ---------- shared contour field (marching squares) ---------- */
const LINE_SCALE = 3.8
const LINE_COUNT = 2.5
const WAVE_AMOUNT = 0.37
const WAVE_SPEED = 1.66
const LINE_OPACITY = 0.85
const CELLS = 96

const field = (x, y, t) => {
  let f = Math.sin(x * 1.0 + t * 0.6) * 0.5
  f += Math.sin(y * 0.85 - t * 0.45) * 0.45
  f += Math.sin((x + y) * 0.65 + t * 0.35) * 0.35
  f += Math.sin((x - y) * 0.95 - t * 0.55) * 0.25
  return f * 0.5 + 0.5
}

export function drawContours(context, width, height, t, colour) {
  const cols = width >= height ? CELLS : Math.max(8, Math.round((CELLS * width) / height))
  const rows = Math.max(8, Math.round((cols * height) / width))
  const stepX = width / cols
  const stepY = height / rows
  const aspect = width / height
  const values = new Float32Array((cols + 1) * (rows + 1))
  for (let j = 0; j <= rows; j += 1)
    for (let i = 0; i <= cols; i += 1) {
      const nx = ((i / cols) * 2 - 1) * aspect * LINE_SCALE
      const ny = ((j / rows) * 2 - 1) * LINE_SCALE
      const qx = nx + Math.sin(ny * 0.8 + t * 0.7) * WAVE_AMOUNT
      const qy = ny + Math.cos(nx * 0.7 - t * 0.6) * WAVE_AMOUNT
      values[j * (cols + 1) + i] = field(qx, qy, t) * LINE_COUNT
    }
  context.strokeStyle = colour
  context.lineWidth = 1
  context.globalAlpha = LINE_OPACITY
  context.beginPath()
  const segment = (p, q) => {
    context.moveTo(p[0], p[1])
    context.lineTo(q[0], q[1])
  }
  for (let level = 0.5; level < LINE_COUNT; level += 1)
    for (let j = 0; j < rows; j += 1)
      for (let i = 0; i < cols; i += 1) {
        const a = values[j * (cols + 1) + i]
        const b = values[j * (cols + 1) + i + 1]
        const c = values[(j + 1) * (cols + 1) + i + 1]
        const d = values[(j + 1) * (cols + 1) + i]
        const index = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0)
        if (index === 0 || index === 15) continue
        const x0 = i * stepX
        const y0 = j * stepY
        const top = [x0 + stepX * ((level - a) / (b - a)), y0]
        const right = [x0 + stepX, y0 + stepY * ((level - b) / (c - b))]
        const bottom = [x0 + stepX * ((level - d) / (c - d)), y0 + stepY]
        const left = [x0, y0 + stepY * ((level - a) / (d - a))]
        switch (index) {
          case 1: case 14: segment(left, bottom); break
          case 2: case 13: segment(bottom, right); break
          case 3: case 12: segment(left, right); break
          case 4: case 11: segment(top, right); break
          case 6: case 9: segment(top, bottom); break
          case 7: case 8: segment(left, top); break
          case 5: segment(left, top); segment(bottom, right); break
          case 10: segment(left, bottom); segment(top, right); break
          default: break
        }
      }
  context.stroke()
  context.globalAlpha = 1
}

export function ContourCanvas({ colour, className = '' }) {
  const ref = useRef(null)
  const start = useRef(performance.now())
  useTickerInView(
    ref,
    (now) => {
      const canvas = ref.current
      if (!canvas) return
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (!w || !h) return
      if (canvas.width !== Math.round(w * ratio) || canvas.height !== Math.round(h * ratio)) {
        canvas.width = Math.round(w * ratio)
        canvas.height = Math.round(h * ratio)
      }
      const ctx = canvas.getContext('2d')
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      ctx.clearRect(0, 0, w, h)
      const t = reducedMotion ? 0 : ((now - start.current) / 1000) * WAVE_SPEED
      drawContours(ctx, w, h, t, colour)
    },
    24,
  )
  return <canvas ref={ref} className={`contours ${className}`} aria-hidden="true" />
}

/* ---------- chequered dissolve ---------- */
const CELL = 24
const SOLID_UNTIL = 0.16
const LIFT = 2
const ACCENT_SHARE = 0.06
const noise = (x, y) => {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}
const clamp01 = (v) => Math.min(1, Math.max(0, v))

export function ChequerDissolve({ carry = 'light', zIndex = 10 }) {
  const ref = useRef(null)
  const progressRef = useRef(0)

  const render = () => {
    const canvas = ref.current
    if (!canvas) return
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (!width || !height) return
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    const ctx = canvas.getContext('2d')
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.clearRect(0, 0, width, height)
    const styles = getComputedStyle(document.documentElement)
    const surface = carry === 'light' ? styles.getPropertyValue('--background').trim() : styles.getPropertyValue('--surface-black').trim()
    const accent = styles.getPropertyValue('--accent').trim()
    const cell = CELL
    const columns = Math.ceil(width / cell)
    const rows = Math.ceil(height / cell)
    const lift = progressRef.current * LIFT
    for (let y = 0; y < rows; y += 1) {
      const depth = y / Math.max(1, rows - 1) + lift
      if (depth > 1) break
      const solid = depth <= SOLID_UNTIL
      const fade = clamp01(1 - (depth - SOLID_UNTIL) / (1 - SOLID_UNTIL))
      if (!solid && fade <= 0) break
      for (let x = 0; x < columns; x += 1) {
        if (!solid) {
          if ((x + y) % 2 !== 0) continue
          if (noise(x, y) > fade) continue
        }
        ctx.fillStyle = !solid && noise(x + 101, y + 57) < ACCENT_SHARE ? accent : surface
        ctx.fillRect(x * cell, y * cell, cell, cell)
      }
    }
  }

  useScrub(ref, 'top bottom', 'top top', (p) => {
    progressRef.current = p
    render()
  })
  useEffect(() => {
    render()
    window.addEventListener('resize', render)
    return () => window.removeEventListener('resize', render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <canvas ref={ref} className="chequer" style={{ zIndex }} aria-hidden="true" />
}
