import { useEffect, useRef, useState } from 'react'
import { CFG, createSpring, reducedMotion, useAnimated, subscribe, easeOutQuad } from '../engine'
import { Words, Letters } from '../text'
import { drawContours } from '../canvases'

const TRAIL = 40
const CLEAR_MS = 430
const PAUSE_MS = 240
const COVERED_AFTER = 1.15

/* ---------- the 2D "scene": contours + portrait + liquid cursor reveal ---------- */
function useHeroScene(canvasRef, sectionRef, onReady, riseRef) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.src = '/media/felix-tokyo.png'
    const grey = document.createElement('canvas')
    const mask = document.createElement('canvas')
    const noise = document.createElement('canvas')
    let ready = false
    let readyAt = null
    let start = null
    const styles = getComputedStyle(document.documentElement)
    const bg = styles.getPropertyValue('--background').trim()
    const soft = styles.getPropertyValue('--surface-soft').trim()
    const accent = styles.getPropertyValue('--accent').trim()
    const pointerOK = !window.matchMedia('(hover: none)').matches && !reducedMotion
    const pointer = { x: 0.3, y: 0.1, seen: !pointerOK }
    const smoothed = { x: 0.3, y: 0.1 }
    const last = { x: 0.3, y: 0.1 }
    let pace = 0
    const trail = Array.from({ length: TRAIL }, () => ({ x: 0.3, y: 0.1 }))

    // noise tile for the burn
    noise.width = noise.height = 256
    const nctx = noise.getContext('2d')
    const id = nctx.createImageData(256, 256)
    for (let i = 0; i < id.data.length; i += 4) {
      const v = Math.random() * 255
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v
      id.data[i + 3] = 255
    }
    nctx.putImageData(id, 0, 0)
    let noiseData = id.data

    const onMove = (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1
      if (!pointer.seen) {
        pointer.seen = true
        smoothed.x = last.x = pointer.x
        smoothed.y = last.y = pointer.y
        trail.forEach((p) => {
          p.x = pointer.x
          p.y = pointer.y
        })
      }
    }
    if (pointerOK) window.addEventListener('pointermove', onMove)

    const subject = document.createElement('canvas')
    img.onload = () => {
      // The photograph has no alpha cut-out: feather it into an ellipse so it
      // reads as a subject standing on the backdrop, not a pasted rectangle.
      subject.width = img.naturalWidth
      subject.height = img.naturalHeight
      const sc = subject.getContext('2d')
      sc.drawImage(img, 0, 0)
      sc.globalCompositeOperation = 'destination-in'
      const cx = subject.width / 2
      const cy = subject.height * 0.5
      const rg = sc.createRadialGradient(cx, cy, 0, cx, cy, subject.width * 0.52)
      rg.addColorStop(0, 'rgba(0,0,0,1)')
      rg.addColorStop(0.62, 'rgba(0,0,0,1)')
      rg.addColorStop(1, 'rgba(0,0,0,0)')
      sc.fillStyle = rg
      sc.fillRect(0, 0, subject.width, subject.height)
      sc.globalCompositeOperation = 'source-over'
      grey.width = subject.width
      grey.height = subject.height
      const g = grey.getContext('2d')
      g.filter = 'grayscale(1) contrast(1.15) brightness(1.02)'
      g.drawImage(subject, 0, 0)
      ready = true
      onReady()
    }
    img.onerror = () => {
      document.body.insertAdjacentHTML('afterbegin', `<div class="asset-error">Failed to load ${img.src}</div>`)
      onReady()
    }

    const fit = () => {
      const s = sectionRef.current
      if (!s) return null
      const box = s.querySelector('[data-fit-box]')
      const sr = s.getBoundingClientRect()
      if (box && box.offsetParent !== null) {
        const b = box.getBoundingClientRect()
        return { top: b.top - sr.top, height: b.height, left: b.left - sr.left, width: b.width }
      }
      return { top: 0, height: sr.height, left: 0, width: sr.width }
    }

    const unsub = subscribe((now) => {
      if (document.hidden) return
      if (window.scrollY > window.innerHeight * COVERED_AFTER) return
      if (!start) start = now
      const t = (now - start) / 1000
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (!w || !h) return
      if (canvas.width !== Math.round(w * ratio)) {
        canvas.width = Math.round(w * ratio)
        canvas.height = Math.round(h * ratio)
        mask.width = canvas.width
        mask.height = canvas.height
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)
      drawContours(ctx, w, h, reducedMotion ? 0 : t * 1.66, soft)
      if (!ready) return
      if (readyAt === null) readyAt = t
      const intro = reducedMotion ? 1 : Math.min(1, (t - readyAt) / 4)

      // pointer easing
      smoothed.x += (pointer.x - smoothed.x) * 0.17
      smoothed.y += (pointer.y - smoothed.y) * 0.17
      const step = Math.hypot(smoothed.x - last.x, smoothed.y - last.y)
      const target = Math.min(1, step / 0.029)
      pace += (target - pace) * (target > pace ? 0.09 : 0.205)
      last.x = smoothed.x
      last.y = smoothed.y
      trail.pop()
      trail.unshift({ x: smoothed.x, y: smoothed.y })

      // subject placement
      const box = fit()
      const aspect = img.naturalWidth / img.naturalHeight
      let dh = box.height * 0.92
      let dw = dh * aspect
      if (dw > box.width * 0.62) {
        dw = box.width * 0.62
        dh = dw / aspect
      }
      const rise = riseRef.current ? riseRef.current(t) : 200
      const parallax = 8
      const wide = box.width >= 1280
      const dx = box.left + (box.width - dw) / 2 + (wide ? box.width * 0.06 : 0) + smoothed.x * parallax
      const dy = box.top + box.height - dh + rise - smoothed.y * parallax * 0.6

      // grey portrait
      ctx.drawImage(grey, dx, dy, dw, dh)

      // colour mask: burn front + cursor trail
      const m = mask.getContext('2d')
      m.setTransform(ratio, 0, 0, ratio, 0, 0)
      m.clearRect(0, 0, w, h)
      const burnFront = intro < 0.14 ? 0 : (() => { const x = Math.min(1, (intro - 0.14) / 0.86); return x * x * (3 - 2 * x) })()
      if (burnFront < 1) {
        // intact region: rows where threshold > front (crown down)
        const rows = 36
        for (let r = 0; r < rows; r++) {
          const y0 = dy + (dh * r) / rows
          const yh = dh / rows
          const cols = 24
          for (let c = 0; c < cols; c++) {
            const nx = Math.floor((c / cols) * 255)
            const ny = Math.floor((r / rows) * 255)
            const nv = noiseData[(ny * 256 + nx) * 4] / 255
            const burnAt = (1 - r / rows) * 0.55 + nv * 0.45
            const intact = burnAt > burnFront ? 1 : 0
            if (intact) {
              m.fillStyle = 'rgba(0,0,0,1)'
              m.fillRect(dx + (dw * c) / cols, y0, dw / cols + 1, yh + 1)
            } else if (Math.abs(burnAt - burnFront) < 0.03) {
              m.fillStyle = accent
              m.fillRect(dx + (dw * c) / cols, y0, dw / cols + 1, yh + 1)
            }
          }
        }
      }
      const gate = Math.min(1, Math.max(0, (pace - 0.06) / 0.15))
      if (pointerOK && gate > 0 && intro >= 0.5) {
        const radius = Math.min(w, h) * 0.23 * (0.28 + 0.72 * pace)
        m.lineCap = 'round'
        m.lineJoin = 'round'
        const span = Math.floor(TRAIL * 0.64)
        for (let i = 0; i < span - 1; i++) {
          const weight = Math.pow(1 - i / span, 1.9 * (1.6 - 0.35 * pace))
          const a = trail[i]
          const b = trail[i + 1]
          m.strokeStyle = `rgba(0,0,0,${(weight * gate).toFixed(3)})`
          m.lineWidth = radius * weight * 2
          m.beginPath()
          m.moveTo(((a.x + 1) / 2) * w, ((a.y + 1) / 2) * h)
          m.lineTo(((b.x + 1) / 2) * w, ((b.y + 1) / 2) * h)
          m.stroke()
        }
      }
      // composite colour image through mask
      m.globalCompositeOperation = 'source-in'
      m.drawImage(subject, dx, dy, dw, dh)
      m.globalCompositeOperation = 'source-over'
      ctx.drawImage(mask, 0, 0, w, h)

      // burn glow line
      if (burnFront > 0 && burnFront < 1) {
        ctx.save()
        ctx.globalCompositeOperation = 'lighter'
        const gy = dy + dh * burnFront
        const grad = ctx.createLinearGradient(0, gy - 30, 0, gy + 30)
        grad.addColorStop(0, 'rgba(2,210,227,0)')
        grad.addColorStop(0.5, 'rgba(2,210,227,0.55)')
        grad.addColorStop(1, 'rgba(2,210,227,0)')
        ctx.fillStyle = grad
        ctx.fillRect(dx, gy - 30, dw, 60)
        ctx.restore()
      }
    })
    return () => {
      unsub()
      if (pointerOK) window.removeEventListener('pointermove', onMove)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/* ---------- loader veil ---------- */
function Veil({ ready, onLift, label }) {
  const ref = useRef(null)
  const fillRef = useRef(null)
  const meterRef = useRef(null)
  const contentRef = useRef(null)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const progress = createSpring(0, CFG.WAIT, (v) => {
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${v})`
      if (meterRef.current) meterRef.current.style.transform = `scaleX(${v})`
    })
    progress.setPrecision(0.001)
    progress.set(0.7)
    return () => progress.dispose()
  }, [])

  useEffect(() => {
    if (!ready) return
    const progress = createSpring(0.7, CFG.READY, (v) => {
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${v})`
      if (meterRef.current) meterRef.current.style.transform = `scaleX(${v})`
    })
    progress.set(1)
    const clear = createSpring(0, CFG.CLEAR, (v) => {
      if (contentRef.current) {
        contentRef.current.style.opacity = 1 - v
        contentRef.current.style.transform = `translateY(${-0.75 * v}rem)`
      }
    })
    clear.setPrecision(0.001)
    clear.set(1)
    if (ref.current) ref.current.style.pointerEvents = 'none'
    const t = setTimeout(() => {
      onLift()
      const lift = createSpring(1, CFG.VEIL, (v) => {
        if (ref.current) ref.current.style.opacity = v
      })
      lift.setPrecision(0.001)
      lift.set(0)
      const startedAt = performance.now()
      const poll = subscribe(() => {
        const el = ref.current
        if (!el) return
        const o = parseFloat(getComputedStyle(el).opacity)
        if (o <= 0.004 || performance.now() - startedAt > 3000) {
          poll()
          setGone(true)
        }
      })
    }, CLEAR_MS + PAUSE_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  if (gone) return null
  return (
    <div ref={ref} className="veil" role="status" aria-label={ready ? 'Loaded' : `${label} Felix Huettenbach`}>
      <div ref={contentRef} className="veil-content">
        <div className="veil-helmet">
          <div className="veil-shell" />
          <div ref={fillRef} className="veil-fill" />
        </div>
        <div className="veil-name">felix huettenbach</div>
      </div>
      <div className="veil-meter">
        <div ref={meterRef} className="veil-meter-fill" />
      </div>
    </div>
  )
}

const Bracket = () => (
  <>
    {['tl', 'tr', 'br', 'bl'].map((c) => (
      <svg key={c} className={`corner corner-${c}`} viewBox="0 0 10.5 10.5" aria-hidden="true">
        <path d="M0 0.5H10V10.5" fill="none" stroke="currentColor" />
      </svg>
    ))}
  </>
)

export function Hero({ t, lang, setLang, LANGUAGES }) {
  const sectionRef = useRef(null)
  const canvasRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [entered, setEntered] = useState(false)
  const riseAt = useRef(null)
  const riseRef = useRef(null)
  const [menu, setMenu] = useState(false)

  riseRef.current = (time) => {
    if (reducedMotion) return 0
    if (riseAt.current === null) return 200
    const u = Math.min(1, (time - riseAt.current) / 2)
    return (1 - easeOutQuad(u)) * 200
  }
  const beginRise = () => {
    riseAt.current = (performance.now() - (window.__heroStart || performance.now())) / 1000
    setEntered(true)
  }
  useEffect(() => {
    window.__heroStart = performance.now()
  }, [])

  useHeroScene(canvasRef, sectionRef, () => setReady(true), {
    get current() {
      return (t) => {
        if (riseAt.current === null) return reducedMotion ? 0 : 200
        const u = Math.min(1, (t - riseAt.current) / 2)
        return reducedMotion ? 0 : (1 - easeOutQuad(u)) * 200
      }
    },
  })

  const rise = (delay, cfg = CFG.REVEAL) =>
    useAnimated({
      enabled: entered,
      delayIn: delay,
      config: cfg,
      mode: 'once',
      apply: (v, el) => {
        el.style.opacity = v
        el.style.transform = `translateY(${(1 - v) * 1.25}rem)`
      },
    })
  const headerRef = rise(0)
  const idRef = useAnimated({ enabled: entered, delayIn: 180, mode: 'once', apply: (v, el) => (el.style.opacity = v) })
  const panelsRef = rise(900)
  const actionsRef = rise(1500)

  const h = t.hero
  return (
    <section ref={sectionRef} className="hero" data-hero id="top">
      <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />
      <div className="hero-ramp" aria-hidden="true" />
      <div className="hero-figure-box" aria-hidden="true">
        <div data-fit-box className="hero-fit" />
      </div>
      <Veil ready={ready} onLift={beginRise} label={t.loader} />

      <div className="hero-content">
        <header ref={headerRef} className="masthead">
          <a href="#top" className="logo" aria-label="Felix Huettenbach">
            <span className="logo-mark">FH</span>
            <span className="logo-word">Huettenbach</span>
          </a>
          <nav aria-label="Primary" className="masthead-nav">
            <ul>
              <li><a href="#bio">{t.nav.bio}</a></li>
              <li><a href="#ventures">{t.nav.ventures}</a></li>
              <li><a href="#journey">{t.nav.journey}</a></li>
              <li><a href="#contact">{t.nav.contact}</a></li>
            </ul>
          </nav>
          <div className="masthead-right">
            <LangSwitcher lang={lang} setLang={setLang} LANGUAGES={LANGUAGES} />
            <a href="https://youtube.com" className="garage-link" target="_blank" rel="noreferrer">
              <span aria-hidden="true">[ </span>{t.nav.garage}<span aria-hidden="true"> → ]</span>
            </a>
          </div>
          <div className="masthead-compact">
            <LangSwitcher lang={lang} setLang={setLang} LANGUAGES={LANGUAGES} />
            <button type="button" className="burger" aria-label="Menu" onClick={() => setMenu(true)}>
              <span /><span />
            </button>
          </div>
        </header>

        <div className="hero-middle">
          <div className="identity">
            <span ref={idRef} className="driver-id">{h.id}</span>
            <h1 className="name">
              <Words text="felix huettenbach" enabled={entered} delayIn={180} stagger={110} config={CFG.REVEAL} mode="once" gap={0.25} />
            </h1>
            <ul className="meta">
              {h.meta.map((m, i) => (
                <MetaRow key={i} enabled={entered} delay={180 + 260 + i * 130} index={i} label={m} />
              ))}
            </ul>
          </div>

          <div ref={panelsRef} className="panels" data-hero-panels>
            <div className="panel">
              <Bracket />
              <span className="eyebrow">{h.panel1.label}</span>
              <div className="panel-row">
                <dl className="panel-list">
                  <dt>{h.panel1.name}</dt>
                  <dd>{h.panel1.place}</dd>
                  <dd>{h.panel1.date}</dd>
                </dl>
                <img src="/media/felix-w8x.png" alt="" className="panel-map" aria-hidden="true" />
              </div>
            </div>
            <div className="panel">
              <Bracket />
              <span className="eyebrow">{h.panel2.label}</span>
              <dl className="stats" data-hero-stats>
                {h.panel2.stats.map(([label, value], i) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>
                      <Letters text={value} enabled={entered} delayIn={900 + i * 90} stagger={26} config={CFG.FIGURE} mode="once" />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        <div ref={actionsRef} className="actions">
          <a className="trailer" href="https://youtube.com" target="_blank" rel="noreferrer">
            <span className="play" aria-hidden="true">
              <svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="none" stroke="currentColor" /><path d="M13 10l9 6-9 6z" fill="currentColor" /></svg>
            </span>
            <span className="trailer-text">
              <span className="trailer-label">{h.trailer[0]}</span>
              <span className="trailer-time">{h.trailer[1]}</span>
            </span>
          </a>
          <a className="cta" href="#bio">
            <svg className="cta-frame" viewBox="0 0 220 50" preserveAspectRatio="none" aria-hidden="true">
              <path className="cta-body" d="M220 42L212.932 50H0V0H220V42Z" />
              <path className="cta-flood" d="M220 42L212.932 50H0V0H220V42Z" />
              <path className="cta-ring" d="M220 42L212.932 50H0V0H220V42Z" />
              <path className="cta-brackets" d="M205 49.5H213L219.5 42V36M212 0.5H219.5V7M8 0.5H0.5V7M7.5 49.5H0.5V42.5" />
            </svg>
            <span className="cta-label">{h.cta}</span>
            <svg className="cta-arrow" viewBox="0 0 13.7071 10.7071" aria-hidden="true"><path d="M0 5.35355H13M8 10.3536L13 5.35355L8 0.353553" /></svg>
          </a>
          <div className="socials">
            <a href="https://instagram.com" target="_blank" rel="noreferrer">inst</a>
            <a href="https://x.com" target="_blank" rel="noreferrer">x</a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer">youtube</a>
          </div>
        </div>
      </div>

      {menu && <Sheet t={t} close={() => setMenu(false)} lang={lang} setLang={setLang} LANGUAGES={LANGUAGES} />}
    </section>
  )
}

function LangSwitcher({ lang, setLang, LANGUAGES }) {
  return (
    <div className="lang-switcher" role="group" aria-label="Language">
      {LANGUAGES.map((l) => (
        <button key={l} type="button" className={l === lang ? 'active' : ''} onClick={() => setLang(l)} aria-label={`Switch language to ${l}`} aria-pressed={l === lang}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

function MetaRow({ enabled, delay, index, label }) {
  const ref = useAnimated({
    enabled,
    delayIn: delay,
    config: CFG.REVEAL,
    mode: 'once',
    apply: (v, el) => {
      el.style.opacity = v
      el.style.transform = `translateY(${(1 - v) * 0.75}rem)`
    },
  })
  const icons = [
    <span key="flag" className="flag-de" aria-hidden="true" />,
    <span key="star" className="star" aria-hidden="true">✦</span>,
    <span key="star2" className="star" aria-hidden="true">✦</span>,
  ]
  return (
    <li ref={ref}>
      {icons[index]}
      <span>{label}</span>
    </li>
  )
}

function Sheet({ t, close, lang, setLang, LANGUAGES }) {
  const ref = useAnimated({ enabled: true, config: CFG.SHEET, mode: 'once', apply: (v, el) => (el.style.opacity = v) })
  const closeRef = useRef(null)
  useEffect(() => {
    document.documentElement.classList.add('locked')
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && close()
    const onResize = () => window.innerWidth >= 1280 && close()
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      document.documentElement.classList.remove('locked')
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [close])
  const items = [
    ['#bio', t.nav.bio],
    ['#ventures', t.nav.ventures],
    ['#journey', t.nav.journey],
    ['#contact', t.nav.contact],
    ['https://youtube.com', t.nav.garage],
  ]
  return (
    <div ref={ref} className="sheet" role="dialog" aria-modal="true">
      <div className="sheet-top">
        <a href="#top" className="logo" onClick={close}><span className="logo-mark">FH</span></a>
        <button ref={closeRef} type="button" className="sheet-close" aria-label="Close" onClick={close}><span /><span /></button>
      </div>
      <nav className="sheet-nav">
        {items.map(([href, label], i) => (
          <SheetItem key={label} href={href} label={label} delay={120 + i * 55} close={close} />
        ))}
      </nav>
      <div className="sheet-lang">
        <LangSwitcher lang={lang} setLang={setLang} LANGUAGES={LANGUAGES} />
      </div>
    </div>
  )
}
function SheetItem({ href, label, delay, close }) {
  const ref = useAnimated({
    enabled: true,
    delayIn: delay,
    config: CFG.ROW,
    mode: 'once',
    apply: (v, el) => {
      el.style.opacity = v
      el.style.transform = `translateY(${(1 - v) * 0.75}rem)`
    },
  })
  return <a ref={ref} href={href} onClick={close}>{label}</a>
}
