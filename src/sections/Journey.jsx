// "The journey so far" — dark surface, instrument map, the world route traced in one pass.
import { useEffect, useRef, useState } from 'react'
import { CFG, useAnimated, useInView, useTickerInView, easeInOutSine, easeOutCubic, reducedMotion } from '../engine'
import { Words, Letters } from '../text'
import { ChequerDissolve } from '../canvases'

// The route: Munich → Berkeley → Boston → Dubai, laid on a 1440x800 artboard as a closed loop.
const ROUTE = (() => {
  const pts = []
  const anchors = [
    [880, 300], [1000, 250], [1120, 290], [1180, 380], [1130, 470], [1020, 520],
    [900, 540], [780, 500], [700, 420], [720, 330], [800, 290], [880, 300],
  ]
  // Catmull-Rom resample to 3-unit steps
  const cr = (p0, p1, p2, p3, t) => {
    const t2 = t * t, t3 = t2 * t
    return [
      0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
      0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
    ]
  }
  const n = anchors.length - 1
  for (let i = 0; i < n; i++) {
    const p0 = anchors[(i - 1 + n) % n], p1 = anchors[i], p2 = anchors[i + 1], p3 = anchors[(i + 2) % n]
    for (let s = 0; s < 40; s++) pts.push(cr(p0, p1, p2, p3, s / 40))
  }
  pts.push(anchors[0])
  return pts
})()
const CUM = ROUTE.reduce((acc, p, i) => {
  if (i === 0) return [0]
  const q = ROUTE[i - 1]
  acc.push(acc[i - 1] + Math.hypot(p[0] - q[0], p[1] - q[1]))
  return acc
}, [])
const TOTAL = CUM[CUM.length - 1]
const MARKERS = [
  { x: 1000, y: 250, d: 0.09 },
  { x: 1180, y: 380, d: 0.28 },
  { x: 900, y: 540, d: 0.55 },
  { x: 720, y: 330, d: 0.82 },
]
const CORNER_BRAKE = 9
const TIME_AT = (() => {
  const count = ROUTE.length
  const turn = new Array(count).fill(0)
  for (let i = 1; i < count - 1; i++) {
    const [ax, ay] = ROUTE[i - 1], [bx, by] = ROUTE[i], [cx, cy] = ROUTE[i + 1]
    const ux = bx - ax, uy = by - ay, vx = cx - bx, vy = cy - by
    const l = (Math.hypot(ux, uy) || 1) * (Math.hypot(vx, vy) || 1)
    turn[i] = Math.acos(Math.min(1, Math.max(-1, (ux * vx + uy * vy) / l)))
  }
  const sm = turn.map((_, i) => {
    let s = 0, n = 0
    for (let j = Math.max(0, i - 6); j <= Math.min(count - 1, i + 6); j++) { s += turn[j]; n++ }
    return s / n
  })
  const acc = [0]
  for (let i = 1; i < count; i++) acc.push(acc[i - 1] + (CUM[i] - CUM[i - 1]) / (1 / (1 + CORNER_BRAKE * sm[i])))
  const total = acc[count - 1] || 1
  return acc.map((v) => v / total)
})()
const distanceAtTime = (time) => {
  if (time <= 0) return 0
  if (time >= 1) return TOTAL
  let lo = 0, hi = TIME_AT.length - 1
  while (lo < hi - 1) { const mid = (lo + hi) >> 1; if (TIME_AT[mid] <= time) lo = mid; else hi = mid }
  const span = TIME_AT[hi] - TIME_AT[lo] || 1
  return CUM[lo] + (CUM[hi] - CUM[lo]) * ((time - TIME_AT[lo]) / span)
}
const trailUpTo = (distance) => {
  const out = []
  for (let i = 0; i < ROUTE.length; i++) {
    if (CUM[i] <= distance) { out.push(ROUTE[i]); continue }
    const a = ROUTE[i - 1], b = ROUTE[i]
    const r = (distance - CUM[i - 1]) / (CUM[i] - CUM[i - 1])
    out.push([a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r])
    break
  }
  return out
}
const ACCENT = [2, 210, 227]
const WHITE = [255, 255, 255]
const BRIGHT = [141, 243, 250]
const rgba = ([r, g, b], a) => `rgb(${r} ${g} ${b} / ${a})`
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))

