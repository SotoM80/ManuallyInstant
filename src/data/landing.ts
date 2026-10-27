// Every text, number, image and link of the Home landing page (see specs/landing.md).
// These are placeholders: replace them with the studio's real content.
// The components only read from here, so changing the content never needs a change in them.

export type Stat = { value: string; label: string }
export type TeamMember = { name: string; role: string }
export type Service = { title: string; text: string; to?: string } // `to`: a page of the app
export type Project = { client: string; title: string; category: string; year: number; image: string }
export type SocialLink = { label: string; url: string }

export const STUDIO = {
  name: 'Forma Studio',
  claim: 'We build brands that people remember, and the manuals that keep them consistent.',
  email: 'hello@formastudio.example',
}

export const MARQUEE_WORDS = ['Branding', 'Identity', 'Packaging', 'Type', 'Editorial', 'Motion', 'Manuals']

export const ABOUT = {
  manifesto:
    'We are a small, independent graphic design studio. We believe a brand is a promise kept every day, on every screen and every shelf, so we design identities with rules clear enough for anyone to follow.',
  stats: [
    { value: '12', label: 'years designing' },
    { value: '140+', label: 'brands built' },
    { value: '9', label: 'countries' },
  ] satisfies Stat[],
  team: [
    { name: 'Alex Rivera', role: 'Creative director' },
    { name: 'Sam Okafor', role: 'Brand designer' },
    { name: 'Noa Lindqvist', role: 'Type & editorial' },
  ] satisfies TeamMember[],
}

export const SERVICES: Service[] = [
  { title: 'Brand identity', text: 'Naming, logo, voice and the system that ties them together.' },
  {
    title: 'Visual identity manuals',
    text: 'Clear brand books, made with our own tool, ManuallyInstant.',
    to: '/brand-manual',
  },
  { title: 'Packaging', text: 'Boxes, labels and bags that stand out on the shelf.' },
  { title: 'Editorial', text: 'Books, magazines and reports with a strong typographic voice.' },
  { title: 'Motion', text: 'Logos and layouts that move, for screens and social media.' },
]

// Images live in public/work/; replace each file (or the path) with the real project image.
export const PROJECTS: Project[] = [
  { client: 'Nordlicht', title: 'A coffee roaster from the north', category: 'Brand identity', year: 2026, image: '/work/project-1.svg' },
  { client: 'Ola Verde', title: 'Plant-based snacks', category: 'Packaging', year: 2026, image: '/work/project-2.svg' },
  { client: 'Museo Tinta', title: 'A museum of print', category: 'Visual identity manual', year: 2025, image: '/work/project-3.svg' },
  { client: 'Kiko Bikes', title: 'Urban bikes, bold colors', category: 'Brand identity', year: 2025, image: '/work/project-4.svg' },
  { client: 'Papel & Co', title: 'Quarterly paper magazine', category: 'Editorial', year: 2024, image: '/work/project-5.svg' },
  { client: 'Sonar Fest', title: 'A music festival that moves', category: 'Motion', year: 2024, image: '/work/project-6.svg' },
]

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'Instagram', url: 'https://www.instagram.com/' },
  { label: 'Behance', url: 'https://www.behance.net/' },
  { label: 'Dribbble', url: 'https://dribbble.com/' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/' },
]
