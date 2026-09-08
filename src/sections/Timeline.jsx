// "From munich to dubai" — seven photographs in stepped plates, a rail with a turning marker.
import { useEffect, useRef, useState } from 'react'
import { CFG, createSpring, useAnimated, useInView, useScrub, reducedMotion } from '../engine'
import { Words, Letters } from '../text'
import { ChequerDissolve } from '../canvases'
import { Dot } from './Journey'

const px = (v) => `${((v / 1440) * 100).toFixed(4)}cqw`
const ROW_HEIGHT = { side: 217, centre: 462 }
const PLATE_WIDTH = { side: 333, centre: 710 }
const TOP_PAD = 169
const MARK_RISE = 50
const PARALLAX = { plate: { side: 60, centre: 20 }, copy: 110 }
const PLATE_CLIP =
  'M 0.01915,0.00107H 0.98085C 0.98574,0.00107 0.99044,0.00300 0.99390,0.00642C 0.99736,0.00984 0.99930,0.01449 0.99930,0.01933V 0.88815C 0.99930,0.89299 0.99736,0.89763 0.99390,0.90105C 0.99044,0.90448 0.98574,0.90640 0.98085,0.90640H 0.64733C 0.63864,0.90640 0.63007,0.90834 0.62224,0.91206C 0.61442,0.91579 0.60754,0.92122 0.60212,0.92794L 0.56153,0.97830C 0.55635,0.98474 0.54976,0.98993 0.54227,0.99350C 0.53478,0.99707 0.52656,0.99892 0.51825,0.99892H 0.01915C 0.01426,0.99892 0.00956,0.99700 0.00610,0.99358C 0.00264,0.99016 0.00070,0.98551 0.00070,0.98067V 0.01933C 0.00070,0.01449 0.00264,0.00984 0.00610,0.00642C 0.00956,0.00300 0.01426,0.00107 0.01915,0.00107Z'
const PLATE_OUTLINE =
  'M13.6168 0.497469H697.378C700.858 0.497469 704.195 1.38786 706.655 2.97277C709.115 4.55769 710.498 6.70729 710.498 8.94869V411.208C710.498 413.449 709.115 415.599 706.655 417.183C704.195 418.768 700.858 419.659 697.378 419.659H460.249C454.073 419.659 447.976 420.555 442.411 422.281C436.847 424.008 431.958 426.519 428.107 429.63L399.246 452.95C395.559 455.928 390.878 458.333 385.55 459.986C380.223 461.639 374.385 462.497 368.472 462.497H13.6168C10.1373 462.497 6.80038 461.607 4.34003 460.022C1.87968 458.437 0.497469 456.288 0.497469 454.046V8.94869C0.497469 6.70729 1.87968 4.55769 4.34003 2.97277C6.80038 1.38786 10.1373 0.497469 13.6168 0.497469Z'

function railHeight(rows) {
  return TOP_PAD + rows.reduce((s, r) => s + ROW_HEIGHT[r.frame], 0)
}
function restingPoint(rows) {
  const heights = rows.map((r) => ROW_HEIGHT[r.frame])
  const lastTop = TOP_PAD + heights.slice(0, -1).reduce((a, b) => a + b, 0)
  return (lastTop + heights[heights.length - 1] / 2 - MARK_RISE) / railHeight(rows)
}

function Rail({ rows }) {
  const ref = useRef(null)
  const progressRef = useRef(null)
  const markRef = useRef(null)
  const viewH = railHeight(rows)
  const rest = restingPoint(rows) * viewH
  const spring = useRef(null)
  useEffect(() => {
    spring.current = createSpring(0, { tension: 140, friction: 30 }, (v) => {
      const run = v * rest
      if (progressRef.current) progressRef.current.setAttribute('height', run)
      if (markRef.current) markRef.current.setAttribute('transform', `translate(8 ${run}) rotate(${(run / rest) * 1800})`)
    })
    spring.current.setPrecision(0.0005)
    return () => spring.current.dispose()
  }, [rest])
  useScrub(ref, 'top center', 'bottom bottom', (p) => spring.current?.set(p))
  const narrow = typeof window !== 'undefined' && window.innerWidth < 1024
  const size = narrow ? 20 : 9
  return (
    <div ref={ref} className="rail" aria-hidden="true">
      <svg viewBox={`0 0 16 ${viewH}`} overflow="visible" preserveAspectRatio="none">
        <line x1="8" y1="0" x2="8" y2="98" stroke="var(--timeline-rail)" strokeWidth="1" />
        <line x1="8" y1="102" x2="8" y2={rest} stroke="var(--timeline-rail)" strokeWidth="1" strokeDasharray="6 6" />
        <rect ref={progressRef} x="7.5" y="0" width="1" height="0" fill="var(--foreground-on-dark)" />
        <rect ref={markRef} x={-size / 2} y={-size / 2} width={size} height={size} fill="var(--foreground-on-dark)" transform="translate(8 0)" />
      </svg>
    </div>
  )
}

