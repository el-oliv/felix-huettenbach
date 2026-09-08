export const LANGUAGES = ['en', 'es', 'de']

// src + the focal point (where the face is), as object-position, so the cover crop keeps it.
const timelinePhotos = {
  2012: { src: '/media/felix-stairs.png', focus: '52% 50%' },
  2015: { src: '/media/felix-helicopter.jpg', focus: '48% 38%' },
  2016: { src: '/media/felix-waterfall.png', focus: '56% 88%' },
  2017: { src: '/media/felix-w8x.png', focus: '50% 50%' },
  2018: { src: '/media/felix-airplane.jpg', focus: '40% 50%' },
  2020: { src: '/media/felix-rockclimbing.png', focus: '43% 52%' },
  2026: { src: '/media/felix-tokyo.png', focus: '50% 45%' },
}
const timelineFrames = ['centre', 'side', 'centre', 'side', 'centre', 'side', 'centre']
const timelineAlign = [null, 'right', null, 'left', null, 'right', null]

const buildTimeline = (rows) =>
  rows.map((r, i) => ({ ...r, frame: timelineFrames[i], align: timelineAlign[i], ...timelinePhotos[r.year] }))

export const translations = {
  en: {
    nav: { bio: 'Bio', ventures: 'Ventures', journey: 'Journey', contact: 'Contact', garage: 'YouTube' },
    hero: {
      id: 'founder_1993',
      eyebrow: 'Founder · Investor · Adventurer',
      meta: ['Germany', 'based in Dubai_2026', 'W8X · Sameday Health'],
      panel1: { label: 'Latest venture', name: 'Sameday Health', place: 'founded 2020', date: 'on-demand health' },
      panel2: { label: 'By the numbers', stats: [['Ventures', '2'], ['Degrees', '3'], ['Continents', '5']] },
      trailer: ['watch channel', '30 min'],
      cta: 'view profile',
      scroll: 'Scroll',
    },
    journey: {
      lines: ['the journey', 'so far'],
      intro: "Every venture is a step forward. Here's how it is shaping up.",
      badge: ['FH', '/ 2026'],
      rows: [['Dubai', 'current base'], ['2', 'companies founded'], ['30', 'years on earth.']],
      turns: ['Munich', 'Berkeley', 'Boston', 'Dubai'],
    },
    timeline: {
      lines: ['from munich', 'to dubai'],
      rows: buildTimeline([
        { year: '2012', lead: 'The first step.', copy: 'Felix enrols at the Technical University of Munich — Applied Science and Technology Management.' },
        { year: '2015' },
        { year: '2016', lead: 'California.', copy: 'UC Berkeley, then the investment team at Aurelius Equity Opportunities — due diligence, valuations, deal structuring.' },
        { year: '2017' },
        { year: '2018', lead: 'MIT and the first company.', copy: 'A graduate program in Entrepreneurial Studies, W8X founded, and a chair as Global Entrepreneur in Residence at UMass Boston.' },
        { year: '2020' },
        { year: '2026', lead: 'From munich to dubai.', copy: 'Two companies, a YouTube channel and a life built on calculated risk — with Dubai as the anchor.' },
      ]),
    },
    field: {
      lines: ['from the', 'field'],
      report: 'Thirty years in, two companies built and a channel documenting the grit behind it — Felix is honest about what success actually costs.',
      cta: 'read story',
      meet: ['next drop', 'youtube', 'weekly'],
      stats: [['latest', 'W8X'], ['founded', '2017'], ['companies', '2'], ['base', 'DXB']],
      strip: {
        rounds: [
          ['stop 11', 'iceland', 'feb'],
          ['stop 12', 'tokyo', 'apr'],
          ['stop 13', 'dubai', 'now'],
          ['stop 14', 'rio', 'sep'],
          ['stop 15', 'macao', 'nov'],
        ],
      },
    },
    footer: {
      lines: ['keep moving', 'forward'],
      nav: ['bio', 'ventures', 'journey', 'contact', 'youtube'],
      legal: 'legal documents',
      copyright: '© 2026 Felix Huettenbach. All rights reserved.',
    },
    loader: 'Loading',
  },
  es: {
    nav: { bio: 'Bio', ventures: 'Ventures', journey: 'Trayectoria', contact: 'Contacto', garage: 'YouTube' },
    hero: {
      id: 'founder_1993',
      eyebrow: 'Fundador · Inversor · Aventurero',
      meta: ['Alemania', 'con base en Dubái_2026', 'W8X · Sameday Health'],
      panel1: { label: 'Última empresa', name: 'Sameday Health', place: 'fundada en 2020', date: 'salud bajo demanda' },
      panel2: { label: 'En cifras', stats: [['Empresas', '2'], ['Títulos', '3'], ['Continentes', '5']] },
      trailer: ['ver canal', '30 min'],
      cta: 'ver perfil',
      scroll: 'Scroll',
    },
    journey: {
      lines: ['la trayectoria', 'hasta hoy'],
      intro: 'Cada empresa es un paso adelante. Así va tomando forma.',
      badge: ['FH', '/ 2026'],
      rows: [['Dubái', 'base actual'], ['2', 'empresas fundadas'], ['30', 'años en la tierra.']],
      turns: ['Múnich', 'Berkeley', 'Boston', 'Dubái'],
    },
    timeline: {
      lines: ['de múnich', 'a dubái'],
      rows: buildTimeline([
        { year: '2012', lead: 'El primer paso.', copy: 'Felix entra en la Technical University of Munich — Applied Science and Technology Management.' },
        { year: '2015' },
        { year: '2016', lead: 'California.', copy: 'UC Berkeley y después el equipo de inversión de Aurelius Equity Opportunities — due diligence, valoraciones, estructuración.' },
        { year: '2017' },
        { year: '2018', lead: 'MIT y la primera empresa.', copy: 'Posgrado en Entrepreneurial Studies, fundación de W8X y cátedra como Global Entrepreneur in Residence en UMass Boston.' },
        { year: '2020' },
        { year: '2026', lead: 'De múnich a dubái.', copy: 'Dos empresas, un canal de YouTube y una vida construida sobre riesgos calculados — con Dubái como ancla.' },
      ]),
    },
    field: {
      lines: ['desde el', 'terreno'],
      report: 'Treinta años, dos empresas y un canal que documenta el esfuerzo detrás — Felix es honesto sobre lo que cuesta realmente el éxito.',
      cta: 'leer historia',
      meet: ['próximo vídeo', 'youtube', 'semanal'],
      stats: [['última', 'W8X'], ['fundada', '2017'], ['empresas', '2'], ['base', 'DXB']],
      strip: {
        rounds: [
          ['parada 11', 'islandia', 'feb'],
          ['parada 12', 'tokio', 'abr'],
          ['parada 13', 'dubái', 'ahora'],
          ['parada 14', 'río', 'sep'],
          ['parada 15', 'macao', 'nov'],
        ],
      },
    },
    footer: {
      lines: ['sigue', 'adelante'],
      nav: ['bio', 'ventures', 'trayectoria', 'contacto', 'youtube'],
      legal: 'documentos legales',
      copyright: '© 2026 Felix Huettenbach. Todos los derechos reservados.',
    },
    loader: 'Cargando',
  },
  de: {
    nav: { bio: 'Bio', ventures: 'Ventures', journey: 'Werdegang', contact: 'Kontakt', garage: 'YouTube' },
    hero: {
      id: 'founder_1993',
      eyebrow: 'Gründer · Investor · Abenteurer',
      meta: ['Deutschland', 'lebt in Dubai_2026', 'W8X · Sameday Health'],
      panel1: { label: 'Neuestes Unternehmen', name: 'Sameday Health', place: 'gegründet 2020', date: 'Gesundheit auf Abruf' },
      panel2: { label: 'In Zahlen', stats: [['Firmen', '2'], ['Abschlüsse', '3'], ['Kontinente', '5']] },
      trailer: ['kanal ansehen', '30 min'],
      cta: 'profil ansehen',
      scroll: 'Scrollen',
    },
    journey: {
      lines: ['der weg', 'bis heute'],
      intro: 'Jedes Unternehmen ist ein Schritt nach vorn. So nimmt es Gestalt an.',
      badge: ['FH', '/ 2026'],
      rows: [['Dubai', 'aktuelle basis'], ['2', 'gegründete firmen'], ['30', 'jahre auf der erde.']],
      turns: ['München', 'Berkeley', 'Boston', 'Dubai'],
    },
    timeline: {
      lines: ['von münchen', 'nach dubai'],
      rows: buildTimeline([
        { year: '2012', lead: 'Der erste Schritt.', copy: 'Felix beginnt an der Technischen Universität München — Applied Science and Technology Management.' },
        { year: '2015' },
        { year: '2016', lead: 'Kalifornien.', copy: 'UC Berkeley, dann das Investmentteam von Aurelius Equity Opportunities — Due Diligence, Bewertungen, Strukturierung.' },
        { year: '2017' },
        { year: '2018', lead: 'MIT und die erste Firma.', copy: 'Graduiertenprogramm in Entrepreneurial Studies, Gründung von W8X und Global Entrepreneur in Residence an der UMass Boston.' },
        { year: '2020' },
        { year: '2026', lead: 'Von münchen nach dubai.', copy: 'Zwei Unternehmen, ein YouTube-Kanal und ein Leben aus kalkulierten Risiken — mit Dubai als Anker.' },
      ]),
    },
    field: {
      lines: ['aus dem', 'feld'],
      report: 'Dreißig Jahre, zwei Firmen und ein Kanal, der die Härte dahinter zeigt — Felix ist ehrlich darüber, was Erfolg wirklich kostet.',
      cta: 'story lesen',
      meet: ['nächstes video', 'youtube', 'wöchentlich'],
      stats: [['neueste', 'W8X'], ['gegründet', '2017'], ['firmen', '2'], ['basis', 'DXB']],
      strip: {
        rounds: [
          ['stopp 11', 'island', 'feb'],
          ['stopp 12', 'tokio', 'apr'],
          ['stopp 13', 'dubai', 'jetzt'],
          ['stopp 14', 'rio', 'sep'],
          ['stopp 15', 'macau', 'nov'],
        ],
      },
    },
    footer: {
      lines: ['immer', 'weiter'],
      nav: ['bio', 'ventures', 'werdegang', 'kontakt', 'youtube'],
      legal: 'rechtliches',
      copyright: '© 2026 Felix Huettenbach. Alle Rechte vorbehalten.',
    },
    loader: 'Laden',
  },
}

export function detectInitialLanguage() {
  if (typeof window === 'undefined') return 'en'
  try {
    const stored = window.localStorage.getItem('lang')
    if (stored && LANGUAGES.includes(stored)) return stored
  } catch {
    // ignore
  }
  const browserLang = (navigator.language || 'en').slice(0, 2)
  return LANGUAGES.includes(browserLang) ? browserLang : 'en'
}
