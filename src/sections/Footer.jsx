// "Keep moving forward" — a cyan page edge, a near-black panel inset 16, the figure riding back
// into place as the page bottoms out.
import { useRef } from 'react'
import { CFG, useAnimated, useInView, useScrub } from '../engine'
import { Words, Letters } from '../text'
import { ContourCanvas } from '../canvases'
import { Dot } from './Journey'

function Rise({ enabled, delay, className = '', children, style, as: Tag = 'div' }) {
  const ref = useAnimated({
    enabled,
    delayIn: delay,
    config: CFG.REVEAL,
    mode: 'forward',
    apply: (v, el) => {
      el.style.opacity = v
      el.style.transform = `translateY(${(1 - v) * 0.75}rem)`
    },
  })
  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  )
}

export function Footer({ t }) {
  const f = t.footer
  const sectionRef = useRef(null)
  const figureRef = useRef(null)
  const [headRef, inView] = useInView('0% 0% -10% 0%')
  useScrub(sectionRef, 'top bottom', 'bottom bottom', (p) => {
    if (figureRef.current) figureRef.current.style.top = `${(60 / 1440) * 100 * (1 - p)}cqw`
  })
  const logoRef = useAnimated({ enabled: inView, delayIn: 120, mode: 'forward', apply: (v, el) => (el.style.opacity = v) })
  const links = [['#bio', f.nav[0]], ['#ventures', f.nav[1]], ['#journey', f.nav[2]], ['#contact', f.nav[3]], ['https://youtube.com', f.nav[4]]]
  return (
    <section
      ref={(el) => {
        sectionRef.current = el
        headRef.current = el
      }}
      className="footer"
      id="contact"
    >
      <div className="footer-panel">
        <ContourCanvas colour="rgb(255 255 255 / 0.1)" />
      </div>
      <div ref={figureRef} className="footer-figure" aria-hidden="true">
        <img src="/media/felix-upsidedown.png" alt="" className="footer-body" crossOrigin="anonymous" />
      </div>

      <a ref={logoRef} href="#top" className="footer-logo" aria-label="Felix Huettenbach">FH</a>
      <h2 className="masthead-h2 accent footer-head">
        {f.lines.map((line, i) => (
          <span key={i} className="line">
            <Words text={line} enabled={inView} delayIn={i * 130} stagger={110} config={CFG.REVEAL} mode="forward" gap={0.25} />
            {i === f.lines.length - 1 && <Dot enabled={inView} delay={130 + 110} className="white" />}
          </span>
        ))}
      </h2>
      <nav className="footer-nav" aria-label="Footer">
        {links.map(([href, label], i) => (
          <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
            <Letters text={label} enabled={inView} delayIn={260 + i * 80} stagger={22} config={CFG.ROW} mode="forward" gap={0.02} />
          </a>
        ))}
      </nav>

      <Rise enabled={inView} delay={640} className="footer-copy">{f.copyright}</Rise>
      <Rise enabled={inView} delay={720} className="footer-cta-wrap">
        <a className="cta cta-hollow" href="mailto:hello@felixhuettenbach.com">
          <svg className="cta-frame" viewBox="0 0 275 50" preserveAspectRatio="none" aria-hidden="true">
            <path className="cta-flood" d="M0.5 0.5H274.5V41.165L266.165 49.5H0.5Z" />
            <path className="cta-ring" d="M0.5 0.5H274.5V41.165L266.165 49.5H0.5Z" />
          </svg>
          <span className="cta-label">hello@felixhuettenbach.com</span>
          <svg className="cta-arrow" viewBox="0 0 13.7071 10.7071" aria-hidden="true"><path d="M0 5.35H13M8 10.35L13 5.35L8 0.35" /></svg>
        </a>
      </Rise>
      <Rise enabled={inView} delay={800} className="footer-socials">
        <a href="https://instagram.com" target="_blank" rel="noreferrer">inst</a>
        <a href="https://x.com" target="_blank" rel="noreferrer">x</a>
        <a href="https://youtube.com" target="_blank" rel="noreferrer">youtube</a>
      </Rise>
    </section>
  )
}