function strokePts(ctx, pts, from = 0) {
  ctx.beginPath()
  ctx.moveTo(pts[from][0], pts[from][1])
  for (let i = from + 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
  ctx.stroke()
}

function Trace({ lap, heat, pointer }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = 1440 * ratio
    canvas.height = 800 * ratio
    const ctx = canvas.getContext('2d')
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.clearRect(0, 0, 1440, 800)
    const distance = distanceAtTime(lap)
    const pts = trailUpTo(distance)
    if (pts.length > 1) {
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      ctx.strokeStyle = rgba(ACCENT, 0.05); ctx.lineWidth = 15; strokePts(ctx, pts)
      ctx.strokeStyle = rgba(ACCENT, 0.1); ctx.lineWidth = 15 * 0.45; strokePts(ctx, pts)
      ctx.restore()
      const head = 70
      const from = Math.max(0, pts.length - head)
      const tip = pts[pts.length - 1]
      const hot = ctx.createLinearGradient(pts[from][0], pts[from][1], tip[0], tip[1])
      hot.addColorStop(0, rgba(ACCENT, 0))
      hot.addColorStop(0.45, rgba(ACCENT, 0.9))
      hot.addColorStop(1, rgba(mix(ACCENT, BRIGHT, heat), 1))
      ctx.strokeStyle = rgba(ACCENT, 1); ctx.lineWidth = 5.9; strokePts(ctx, pts)
      ctx.strokeStyle = hot; strokePts(ctx, pts, from)
      const coreFrom = Math.max(0, pts.length - Math.round(head * 0.42))
      if (pts.length - coreFrom > 1) {
        const core = ctx.createLinearGradient(pts[coreFrom][0], pts[coreFrom][1], tip[0], tip[1])
        core.addColorStop(0, rgba(BRIGHT, 0))
        core.addColorStop(1, rgba(WHITE, 0.95 * heat))
        ctx.strokeStyle = core; ctx.lineWidth = 5.9 * 0.38; strokePts(ctx, pts, coreFrom)
      }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'
      const spark = ctx.createRadialGradient(tip[0], tip[1], 0, tip[0], tip[1], 15)
      spark.addColorStop(0, rgba(WHITE, 0.85 * heat)); spark.addColorStop(0.35, rgba(BRIGHT, 0.4 * heat)); spark.addColorStop(1, rgba(ACCENT, 0))
      ctx.fillStyle = spark; ctx.beginPath(); ctx.arc(tip[0], tip[1], 15, 0, Math.PI * 2); ctx.fill(); ctx.restore()
    }
    for (const mk of MARKERS) {
      const md = mk.d * TOTAL
      if (distance < md) continue
      const age = Math.min(1, (distance - md) / 90)
      const radius = 12 + (1 - age) * 14
      const glow = ctx.createRadialGradient(mk.x, mk.y, 0, mk.x, mk.y, radius)
      glow.addColorStop(0, rgba(BRIGHT, 0.5 + 0.45 * (1 - age))); glow.addColorStop(0.45, rgba(ACCENT, 0.32)); glow.addColorStop(1, rgba(ACCENT, 0))
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = glow
      ctx.beginPath(); ctx.arc(mk.x, mk.y, radius, 0, Math.PI * 2); ctx.fill(); ctx.restore()
      if (age < 1) { ctx.strokeStyle = rgba(BRIGHT, (1 - age) * 0.6); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(mk.x, mk.y, 9 + age * 20, 0, Math.PI * 2); ctx.stroke() }
    }
    // reticle
    if (pointer && pointer.heat > 0.01) {
      ctx.save()
      ctx.globalAlpha = pointer.heat
      ctx.strokeStyle = rgba(ACCENT, 0.7)
      ctx.lineWidth = 1
      const reach = 420 * pointer.spread
      ctx.beginPath(); ctx.moveTo(pointer.x - reach, pointer.y); ctx.lineTo(pointer.x + reach, pointer.y)
      ctx.moveTo(pointer.x, pointer.y - reach); ctx.lineTo(pointer.x, pointer.y + reach); ctx.stroke()
      // chequer at the crossing
      const cell = 7.8
      for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
        if ((i + j) & 1) continue
        const d = Math.hypot(i, j) / 4
        if (d > 1) continue
        ctx.fillStyle = rgba(d < 0.3 ? WHITE : BRIGHT, (1 - d) * 0.9)
        ctx.fillRect(pointer.x + i * cell - cell / 2, pointer.y + j * cell - cell / 2, cell, cell)
      }
      ctx.restore()
    }
  }, [lap, heat, pointer])
  return <canvas ref={ref} className="trace" aria-hidden="true" style={{ width: 1440, height: 800 }} />
}

