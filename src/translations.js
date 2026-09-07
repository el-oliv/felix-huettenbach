export const LANGUAGES = ['en', 'es', 'de']

export const translations = {
  en: {
    nav: { bio: 'Bio', ventures: 'Ventures', contact: 'Contact' },
    hero: {
      eyebrow: 'Founder · Investor · Adventurer',
      tagline: 'Building the future, one calculated risk at a time.',
      scroll: 'Scroll',
    },
    bio: {
      label: '01 — Bio',
      heading:
        'Founder, investor and adventurer. Completely honest about the grit, sacrifice and discipline his success has required.',
      body: 'Born in Germany, Felix studied at the Technical University of Munich and UC Berkeley, and completed a graduate program at MIT in Entrepreneurial Studies. Before founding his own companies, he worked in business development, investment analysis at Aurelius Equity Opportunities, and as Chief of Staff at Quantgene, a machine-learning platform for early cancer detection.',
    },
    ventures: {
      label: '02 — Ventures',
      heading: 'What he has built',
      items: [
        { year: '2017', name: 'W8X', desc: 'Founder. High-performance training and technology company.' },
        { year: '2020', name: 'Sameday Health', desc: 'Founder. On-demand health and diagnostics platform.' },
        { year: '2018–2020', name: 'MIT / UMass Boston', desc: 'Guest Lecturer & Global Entrepreneur in Residence.' },
      ],
    },
    contact: {
      label: '03 — Contact',
      heading: "Let's talk.",
    },
  },
  es: {
    nav: { bio: 'Bio', ventures: 'Ventures', contact: 'Contacto' },
    hero: {
      eyebrow: 'Fundador · Inversor · Aventurero',
      tagline: 'Construyendo el futuro, un riesgo calculado a la vez.',
      scroll: 'Scroll',
    },
    bio: {
      label: '01 — Bio',
      heading:
        'Fundador, inversor y aventurero. Honesto sobre el esfuerzo, el sacrificio y la disciplina que exige el éxito real.',
      body: 'Nacido en Alemania, Felix estudió en la Technical University of Munich y UC Berkeley, y completó un programa de posgrado en el MIT en Entrepreneurial Studies. Antes de fundar sus propias empresas, trabajó en desarrollo de negocio, análisis de inversión en Aurelius Equity Opportunities y como Chief of Staff en Quantgene, una plataforma de detección temprana de cáncer con machine learning.',
    },
    ventures: {
      label: '02 — Ventures',
      heading: 'Lo que ha construido',
      items: [
        { year: '2017', name: 'W8X', desc: 'Fundador. Empresa de tecnología y entrenamiento de alto rendimiento.' },
        { year: '2020', name: 'Sameday Health', desc: 'Fundador. Plataforma de salud y diagnóstico bajo demanda.' },
        { year: '2018–2020', name: 'MIT / UMass Boston', desc: 'Guest Lecturer & Global Entrepreneur in Residence.' },
      ],
    },
    contact: {
      label: '03 — Contacto',
      heading: 'Hablemos.',
    },
  },
  de: {
    nav: { bio: 'Bio', ventures: 'Ventures', contact: 'Kontakt' },
    hero: {
      eyebrow: 'Gründer · Investor · Abenteurer',
      tagline: 'Die Zukunft gestalten, ein kalkuliertes Risiko nach dem anderen.',
      scroll: 'Scrollen',
    },
    bio: {
      label: '01 — Bio',
      heading:
        'Gründer, Investor und Abenteurer. Vollkommen ehrlich über die Härte, die Opfer und die Disziplin, die sein Erfolg erfordert hat.',
      body: 'Geboren in Deutschland, studierte Felix an der Technischen Universität München und der UC Berkeley und absolvierte ein Graduiertenprogramm am MIT im Bereich Entrepreneurial Studies. Bevor er seine eigenen Unternehmen gründete, arbeitete er in der Geschäftsentwicklung, als Investmentanalyst bei Aurelius Equity Opportunities und als Chief of Staff bei Quantgene, einer Machine-Learning-Plattform zur Früherkennung von Krebs.',
    },
    ventures: {
      label: '02 — Ventures',
      heading: 'Was er aufgebaut hat',
      items: [
        { year: '2017', name: 'W8X', desc: 'Gründer. Unternehmen für High-Performance-Training und Technologie.' },
        { year: '2020', name: 'Sameday Health', desc: 'Gründer. Plattform für Gesundheit und Diagnostik auf Abruf.' },
        { year: '2018–2020', name: 'MIT / UMass Boston', desc: 'Gastdozent & Global Entrepreneur in Residence.' },
      ],
    },
    contact: {
      label: '03 — Kontakt',
      heading: 'Lass uns reden.',
    },
  },
}

export function detectInitialLanguage() {
  if (typeof window === 'undefined') return 'en'
  try {
    const stored = window.localStorage.getItem('lang')
    if (stored && LANGUAGES.includes(stored)) return stored
  } catch {
    // ignore storage errors
  }
  const browserLang = (navigator.language || 'en').slice(0, 2)
  return LANGUAGES.includes(browserLang) ? browserLang : 'en'
}
