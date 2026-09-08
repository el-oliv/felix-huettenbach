// "From the field" — back to light: masthead, the report, the portrait melting into a dark band
// that carries the expeditions strip.
import { useRef, useState } from 'react'
import { CFG, useAnimated, useInView, useScrub, useTickerInView } from '../engine'
import { Words, Letters } from '../text'
import { ChequerDissolve, ContourCanvas } from '../canvases'
import { Dot } from './Journey'

const px = (v) => `${((v / 1440) * 100).toFixed(4)}cqw`
const spread = (x) => `calc(50% + ${px(x - 720)} * var(--cal-spread, 1))`
const CARDS = [
  { x: 347, w: 100 }, { x: 511, w: 100 }, { x: 675, w: 100 }, { x: 839, w: 114 }, { x: 1017, w: 76 },
]
const LINKS = [
  { x: 416, w: 126 }, { x: 580, w: 128 }, { x: 743, w: 136 }, { x: 914, w: 124 },
]
const LIVE = 2

function Corners({ className = '', style }) {
  return (
    <div className={`brackets ${className}`} style={style} aria-hidden="true">
      {['tl', 'tr', 'br', 'bl'].map((c) => (
        <svg key={c} className={`corner corner-${c}`} viewBox="0 0 10.5 10.5">
          <path d="M0 0.5H10V10.5" fill="none" stroke="currentColor" />
        </svg>
      ))}
    </div>
  )
}

function Rise({ enabled, delay, className = '', children, style, y = 0.75, config = CFG.REVEAL }) {
  const ref = useAnimated({
    enabled,
    delayIn: delay,
    config,
    mode: 'forward',
    apply: (v, el) => {
      el.style.opacity = v
      el.style.transform = `translateY(${(1 - v) * y}rem)`
    },
  })
  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  )
}
function Fade({ enabled, delay, className = '', children, style }) {
  const ref = useAnimated({ enabled, delayIn: delay, mode: 'forward', apply: (v, el) => (el.style.opacity = v) })
  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  )
}

function Strip({ t, inView }) {
  const [hover, setHover] = useState(false)
  const [tick, setTick] = useState(0)
  const ref = useRef(null)
  useTickerInView(ref, (now) => setTick(now), 40)
  const crawl = (tick % 5200) / 5200
  const pv = (tick % 3200) / 3200
  const pulse = 1 - (1 - pv) * (1 - pv)
  const rounds = t.field.strip.rounds
  return (
    <div ref={ref} className="strip" style={{ '--bracket-spread': hover ? px(5) : '0px' }}>
      {LINKS.map((l, i) => (
        <Connector key={i} enabled={inView} delay={560 + i * 90} x={l.x} w={l.w} dir={i < LIVE ? 1 : -1} crawl={crawl} />
      ))}
      {rounds.map(([round, name, date], i) => {
        const c = CARDS[i]
        const live = i === LIVE
        return (
          <Rise
            key={name}
            enabled={inView}
            delay={560 + i * 90}
            y={0.5}
            className={`card ${live ? 'live' : ''} ${i > LIVE ? 'future' : ''}`}
            style={{ left: `calc(${spread(c.x + c.w / 2)} - ${px(c.w / 2)})`, width: `var(--cal-card-w, ${px(c.w)})` }}
          >
            <div onPointerEnter={() => live && setHover(true)} onPointerLeave={() => live && setHover(false)}>
              <span className="card-round">{round}</span>
              <Rise enabled={inView} delay={560 + i * 90 + 110} y={0.3} config={CFG.NAME} className="card-name">{name}</Rise>
              <span className="card-date">{date}</span>
            </div>
          </Rise>
        )
      })}
      {rounds.map((r, i) => {
        const c = CARDS[i]
        return (
          <Fade key={`m${i}`} enabled={inView} delay={560 + i * 90 + 60} className="marker" style={{ left: spread(c.x + c.w / 2) }}>
            {i < LIVE ? (
              <span className="marker-result">{['p6', 'p4'][i]}</span>
            ) : (
              <svg viewBox="0 0 11 11" className="marker-dot" overflow="visible">
                {i === LIVE ? (
                  <>
                    <circle cx="5.5" cy="5.5" r="5.5" fill="var(--accent)" />
                    <circle cx="5.5" cy="5.5" r={5.5 + pulse * 5.5 * 3.4} fill="none" stroke="var(--accent)" vectorEffect="non-scaling-stroke" opacity={0.5 * (1 - pulse) * (1 - pulse)} />
                  </>
                ) : (
                  <circle cx="5.5" cy="5.5" r="5" fill="none" stroke="var(--foreground-on-dark)" />
                )}
              </svg>
            )}
          </Fade>
        )
      })}
      <Fade enabled={inView} delay={560 + 5 * 90} className="live-bracket accent" style={{ left: spread(669), width: `calc(${spread(781)} - ${spread(669)})` }}>
        <Corners />
      </Fade>
    </div>
  )
}
function Connector({ enabled, delay, x, w, dir, crawl }) {
  const ref = useAnimated({ enabled, delayIn: delay, mode: 'forward', apply: (v, el) => (el.style.transform = `scaleX(${v})`) })
  return (
    <div
      ref={ref}
      className="connector"
      style={{ left: spread(x), width: `calc(${px(w)} * var(--cal-spread, 1))`, backgroundPositionX: `calc(${dir * crawl} * ${px(11.45)})` }}
    />
  )
}