function Stage({ armed, setArmed }) {
  const frameRef = useRef(null)
  const stageRef = useRef(null)
  const [lap, setLap] = useState(0)
  const [heat, setHeat] = useState(1)
  const [pointer, setPointer] = useState(null)
  const lapStart = useRef(null)
  const cooling = useRef(null)
  const state = useRef({ x: 0, y: 0, heat: 0, spread: 0, tx: 0, ty: 0, on: false, last: 0 })
  const scaleRef = useRef({ s: 1, tx: 0, ty: 0 })

  // fit: cover from 1024, fit-width below
  useEffect(() => {
    const fit = () => {
      const f = frameRef.current
      const st = stageRef.current
      if (!f || !st) return
      const w = f.clientWidth, h = f.clientHeight
      let s, tx, ty
      if (w >= 1024) {
        s = Math.max(w / 1440, h / 800); tx = (w - 1440 * s) / 2; ty = (h - 800 * s) / 2
      } else {
        const bw = 580
        s = w / bw; tx = w / 2 - 940 * s; ty = h / 2 - 400 * s
      }
      scaleRef.current = { s, tx, ty }
      st.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  // lap on arrival
  useEffect(() => {
    const f = frameRef.current
    if (!f) return
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && lapStart.current === null) {
        lapStart.current = performance.now()
        io.disconnect()
      }
    }, { threshold: 0.35 })
    io.observe(f)
    return () => io.disconnect()
  }, [])

  useTickerInView(frameRef, (now) => {
    if (lapStart.current !== null && lap < 1) {
      const p = reducedMotion ? 1 : Math.min(1, (now - lapStart.current) / 6000)
      setLap(easeInOutSine(p))
      if (p >= 1) cooling.current = now
    } else if (cooling.current !== null && heat > 0) {
      const p = Math.min(1, (now - cooling.current) / 800)
      setHeat(1 - easeOutCubic(p))
      if (p >= 1) setArmed(true)
    }
    if (armed) {
      const s = state.current
      const dt = s.last ? Math.min(0.1, (now - s.last) / 1000) : 0
      s.last = now
      const wanted = s.on ? 0.95 : 0
      const approach = (a, b, tau) => b + (a - b) * Math.exp(-dt / tau)
      if (s.heat <= 0.001 && wanted > 0) { s.x = s.tx; s.y = s.ty }
      else if (dt > 0) {
        const px = s.x, py = s.y
        s.x = approach(s.x, s.tx, 0.07); s.y = approach(s.y, s.ty, 0.07)
        const speed = Math.hypot(s.x - px, s.y - py) / dt
        const ws = Math.max(0, 1 - speed / 900)
        s.spread = approach(s.spread, ws, ws > s.spread ? 0.38 : 0.09)
      }
      s.heat = approach(s.heat, wanted, wanted > s.heat ? 0.14 : 0.3)
      if (s.heat < 0.005) { s.heat = 0; s.spread = 0 }
      setPointer({ x: s.x, y: s.y, heat: s.heat, spread: s.spread })
    }
  }, 16)

  useEffect(() => {
    if (!armed || window.matchMedia('(hover: none)').matches || reducedMotion) return
    const f = frameRef.current
    const onMove = (e) => {
      const r = f.getBoundingClientRect()
      const { s, tx, ty } = scaleRef.current
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
      state.current.on = inside
      state.current.tx = (e.clientX - r.left - tx) / s
      state.current.ty = (e.clientY - r.top - ty) / s
    }
    const off = () => (state.current.on = false)
    window.addEventListener('pointermove', onMove)
    document.addEventListener('pointerleave', off)
    window.addEventListener('blur', off)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', off)
      window.removeEventListener('blur', off)
    }
  }, [armed])

  return (
    <div ref={frameRef} className="stage-frame" aria-hidden="true">
      <div ref={stageRef} className="stage">
        <MapSvg lap={lap} />
        <Trace lap={lap} heat={heat} pointer={pointer} />
      </div>
    </div>
  )
}