function Row({ row, index, hovered, setHovered }) {
  const rowRef = useRef(null)
  const plateLayer = useRef(null)
  const yearLayer = useRef(null)
  const copyLayer = useRef(null)
  const slotRef = useRef(null)
  const [viewRef, inView] = useInView('0% 0% -25% 0%')
  const travel = PARALLAX.plate[row.frame]
  useScrub(rowRef, 'top bottom', 'bottom top', (p) => {
    const plateTop = `${(((1 - 2 * p) * travel) / 1440) * 100}cqw`
    if (plateLayer.current) plateLayer.current.style.top = plateTop
    if (yearLayer.current) yearLayer.current.style.top = `calc(50% + ${plateTop})`
    if (copyLayer.current) copyLayer.current.style.top = `calc(50% + ${(((1 - 2 * p) * PARALLAX.copy) / 1440) * 100}cqw)`
  })
  useScrub(rowRef, 'top bottom', 'top center', (p) => {
    if (slotRef.current) slotRef.current.style.top = `${-10 * (1 - p)}%`
  })
  const copyRef = useAnimated({
    enabled: inView,
    delayIn: 220,
    config: CFG.COPY,
    mode: 'forward',
    apply: (v, el) => {
      el.style.opacity = v
      el.style.transform = `translateY(calc(-50% + ${(1 - v) * 0.75}rem))`
    },
  })
  // year settle on centre rows
  const yearRef = useRef(null)
  useEffect(() => {
    if (!inView || row.frame !== 'centre' || reducedMotion) return
    const s = createSpring(1, CFG.YEAR_SETTLE, (v) => {
      if (yearRef.current) yearRef.current.style.opacity = v
    })
    s.setPrecision(0.001)
    const t = setTimeout(() => s.set(0.4), 2200 + 26 * 4)
    return () => {
      clearTimeout(t)
      s.dispose()
    }
  }, [inView, row.frame])

  const dim = hovered !== null && hovered !== index
  return (
    <div
      ref={(el) => {
        rowRef.current = el
        viewRef.current = el
      }}
      className={`trow trow-${row.frame} ${row.align ? `trow-${row.align}` : ''} ${dim ? 'dim' : ''}`}
      style={{ height: px(ROW_HEIGHT[row.frame]) }}
    >
      <div ref={plateLayer} className="plate-layer" style={{ width: px(PLATE_WIDTH[row.frame]) }}>
        <div className="tplate" onPointerEnter={() => setHovered(index)} onPointerLeave={() => setHovered(null)}>
          <svg width="0" height="0" aria-hidden="true">
            <defs>
              <clipPath id={`plate-clip-${index}`} clipPathUnits="objectBoundingBox">
                <path d={PLATE_CLIP} />
              </clipPath>
            </defs>
          </svg>
          <div className="tplate-fill" style={{ clipPath: `url(#plate-clip-${index})` }}>
            <div ref={slotRef} className="tplate-slot">
              <img src={row.src} alt={`Felix Huettenbach — ${row.year}`} style={{ objectPosition: row.focus || '50% 50%' }} crossOrigin="anonymous" onError={(e) => (e.currentTarget.parentElement.classList.add('missing'))} />
            </div>
          </div>
          <svg className="tplate-outline" viewBox="0 0 710.995 462.995" preserveAspectRatio="none" aria-hidden="true">
            <path d={PLATE_OUTLINE} fill="none" stroke="var(--timeline-outline)" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      </div>
      <div ref={yearLayer} className="year-layer">
        <span ref={yearRef} className="year">
          <Letters text={row.year} enabled={inView} delayIn={0} stagger={26} config={CFG.YEAR} mode="forward" />
        </span>
      </div>
      {row.copy && (
        <div ref={copyLayer} className="copy-layer">
          <p ref={copyRef} className="tcopy">
            <strong>{row.lead}</strong> {row.copy}
          </p>
        </div>
      )}
    </div>
  )
}

export function Timeline({ t }) {
  const rows = t.timeline.rows
  const [hovered, setHovered] = useState(null)
  const [headRef, inView] = useInView('0% 0% -10% 0%')
  return (
    <section className="timeline" id="journey">
      <ChequerDissolve carry="light" zIndex={30} />
      <div className="timeline-wrap" style={{ paddingTop: `calc(${px(TOP_PAD)} + var(--top-pad-extra, 0px))` }}>
        <h2 ref={headRef} className="masthead-h2 accent timeline-head">
          {t.timeline.lines.map((line, i) => (
            <span key={i} className="line">
              <Words text={line} enabled={inView} delayIn={i * 130} stagger={110} config={CFG.REVEAL} mode="forward" gap={0.25} />
              {i === t.timeline.lines.length - 1 && <Dot enabled={inView} delay={130 + 110} className="white" />}
            </span>
          ))}
        </h2>
        <Rail rows={rows} />
        {rows.map((row, i) => (
          <Row key={row.year} row={row} index={i} hovered={hovered} setHovered={setHovered} />
        ))}
      </div>
    </section>
  )
}
