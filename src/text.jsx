// Text reveals: words / letters, each unit its own spring.
import { useEffect, useLayoutEffect, useRef } from 'react'
import { CFG, createSpring, reducedMotion } from './engine'

function useUnits({ enabled, delayIn, stagger, config, y, mode }) {
  const rootRef = useRef(null)
  const springs = useRef([])
  const played = useRef(false)
  const scrolledDown = useRef(false)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const units = root.querySelectorAll('[data-unit]')
    springs.current = Array.from(units).map((el) => {
      const s = createSpring(0, config, (v) => {
        el.style.opacity = v
        el.style.transform = `translateY(${(1 - v) * y}em)`
      })
      s.setPrecision(0.001)
      el.style.opacity = 0
      el.style.transform = `translateY(${y}em)`
      return s
    })
    return () => springs.current.forEach((s) => s.dispose())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const check = () => {
      scrolledDown.current = el.getBoundingClientRect().top <= 0
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [])

  useEffect(() => {
    let active = enabled
    if (mode === 'once' && played.current) return
    if (mode === 'forward' && scrolledDown.current) active = true
    if (reducedMotion) {
      springs.current.forEach((s) => s.snap(active ? 1 : 0))
      return
    }
    const timers = []
    if (active) {
      played.current = true
      springs.current.forEach((s, i) => timers.push(setTimeout(() => s.set(1, config), delayIn + i * stagger)))
    } else if (mode === 'always') {
      springs.current.forEach((s) => s.set(0, config))
    }
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  return rootRef
}

export function Words({
  text,
  enabled = true,
  delayIn = 0,
  stagger = 110,
  config = CFG.REVEAL,
  mode = 'forward',
  gap = 0.3,
  as: Tag = 'span',
  className = '',
  style,
}) {
  const ref = useUnits({ enabled, delayIn, stagger, config, y: 0.35, mode })
  const words = text.split(' ')
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ columnGap: `${gap}em`, ...style }}>
      <span className="sr-only">{text}</span>
      {words.map((w, i) => (
        <span key={i} data-unit aria-hidden="true" className="unit">
          {w}
        </span>
      ))}
    </Tag>
  )
}

export function Letters({
  text,
  enabled = true,
  delayIn = 0,
  stagger = 26,
  config = CFG.FIGURE,
  mode = 'forward',
  gap = 0,
  as: Tag = 'span',
  className = '',
  style,
}) {
  const ref = useUnits({ enabled, delayIn, stagger, config, y: 0.3, mode })
  return (
    <Tag ref={ref} className={`reveal nowrap ${className}`} style={{ columnGap: `${gap}em`, ...style }}>
      <span className="sr-only">{text}</span>
      {Array.from(text).map((c, i) => (
        <span key={i} data-unit aria-hidden="true" className="unit">
          {c === ' ' ? ' ' : c}
        </span>
      ))}
    </Tag>
  )
}
