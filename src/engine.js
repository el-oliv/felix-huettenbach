// Motion engine: one rAF ticker, a damped spring solver, scroll triggers.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/* ---------- ticker ---------- */
const subs = new Set()
let raf = 0
function loop(time) {
  raf = requestAnimationFrame(loop)
  for (const s of Array.from(subs)) {
    if (time - s.last > s.rate()) {
      s.last = time
      s.cb(time)
    }
  }
}
export function subscribe(cb, rate = () => 0) {
  const s = { cb, rate, last: -Infinity }
  subs.add(s)
  if (subs.size === 1) raf = requestAnimationFrame(loop)
  return () => {
    subs.delete(s)
    if (subs.size === 0) cancelAnimationFrame(raf)
  }
}

export const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ---------- spring ---------- */
export const CFG = {
  REVEAL: { tension: 90, friction: 26 },
  ROW: { tension: 170, friction: 24 },
  SHEET: { tension: 190, friction: 26 },
  FIGURE: { tension: 200, friction: 24 },
  TYPE: { tension: 210, friction: 24 },
  YEAR: { tension: 190, friction: 24 },
  COPY: { tension: 110, friction: 26 },
  COPY2: { tension: 150, friction: 24 },
  NAME: { tension: 190, friction: 24 },
  VEIL: { tension: 70, friction: 24 },
  CLEAR: { tension: 140, friction: 26 },
  LABEL: { tension: 110, friction: 26 },
  WAIT: { tension: 10, friction: 30 },
  READY: { tension: 170, friction: 26 },
  YEAR_SETTLE: { tension: 32, friction: 26 },
  TRIGGER: { tension: 140, friction: 30 },
}

export function createSpring(value, config, onChange) {
  const s = {
    value,
    velocity: 0,
    target: value,
    config,
    unsub: null,
    lastTime: 0,
    onChange,
    precision: 0.01,
  }
  function step(time) {
    const dtRaw = s.lastTime ? time - s.lastTime : 16
    s.lastTime = time
    const dt = Math.min(64, dtRaw)
    if (s.config.duration != null) {
      // tween
      const p = Math.min(1, (time - s.startTime) / Math.max(1, s.config.duration))
      const e = s.config.easing ? s.config.easing(p) : p
      s.value = s.from + (s.target - s.from) * e
      s.onChange(s.value)
      if (p >= 1) stop()
      return
    }
    const steps = Math.max(1, Math.round(dt))
    for (let i = 0; i < steps; i++) {
      const f = -s.config.tension * 0.000001 * (s.value - s.target)
      const d = -s.config.friction * 0.001 * s.velocity
      const a = f + d
      s.velocity += a
      s.value += s.velocity
    }
    if (Math.abs(s.velocity) < s.precision && Math.abs(s.target - s.value) < s.precision) {
      s.value = s.target
      s.velocity = 0
      s.onChange(s.value)
      stop()
      return
    }
    s.onChange(s.value)
  }
  function stop() {
    if (s.unsub) s.unsub()
    s.unsub = null
    s.lastTime = 0
  }
  return {
    get value() {
      return s.value
    },
    set(target, config) {
      if (config) s.config = config
      s.target = target
      if (s.config.duration != null) {
        s.from = s.value
        s.startTime = performance.now()
        if (s.config.duration <= 1) {
          s.value = target
          s.onChange(target)
          return
        }
      }
      if (!s.unsub) s.unsub = subscribe(step)
    },
    snap(v) {
      stop()
      s.value = v
      s.target = v
      s.velocity = 0
      s.onChange(v)
    },
    setPrecision(p) {
      s.precision = p
    },
    dispose: stop,
  }
}

/**
 * useSpringStyle — drives a spring from `from` to `to` (numbers) and returns
 * a ref you attach; `apply(value, el)` writes the style.
 */
export function useAnimated({ enabled, delayIn = 0, config = CFG.REVEAL, mode = 'always', apply, from = 0, to = 1 }) {
  const ref = useRef(null)
  const springRef = useRef(null)
  const playedRef = useRef(false)
  const scrolledDown = useRef(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    springRef.current = createSpring(from, config, (v) => apply(v, el))
    springRef.current.setPrecision(0.001)
    apply(from, el)
    return () => springRef.current?.dispose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => {
      scrolledDown.current = el.getBoundingClientRect().top <= 0
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [])

  useEffect(() => {
    const spring = springRef.current
    if (!spring) return
    let active = enabled
    if (mode === 'once' && playedRef.current) return
    if (mode === 'forward' && scrolledDown.current) active = true
    if (reducedMotion) {
      spring.snap(active ? to : from)
      return
    }
    if (active) {
      playedRef.current = true
      const t = setTimeout(() => spring.set(to, config), delayIn)
      return () => clearTimeout(t)
    }
    if (mode === 'always') spring.set(from, config)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  return ref
}

/* ---------- in-view gate (once) ---------- */
export function useInView(rootMargin = '0px', once = true) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true)
            if (once) io.disconnect()
          } else if (!once) setInView(false)
        }
      },
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin, once])
  return [ref, inView]
}

/* ---------- scroll trigger (scrub) ---------- */
const poses = (bb, vh) => ({
  top_top: bb.top,
  center_top: bb.top + bb.height / 2,
  bottom_top: bb.bottom,
  top_bottom: bb.top - vh,
  center_bottom: bb.top + bb.height / 2 - vh,
  bottom_bottom: bb.bottom - vh,
  top_center: bb.top - vh / 2,
  center_center: bb.top + bb.height / 2 - vh / 2,
  bottom_center: bb.bottom - vh / 2,
})

export function progressOf(el, start, end) {
  const bb = el.getBoundingClientRect()
  const vh = window.innerHeight
  const p = poses(bb, vh)
  const s = p[start.replace(' ', '_')]
  const e = p[end.replace(' ', '_')]
  const length = Math.abs(s - e)
  return Math.min(Math.max(0, 1 - (s + length) / length), 1)
}

/**
 * useScrub(ref, start, end, onProgress) — calls onProgress(p) from the ticker
 * while the element is in view (+10 frames after).
 */
export function useScrub(ref, start, end, onProgress, rate = 10) {
  const cbRef = useRef(onProgress)
  cbRef.current = onProgress
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let visible = false
    let grace = 0
    let last = -1
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        visible = e.isIntersecting
        if (!visible) grace = 10
      }
    })
    io.observe(el)
    const unsub = subscribe(
      () => {
        if (!visible && grace <= 0) return
        if (!visible) grace -= 1
        const p = progressOf(el, start, end)
        if (p !== last) {
          last = p
          cbRef.current(p)
        }
      },
      () => rate,
    )
    return () => {
      io.disconnect()
      unsub()
    }
  }, [ref, start, end, rate])
}

/* ---------- loop-in-view helper for canvases ---------- */
export function useTickerInView(ref, cb, rate = 0) {
  const cbRef = useRef(cb)
  cbRef.current = cb
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let visible = false
    let grace = 0
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        visible = e.isIntersecting
        if (!visible) grace = 10
      }
    })
    io.observe(el)
    const unsub = subscribe(
      (t) => {
        if (document.hidden) return
        if (!visible && grace <= 0) return
        if (!visible) grace -= 1
        cbRef.current(t)
      },
      () => rate,
    )
    return () => {
      io.disconnect()
      unsub()
    }
  }, [ref, rate])
}

export const easeOutQuad = (t) => 1 - (1 - t) * (1 - t)
export const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
