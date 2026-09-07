import { useEffect, useRef, useState } from 'react'
import './App.css'
import { LANGUAGES, translations, detectInitialLanguage } from './translations'

const HERO_FRAMES = [
  '/media/felix-skydiving.png',
  '/media/felix-tokyo.png',
  '/media/felix-helicopter.jpg',
  '/media/felix-rockclimbing.png',
  '/media/felix-upsidedown.png',
]

function useLanguage() {
  const [lang, setLang] = useState(detectInitialLanguage)

  useEffect(() => {
    try {
      window.localStorage.setItem('lang', lang)
    } catch {
      // ignore storage errors
    }
    document.documentElement.lang = lang
  }, [lang])

  return [lang, setLang]
}

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

function ScrollHero({ t }) {
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
          <span className="eyebrow">{t.hero.eyebrow}</span>
          <h1>
            Felix
            <br />
            Huettenbach
          </h1>
          <p>{t.hero.tagline}</p>
          <div className="scroll-hint">{t.hero.scroll} ⇩</div>
        </div>
      </div>
    </div>
  )
}

function LanguageSwitcher({ lang, setLang }) {
  return (
    <div className="lang-switcher">
      {LANGUAGES.map((l) => (
        <button
          key={l}
          type="button"
          className={l === lang ? 'active' : ''}
          onClick={() => setLang(l)}
          aria-label={`Switch language to ${l}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

function Nav({ t, lang, setLang }) {
  return (
    <header className="nav">
      <span className="nav-logo">FH</span>
      <nav>
        <a href="#bio">{t.nav.bio}</a>
        <a href="#ventures">{t.nav.ventures}</a>
        <a href="#contact">{t.nav.contact}</a>
        <LanguageSwitcher lang={lang} setLang={setLang} />
      </nav>
    </header>
  )
}

function Bio({ t }) {
  return (
    <section id="bio" className="section bio">
      <div className="section-inner">
        <span className="section-label">{t.bio.label}</span>
        <h2>{t.bio.heading}</h2>
        <div className="bio-grid">
          <img src="/media/felix-tokyo.png" alt="Felix Huettenbach in Tokyo" />
          <p>{t.bio.body}</p>
        </div>
      </div>
    </section>
  )
}

function Ventures({ t }) {
  return (
    <section id="ventures" className="section ventures">
      <div className="section-inner">
        <span className="section-label">{t.ventures.label}</span>
        <h2>{t.ventures.heading}</h2>
        <ul className="ventures-list">
          {t.ventures.items.map((v) => (
            <li key={v.name}>
              <span className="venture-year">{v.year}</span>
              <span className="venture-name">{v.name}</span>
              <span className="venture-desc">{v.desc}</span>
            </li>
          ))}
        </ul>
        <div className="ventures-media">
          <img src="/media/felix-w8x.png" alt="Felix Huettenbach - W8X" />
          <img src="/media/felix-waterfall.png" alt="Felix Huettenbach adventure" />
          <img src="/media/felix-airplane.jpg" alt="Felix Huettenbach travel" />
        </div>
      </div>
    </section>
  )
}

function Contact({ t }) {
  return (
    <section id="contact" className="section contact">
      <div className="section-inner">
        <span className="section-label">{t.contact.label}</span>
        <h2>{t.contact.heading}</h2>
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
  const [lang, setLang] = useLanguage()
  const t = translations[lang]

  return (
    <>
      <Nav t={t} lang={lang} setLang={setLang} />
      <ScrollHero t={t} />
      <Bio t={t} />
      <Ventures t={t} />
      <Contact t={t} />
    </>
  )
}

export default App
