import { isPhotoTemplate } from './catalog'
import type { PhotoTemplate } from './types'

// A template saved as one file and opened again (ADR 0040, specs/mockups.md, Template files): the
// whole template, with its photo and its selection inside as data URLs, so the user keeps it with
// the client's files and the app saves nothing (ADR 0002).

export const TEMPLATE_FILE_EXTENSION = '.template.json'
export const MAX_TEMPLATE_FILE_BYTES = 15 * 1024 * 1024 // a 10 MB photo makes about 14 MB

type TemplateFile = {
  app: 'ManuallyInstant'
  kind: 'mockup-template'
  version: 1
  template: PhotoTemplate
}

// The only images a file may carry: a photo of its own, never an address to fetch
const PHOTO_DATA_URL = /^data:image\/(png|jpeg|webp);base64,/
const MASK_DATA_URL = /^data:image\/png;base64,/

// A file name made of the template's name: letters, digits and dashes
export function templateFileName(name: string) {
  const safe = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${safe || 'template'}${TEMPLATE_FILE_EXTENSION}`
}

// Any image the browser holds (a blob of this session, a file of the app, a data URL) as a data
// URL of its own type, so a PNG keeps its transparency
export async function toDataUrl(url: string) {
  if (url.startsWith('data:')) return url
  const blob = await (await fetch(url)).blob()
  return new Promise<string>((done, fail) => {
    const reader = new FileReader()
    reader.onload = () => done(reader.result as string)
    reader.onerror = () => fail(reader.error)
    reader.readAsDataURL(blob)
  })
}

// A file's text (FileReader rather than file.text(), which jsdom lacks)
export function readFileText(file: Blob) {
  return new Promise<string>((done, fail) => {
    const reader = new FileReader()
    reader.onload = () => done(reader.result as string)
    reader.onerror = () => fail(reader.error)
    reader.readAsText(file)
  })
}

// The file's text for a template whose photo is already a data URL
export function templateFileText(template: PhotoTemplate) {
  const file: TemplateFile = {
    app: 'ManuallyInstant',
    kind: 'mockup-template',
    version: 1,
    template: { ...template, revision: undefined },
  }
  return JSON.stringify(file, null, 2)
}

// The template in a file's text, or null when it is not one of ours (checked, never run)
export function readTemplateFile(text: string): PhotoTemplate | null {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  const file = data as Partial<TemplateFile> | null
  if (!file || file.app !== 'ManuallyInstant' || file.kind !== 'mockup-template' || file.version !== 1) return null
  const template = file.template
  if (!isPhotoTemplate(template) || !PHOTO_DATA_URL.test(template.image)) return null
  if (template.maskImage !== undefined && (typeof template.maskImage !== 'string' || !MASK_DATA_URL.test(template.maskImage)))
    return null
  return template
}
