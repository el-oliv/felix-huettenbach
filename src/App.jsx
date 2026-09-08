import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import './App.css'
import { LANGUAGES, translations, detectInitialLanguage } from './translations'
import { subscribe, reducedMotion } from './engine'
import { Hero } from './sections/Hero'
import { Journey } from './sections/Journey'
import { Timeline } from './sections/Timeline'
import { Field } from './sections/Field'
import { Footer } from './sections/Footer'

const RECEDE_SCALE = 0.9
const RECEDE_SHADE = 0.55

function useLanguage() {
  const [lang, setLang] = useState(detectInitialLanguage)
  useEffect(() => {
    try {
      window.localStorage.setItem('lang', lang)
    } catch {
      // ignore
    }
    document.documentElement.lang = lang
  }, [lang])
  return [lang, setLang]
}

function useLenis() {
  useEffect(() => {
    if (reducedMotion) return
    const lenis = new Lenis({ smoothWheel: true })
    window.__lenis = lenis
    const unsub = subscribe((time) => lenis.raf(time), () => 0)
    return () => {
      unsub()
      lenis.destroy()
    }
  }, [])
}

function useRootScale() {
  useEffect(() => {
    const apply = () => {
      const w = window.innerWidth
      document.documentElement.style.fontSize = w > 1920 ? `${(16 * w) / 1920}px` : ''
    }
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [])
}

/** The sticky stack: each pinned layer recedes as the next one covers it. */
function Stack({ children }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const layers = Array.from(root.children)
    const pinned = layers.slice(0, -1).map((layer, i) => ({
      inner: layer.querySelector('.layer-inner'),
      shade: layer.querySelector('.layer-shade'),
      next: layers[i + 1],
    }))
    const phone = window.matchMedia('(max-width: 639px)')
    let raf = 0
    const apply = () => {
      raf = 0
      const view = window.innerHeight || 1
      const shrink = phone.matches ? 0 : 1 - RECEDE_SCALE
      for (const { inner, shade, next } of pinned) {
        const p = Math.min(1, Math.max(0, 1 - next.getBoundingClientRect().top / view))
        inner.style.transform = p > 0 && shrink > 0 ? `scale(${1 - shrink * p})` : ''
        inner.style.willChange = p > 0 && shrink > 0 ? 'transform' : ''
        shade.style.opacity = `${RECEDE_SHADE * p}`
        inner.style.visibility = p >= 1 ? 'hidden' : 'visible'
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply)
    }
    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
  return (
    <div ref={ref} className="stack">
      {children}
    </div>
  )
}

function Layer({ children, z, last }) {
  return (
    <div className={`layer ${last ? 'layer-last' : ''}`} style={{ zIndex: z }}>
      <div className="layer-inner">{children}</div>
      {!last && <div className="layer-shade" aria-hidden="true" />}
    </div>
  )
}

function App() {
  const [lang, setLang] = useLanguage()
  const t = translations[lang]
  useLenis()
  useRootScale()
  useEffect(() => {
    history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <Stack>
        <Layer z={0}>
          <Hero t={t} lang={lang} setLang={setLang} LANGUAGES={LANGUAGES} />
        </Layer>
        <Layer z={10}>
          <Journey t={t} />
        </Layer>
        <Layer z={20} last>
          <Timeline t={t} />
        </Layer>
      </Stack>
      <Field t={t} />
      <Footer t={t} />
    </>
  )
}

export default App