export function Field({ t }) {
  const f = t.field
  const sectionRef = useRef(null)
  const figureRef = useRef(null)
  const [headRef, inView] = useInView('0% 0% -10% 0%')
  const [stripRef, stripIn] = useInView('0% 0% -20% 0%')
  useScrub(sectionRef, 'top bottom', 'bottom top', (p) => {
    if (figureRef.current) figureRef.current.style.top = `${-3.3333 * p}cqw`
  })
  return (
    <section ref={sectionRef} className="field" id="bio">
      <ContourCanvas colour="rgb(9 10 11 / 0.08)" />
      <div className="band" aria-hidden="true" />
      <div ref={figureRef} className="figure-layer">
        <img src="/media/felix-skydiving.png" alt="Felix Huettenbach skydiving" className="portrait" crossOrigin="anonymous" />
      </div>
      <div className="band-fade" aria-hidden="true" />
      <ChequerDissolve carry="dark" zIndex={30} />

      <h2 ref={headRef} className="masthead-h2 field-head">
        {f.lines.map((line, i) => (
          <span key={i} className="line">
            <Words text={line} enabled={inView} delayIn={i * 130} stagger={110} config={CFG.REVEAL} mode="forward" gap={0.25} />
            {i === f.lines.length - 1 && <Dot enabled={inView} delay={130 + 110} className="accent" />}
          </span>
        ))}
      </h2>

      <div className="field-intro">
        <p className="report">
          <Words text={f.report} enabled={inView} delayIn={2 * 130 + 90} stagger={30} config={CFG.COPY2} mode="forward" gap={0.22} />
        </p>
        <Rise enabled={inView} delay={2 * 130 + 260}>
          <a className="cta cta-dark" href="https://youtube.com" target="_blank" rel="noreferrer">
            <svg className="cta-frame" viewBox="0 0 217 50" preserveAspectRatio="none" aria-hidden="true">
              <path className="cta-body" d="M0.5 0.5H216.5V42L209 49.5H0.5Z" />
              <path className="cta-flood" d="M0.5 0.5H216.5V42L209 49.5H0.5Z" />
              <path className="cta-ring" d="M0.5 0.5H216.5V42L209 49.5H0.5Z" />
            </svg>
            <span className="cta-label">{f.cta}</span>
            <svg className="cta-arrow" viewBox="0 0 13.7071 10.7071" aria-hidden="true"><path d="M0 5.35H13M8 10.35L13 5.35L8 0.35" /></svg>
          </a>
        </Rise>
      </div>

      <div className="field-panels">
        <Fade enabled={inView} delay={320} className="meet-frame"><Corners /></Fade>
        <Rise enabled={inView} delay={410} className="meet">
          <strong>{f.meet[0]}</strong>
          <span>{f.meet[1]}</span>
          <span>{f.meet[2]}</span>
        </Rise>
        <Fade enabled={inView} delay={460} className="stats-frame"><Corners /></Fade>
        <div className="fstats">
          {f.stats.map(([label, value], i) => (
            <div key={label} className="fstat">
              {i > 0 && <StatRule enabled={inView} delay={460 + i * 90} />}
              <Rise enabled={inView} delay={460 + i * 90 + 40} className="fstat-row">
                <span className="fstat-icon" aria-hidden="true">
                  <svg viewBox="0 0 31 31"><rect x="1" y="1" width="29" height="29" fill="none" stroke="currentColor" /><path d={['M8 22V9h10l-3 4 3 4H8', 'M7 23V13M13 23V8M19 23V16M25 23V11', 'M9 8h13v4a6.5 6.5 0 0 1-13 0zM15.5 18v4M11 23h9', 'M6 22a10 10 0 0 1 19 0M15.5 21l5-8'][i]} fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
                </span>
                <span className="fstat-text">
                  <span className="fstat-label">{label}</span>
                  <span className="fstat-value"><Letters text={value} enabled={inView} delayIn={460 + i * 90 + 120} stagger={24} config={CFG.FIGURE} mode="forward" /></span>
                </span>
              </Rise>
            </div>
          ))}
        </div>
      </div>

      <div ref={stripRef} className="strip-gate">
        <Strip t={t} inView={stripIn} />
      </div>
    </section>
  )
}
function StatRule({ enabled, delay }) {
  const ref = useAnimated({ enabled, delayIn: delay, mode: 'forward', apply: (v, el) => (el.style.transform = `scaleX(${v})`) })
  return <div ref={ref} className="fstat-rule" />
}