function MapSvg({ lap }) {
  const [tick, setTick] = useState(0)
  const ref = useRef(null)
  useTickerInView(ref, (now) => setTick(now), 40)
  const drift = ((tick % 7000) / 7000) * 20.5
  const pv = (tick % 4200) / 4200
  const ping = 1 - (1 - pv) * (1 - pv)
  const dots = []
  // halftone landmass: a soft blob of dots around the route
  for (let j = 0; j < 100; j++)
    for (let i = 0; i < 180; i++) {
      const x = 5 + i * 7.8, y = 16 + j * 7.7
      const dx = (x - 940) / 360, dy = (y - 400) / 210
      const r = dx * dx + dy * dy
      const n = Math.sin(x * 0.05) * Math.cos(y * 0.07) * 0.25
      if (r + n < 1) dots.push(`M${x + 1.75} ${y}a1.75 1.75 0 1 1 -3.5 0a1.75 1.75 0 1 1 3.5 0`)
    }
  return (
    <svg ref={ref} className="map" viewBox="0 0 1440 800" overflow="visible">
      <path d={dots.join('')} fill="var(--map-dot)" />
      <g stroke="var(--map-grid)" strokeWidth="1.2" strokeDasharray="6.8 4.7" strokeDashoffset={drift} fill="none">
        {[363, 718, 1073].map((x) => <line key={x} x1={x} y1={-4000} x2={x} y2={4800} />)}
        <line x1={-4000} y1={392} x2={5440} y2={392} />
      </g>
      <circle cx="719" cy="393" r="39" fill="none" stroke="var(--map-grid)" strokeWidth="1.7" />
      <circle cx="719" cy="393" r="200" fill="none" stroke="var(--map-grid-ghost)" strokeWidth="1.2" />
      <circle cx="719" cy="393" r="249" fill="none" stroke="var(--map-grid-ghost)" strokeWidth="1.2" />
      <circle cx="719" cy="393" r={6 + ping * 48} fill="none" stroke="var(--accent)" strokeWidth="1.2" opacity={0.4 * (1 - ping) * (1 - ping)} />
      <circle cx="719" cy="393" r="6" fill="var(--map-mark)" />
      {[[37, 43], [1390, 43], [37, 524], [1390, 524], [37, 755], [650, 755], [779, 755]].map(([x, y]) => (
        <rect key={`${x}${y}`} x={x} y={y} width="9.4" height="9.4" fill="var(--map-mark)" />
      ))}
      <path d={`M${ROUTE.map((p) => p.join(' ')).join('L')}`} fill="none" stroke="var(--foreground-on-dark)" strokeWidth="2" opacity={0.18} />
      {MARKERS.map((m, i) => (
        <polygon key={i} points="13.69,0 -6.85,11.86 -6.85,-11.86" fill="var(--accent)" transform={`translate(${m.x} ${m.y}) rotate(${[73.5, 30.5, 89.5, 17.5][i]})`} opacity={lap * TOTAL >= m.d * TOTAL ? 1 : 0.35} />
      ))}
      <path d="M873 293l6 6-6 6-6-6zM887 296l6 6-6 6-6-6zM872 310l6 6-6 6-6-6zM886 310l6 6-6 6-6-6z" fill="var(--map-mark)" />
    </svg>
  )
}

