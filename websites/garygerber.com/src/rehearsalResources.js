const DEFAULT_STAGE_PLOT_HREF = '/files/stage-plot.pdf'
const DEFAULT_REHEARSAL_CHECKLIST_HREF = '/files/rehearsal-checklist.pdf'
const DEFAULT_PRODUCTION_EMAIL = 'hello@garygerber.com'
const DEFAULT_PRODUCTION_EMAIL_SUBJECT = 'Collaboration Notes'

const env = import.meta.env ?? {}

const stagePlotHref = env.VITE_REHEARSAL_RESOURCES_STAGE_PLOT_URL ?? DEFAULT_STAGE_PLOT_HREF

const rehearsalChecklistHref =
  env.VITE_REHEARSAL_RESOURCES_CHECKLIST_URL ?? DEFAULT_REHEARSAL_CHECKLIST_HREF

const productionEmail = env.VITE_REHEARSAL_RESOURCES_PRODUCTION_EMAIL ?? DEFAULT_PRODUCTION_EMAIL

const productionEmailSubject =
  env.VITE_REHEARSAL_RESOURCES_PRODUCTION_EMAIL_SUBJECT ?? DEFAULT_PRODUCTION_EMAIL_SUBJECT

function createMailtoHref(address, subject) {
  if (!address) return ''

  if (address.startsWith('mailto:')) {
    return address
  }

  const baseHref = `mailto:${address}`

  if (!subject) {
    return baseHref
  }

  const separator = baseHref.includes('?') ? '&' : '?'
  return `${baseHref}${separator}subject=${encodeURIComponent(subject)}`
}

const productionEmailHref = createMailtoHref(productionEmail, productionEmailSubject)

const upcomingEvents = [
  {
    id: 'tech-rehearsal',
    title: 'Tech rehearsal — Northern Lights residency',
    date: 'October 2, 2025 • 6:30 PM CDT',
    location: 'Orchestra Hall, Minneapolis',
    details: 'Lighting focus, transitions, and final balance notes with presenter crew.',
    callTimes: [
      { label: 'Load-in window', value: '4:30 PM stage door — Marquette Avenue' },
      { label: 'Sound check', value: '5:15 PM with house engineer' },
      { label: 'Full company on stage', value: '6:00 PM' },
    ],
  },
  {
    id: 'dress-rehearsal',
    title: 'Dress rehearsal with guest vocalists',
    date: 'October 3, 2025 • 2:00 PM CDT',
    location: 'Orchestra Hall, Minneapolis',
    details: 'Run-through with storytellers and camera placements for livestream capture.',
    callTimes: [
      { label: 'Artists arrival', value: '12:30 PM green room' },
      { label: 'Orchestra warm-up', value: '1:00 PM on stage' },
      { label: 'Livestream tech check', value: '1:30 PM FOH booth' },
    ],
  },
]

const rehearsalNotes = [
  'Load-in through the Marquette Avenue stage door — security will have badges ready for collaborators.',
  'Presenter provides a Steinway D tuned to A440; bring keyboard rig for “Aurora Sketches” electronics cue.',
  'Hospitality lounge stocked from 1:00 PM; dietary notes sent to hospitality lead Jordan Blake.',
  'All printed scores live in the rehearsal binder — PDF updates will be mirrored here when shared.',
]

const calendar = {
  embedSrc:
    'https://calendar.google.com/calendar/embed?src=garygerber.com_rehearsals%40example.com&mode=AGENDA&ctz=America%2FChicago',
  subscribeHref:
    'https://calendar.google.com/calendar/u/0?cid=Z2FyeWdlcmJlci5jb21fcmVoZWFyc2Fsc0BleGFtcGxlLmNvbQ',
  description:
    'Subscribe to stay current on call times, livestream holds, and hospitality windows across each residency.',
}

const contacts = [
  {
    id: 'production',
    name: 'Production team',
    role: 'Schedule updates & instrumentation changes',
    emailHref: productionEmailHref,
    emailLabel: productionEmail,
  },
  {
    id: 'stage-manager',
    name: 'Lena Ortiz',
    role: 'Stage manager — backstage access & cues',
    phoneHref: 'tel:+16125550148',
    phoneLabel: '+1 (612) 555-0148',
    emailHref: 'mailto:lena.ortiz@northlightsvenue.com',
    emailLabel: 'lena.ortiz@northlightsvenue.com',
  },
  {
    id: 'hospitality',
    name: 'Jordan Blake',
    role: 'Hospitality — travel, lodging, and green room',
    phoneHref: 'tel:+16125550162',
    phoneLabel: '+1 (612) 555-0162',
    emailHref: 'mailto:jordan.blake@northlightsvenue.com',
    emailLabel: 'jordan.blake@northlightsvenue.com',
  },
]

export const rehearsalResources = {
  stagePlotHref,
  rehearsalChecklistHref,
  productionEmailHref,
  upcomingEvents,
  rehearsalNotes,
  calendar,
  contacts,
}

export default rehearsalResources
