import { useEffect, useRef, useState } from 'react'
import './App.css'

const HERO_FRAMES = [
  '/media/felix-skydiving.png',
  '/media/felix-tokyo.png',
  '/media/felix-helicopter.jpg',
  '/media/felix-rockclimbing.png',
  '/media/felix-upsidedown.png',
]

const VENTURES = [
  {
    year: '2017',
    name: 'W8X',
    desc: 'Fundador. Empresa de tecnología y entrenamiento de alto rendimiento.',
  },
  {
    year: '2020',
    name: 'Sameday Health',
    desc: 'Fundador. Plataforma de salud y diagnóstico bajo demanda.',
  },
  {
    year: '2018–2020',
    name: 'MIT / UMass Boston',
    desc: 'Guest Lecturer & Global Entrepreneur in Residence.',
  },
]

function useScrollProgress(ref) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function onScroll() {
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      const scrolled = -rect.top
      const p = total > 0 ? Math.min(Math.max(scrolled / total, 0), 1) : 0
      setProgress(p)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ref])

  return progress
}

function ScrollHero() {
  const wrapRef = useRef(null)
  const progress = useScrollProgress(wrapRef)

  const frameCount = HERO_FRAMES.length
  const rawIndex = progress * (frameCount - 1)
  const activeIndex = Math.min(Math.floor(rawIndex), frameCount - 2 >= 0 ? frameCount - 2 : 0)
  const localT = rawIndex - activeIndex

  return (
    <div ref={wrapRef} className="scroll-hero-wrap">
      <div className="scroll-hero-sticky">
        <div className="scroll-hero-frames">
          {HERO_FRAMES.map((src, i) => {
            let opacity = 0
            if (i === activeIndex) opacity = 1 - localT
            if (i === activeIndex + 1) opacity = localT
            if (frameCount === 1) opacity = 1
            const scale = 1.08 - progress * 0.08
            return (
              <img
                key={src}
                src={src}
                alt=""
                className="scroll-hero-frame"
                style={{ opacity, transform: `scale(${scale})` }}
              />
            )
          })}
        </div>
        <div className="scroll-hero-duotone" />
        <div className="scroll-hero-grid" />
        <div className="scroll-hero-scanlines" />
        <div className="scroll-hero-overlay" />
        <div className="scroll-hero-content" style={{ opacity: 1 - progress * 1.4 }}>
          <span className="eyebrow">Founder · Investor · Adventurer</span>
          <h1>
            Felix
            <br />
            Huettenbach
          </h1>
          <p>Construyendo el futuro, un riesgo calculado a la vez.</p>
          <div className="scroll-hint">Scroll ⇩</div>
        </div>
      </div>
    </div>
  )
}

function Nav() {
  return (
    <header className="nav">
      <span className="nav-logo">FH</span>
      <nav>
        <a href="#bio">Bio</a>
        <a href="#ventures">Ventures</a>
        <a href="#contact">Contacto</a>
      </nav>
    </header>
  )
}

function Bio() {
  return (
    <section id="bio" className="section bio">
      <div className="section-inner">
        <span className="section-label">01 — Bio</span>
        <h2>
          Fundador, inversor y aventurero. Honesto sobre el esfuerzo, el
          sacrificio y la disciplina que exige el éxito real.
        </h2>
        <div className="bio-grid">
          <img src="/media/felix-tokyo.png" alt="Felix Huettenbach en Tokio" />
          <p>
            Nacido en Alemania, Felix estudió en la Technical University of
            Munich, UC Berkeley y completó un programa de posgrado en el MIT
            en Entrepreneurial Studies. Antes de fundar sus propias empresas,
            trabajó en desarrollo de negocio, análisis de inversión en
            Aurelius Equity Opportunities y como Chief of Staff en Quantgene,
            una plataforma de detección temprana de cáncer con machine
            learning.
          </p>
        </div>
      </div>
    </section>
  )
}

function Ventures() {
  return (
    <section id="ventures" className="section ventures">
      <div className="section-inner">
        <span className="section-label">02 — Ventures</span>
        <h2>Lo que ha construido</h2>
        <ul className="ventures-list">
          {VENTURES.map((v) => (
            <li key={v.name}>
              <span className="venture-year">{v.year}</span>
              <span className="venture-name">{v.name}</span>
              <span className="venture-desc">{v.desc}</span>
            </li>
          ))}
        </ul>
        <div className="ventures-media">
          <img src="/media/felix-w8x.png" alt="Felix Huettenbach - W8X" />
          <img src="/media/felix-waterfall.png" alt="Felix Huettenbach aventura" />
          <img src="/media/felix-airplane.jpg" alt="Felix Huettenbach viajando" />
        </div>
      </div>
    </section>
  )
}

function Contact() {
  return (
    <section id="contact" className="section contact">
      <div className="section-inner">
        <span className="section-label">03 — Contacto</span>
        <h2>Hablemos.</h2>
        <a className="email-link" href="mailto:hello@felixhuettenbach.com">
          hello@felixhuettenbach.com
        </a>
        <div className="socials">
          <a href="#" aria-label="Instagram">Instagram</a>
          <a href="#" aria-label="YouTube">YouTube</a>
          <a href="#" aria-label="LinkedIn">LinkedIn</a>
        </div>
        <footer>© {new Date().getFullYear()} Felix Huettenbach</footer>
      </div>
    </section>
  )
}

function App() {
  return (
    <>
      <Nav />
      <ScrollHero />
      <Bio />
      <Ventures />
      <Contact />
    </>
  )
}

export default App