export function Journey({ t }) {
  const j = t.journey
  const [armed, setArmed] = useState(false)
  const [headRef, inView] = useInView('0% 0% -10% 0%')
  const ruleRef = useAnimated({ enabled: inView, delayIn: 260, mode: 'forward', apply: (v, el) => { el.style.opacity = v; el.style.transform = `scaleX(${v})` } })
  const plateRef = useAnimated({ enabled: inView, delayIn: 260, mode: 'forward', apply: (v, el) => { el.style.opacity = v; el.style.transform = `translateY(${(1 - v) * 0.75}rem)` } })
  const [turn, setTurn] = useState(0)
  const globeRef = useRef(null)
  useTickerInView(globeRef, (now) => setTurn(((now % 10000) / 10000) * Math.PI * 2), 40)

  return (
    <section className="journey" data-season id="ventures">
      <Stage armed={armed} setArmed={setArmed} />
      <ChequerDissolve carry="light" zIndex={10} />
      <div className="journey-copy" ref={headRef}>
        <div className="journey-left">
          <h2 className="masthead-h2 accent">
            {j.lines.map((line, i) => (
              <span key={i} className="line">
                <Words text={line} enabled={inView} delayIn={i * 130} stagger={110} config={CFG.REVEAL} mode="forward" gap={0.25} />
                {i === j.lines.length - 1 && <Dot enabled={inView} delay={130 + 110} className="white" />}
              </span>
            ))}
          </h2>
          <div ref={ruleRef} className="rule" />
          <p className="intro-copy">
            <Words text={j.intro} enabled={inView} delayIn={2 * 130 + 90} stagger={34} config={CFG.COPY2} mode="forward" gap={0.22} />
          </p>
        </div>
        <div ref={plateRef} className="plate">
          <svg className="plate-frame" viewBox="0 0 277 78" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0.5 0.5H276.5V69L268 77.5H0.5Z" fill="var(--surface-black)" stroke="var(--accent)" vectorEffect="non-scaling-stroke" />
            <line x1="83" y1="0.5" x2="83" y2="77.5" stroke="var(--accent)" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="plate-badge">
            <svg ref={globeRef} viewBox="0 0 37 23" className="globe" aria-hidden="true">
              <ellipse cx="18.5" cy="11.5" rx="18" ry="11" fill="none" stroke="var(--accent)" />
              <line x1="0.5" y1="11.5" x2="36.5" y2="11.5" stroke="var(--accent)" />
              <ellipse cx="18.5" cy="11.5" rx={Math.max(0.5, Math.abs(Math.cos(turn)) * 18)} ry="11" fill="none" stroke="var(--accent)" />
            </svg>
            <span className="badge-word">
              <Letters text={j.badge[0]} enabled={inView} delayIn={430} stagger={22} config={CFG.TYPE} mode="forward" className="white" />
              <Letters text={j.badge[1]} enabled={inView} delayIn={490} stagger={22} config={CFG.TYPE} mode="forward" className="accent" />
            </span>
          </div>
          <dl className="plate-stats">
            {j.rows.map(([v, l], i) => (
              <div key={l}>
                <dt><Letters text={v} enabled={inView} delayIn={430 + i * 110} stagger={22} config={CFG.TYPE} mode="forward" /></dt>
                <dd><Letters text={l} enabled={inView} delayIn={430 + i * 110 + 70} stagger={22} config={CFG.TYPE} mode="forward" /></dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

export function Dot({ enabled, delay, className = '' }) {
  const ref = useAnimated({ enabled, delayIn: delay, mode: 'forward', apply: (v, el) => (el.style.opacity = v) })
  return <span ref={ref} className={`dot ${className}`}>.</span>
}
