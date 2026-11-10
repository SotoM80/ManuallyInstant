import { expect, test, type Page } from '@playwright/test'

// Spec: specs/everyview.md (ADRs 0027, 0028, 0030). Every page must look the same in Grid,
// Overview, Pages and the full screen view (drawn like the PDF): each text at the same share
// of the page's width, broken into the same number of lines. Numbers only, no screenshots.

const TEMPLATES = ['Template 1', 'Template 2', 'Template 3'] as const
const ORIENTATIONS = ['Landscape', 'Portrait'] as const
const VIEWS = ['Overview', 'Pages', 'Full screen'] as const

// A text's size as a share of its page's width may differ this much (rounding)
const SHARE_TOLERANCE = 0.01

type Text = { text: string; share: number; lines: number }
type Pages = Record<string, Text[]>

// Fills every section with text only (no images), long enough to break into several lines
async function fillManual(page: Page) {
  const sections = page.getByRole('region', { name: 'Manual sections' })
  async function open(name: RegExp) {
    const button = sections.getByRole('button', { name })
    if ((await button.getAttribute('aria-expanded')) !== 'true') await button.click()
  }

  await page.getByLabel('Brand manual title', { exact: true }).fill('Northwind Coffee Roasters Visual Identity Guidelines')
  await page.getByLabel('Designed by', { exact: true }).fill('Northwind Creative Studio')

  await open(/^2\. Logo/)
  await page.getByLabel('Brand name', { exact: true }).fill('Northwind Coffee')
  await page
    .getByLabel('Concept', { exact: true })
    .fill(
      'A compass rose drawn as a coffee bean: the brand guides people to a slow, warm cup, wherever they are. ' +
        'Its rounded strokes speak of craft, care and the north wind that dries the beans.',
    )
  await page.getByLabel('Imagotype name', { exact: true }).fill('Compass bean')
  await page.getByLabel('Imagotype role', { exact: true }).fill('The main mark for signs, packaging and the web')
  await page.getByLabel('Version 1 name', { exact: true }).fill('Horizontal')
  await page.getByLabel('Version 1 use for', { exact: true }).fill('web headers and long stationery')

  await open(/^3\. Usage/)
  for (const kind of ['Correct use', 'Incorrect use']) {
    for (let i = 1; i <= 4; i++) {
      const head = sections.getByRole('button', { name: `${kind} example ${i}`, exact: true })
      if ((await head.getAttribute('aria-expanded')) === 'false') await head.click()
      await page
        .getByLabel(`${kind} example ${i} description`, { exact: true })
        .fill(kind === 'Correct use' ? `Keep the clear space around the logo on light backgrounds ${i}` : `Do not stretch, rotate or recolor the logo ${i}`)
    }
  }

  await open(/^4\. Colors/)
  const colors = [
    ['Espresso', '#3E2723'],
    ['Crema', '#F3E5AB'],
    ['North Blue', '#1E88E5'],
    ['Ember Red', '#E53935'],
  ]
  for (const [i, [name, hex]] of colors.entries()) {
    if (i > 0) await sections.getByRole('button', { name: 'Add color' }).click()
    const head = sections.getByRole('button', { name: `Color ${i + 1}`, exact: true })
    if ((await head.getAttribute('aria-expanded')) === 'false') await head.click()
    await page.getByLabel(`Color ${i + 1} name`, { exact: true }).fill(name)
    await page.getByLabel(`Color ${i + 1} HEX`, { exact: true }).fill(hex)
    await page.getByLabel(`Color ${i + 1} HEX`, { exact: true }).press('Enter')
  }

  await open(/^5\. Typography/)
  for (const [field, font] of [
    ['Primary font', 'Montserrat'],
    ['Secondary font', 'Lato'],
  ]) {
    const input = page.getByRole('combobox', { name: field, exact: true })
    await input.fill(font)
    await input.press('Enter')
  }
  await page.evaluate(() => document.fonts.ready)
}

// Every text of every page, inside the given element: its size as a share of its page's width
// and its number of lines. The page's own width (clientWidth) is the one its cqw are measured on.
async function measure(page: Page, scope: string): Promise<Pages> {
  await page.evaluate(() => document.fonts.ready)
  return page.evaluate((scope) => {
    const result: Record<string, { text: string; share: number; lines: number }[]> = {}
    for (const article of document.querySelectorAll<HTMLElement>(`${scope} article.manual-page`)) {
      const width = article.clientWidth
      // Drawn size ÷ laid-out size: Overview's zoom (0.5) and the full screen view's scale both count
      const scale = article.getBoundingClientRect().width / article.offsetWidth
      const texts = [...article.querySelectorAll<HTMLElement>('*')].filter(
        (element) => !element.closest('svg') && [...element.childNodes].some((node) => node.nodeType === 3 && node.textContent?.trim()),
      )
      result[article.getAttribute('aria-label') ?? '?'] = texts.map((element) => {
        const style = getComputedStyle(element)
        const fontSize = parseFloat(style.fontSize)
        const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.2
        return {
          text: (element.textContent ?? '').trim().slice(0, 40),
          share: fontSize / width,
          lines: Math.max(1, Math.round(element.getBoundingClientRect().height / (lineHeight * scale))),
        }
      })
    }
    return result
  }, scope)
}

async function choose(page: Page, group: string, name: string) {
  // The radio itself sits under its label's text (a segmented control), so the click is forced;
  // the app applies it inside a view transition (ADR 0006), so it is checked a moment later
  const radio = page.getByRole('group', { name: group }).getByRole('radio', { name, exact: true })
  if (!(await radio.isChecked())) await radio.click({ force: true })
  await expect(radio).toBeChecked()
  await page.waitForTimeout(700) // the view transition (ADR 0006)
}

async function measureView(page: Page, view: (typeof VIEWS)[number] | 'Grid'): Promise<Pages> {
  if (view !== 'Full screen') {
    await choose(page, 'Preview view', view)
    return measure(page, '.manual-preview')
  }
  await choose(page, 'Preview view', 'Grid')
  await page.getByRole('button', { name: /Full screen/ }).click()
  await page.getByRole('dialog', { name: 'Full screen view' }).waitFor()
  await page.waitForTimeout(700)
  const pages = await measure(page, '.fullscreen-page')
  await page.getByRole('button', { name: 'Exit full screen' }).click({ force: true }) // it fades while idle
  await page.getByRole('dialog', { name: 'Full screen view' }).waitFor({ state: 'detached' })
  return pages
}

// Every difference with Grid, as readable lines, so a failure says which text of which page moved
function differences(grid: Pages, other: Pages, view: string) {
  const found: string[] = []
  for (const [name, texts] of Object.entries(grid)) {
    const theirs = other[name]
    if (!theirs || theirs.length !== texts.length) {
      found.push(`${name} · ${view}: different texts`)
      continue
    }
    texts.forEach((text, i) => {
      const share = Math.abs(theirs[i].share / text.share - 1)
      if (share > SHARE_TOLERANCE) found.push(`${name} · ${view}: "${text.text}" is ${(share * 100).toFixed(0)}% off in size`)
      if (theirs[i].lines !== text.lines) found.push(`${name} · ${view}: "${text.text}" takes ${theirs[i].lines} lines, not ${text.lines}`)
    })
  }
  return found
}

// One line per template, page and view: how many texts are off, and the first one
function summary(found: string[]) {
  const groups = new Map<string, string[]>()
  for (const line of found) {
    const [where, what] = line.split(': ')
    groups.set(where, [...(groups.get(where) ?? []), what])
  }
  return [...groups].map(([where, whats]) => `${where}: ${whats.length} × (${whats[0]})`).join('\n')
}

test.describe('Every page the same in every view', () => {
  for (const orientation of ORIENTATIONS) {
    test(`in ${orientation}, in the 3 templates`, async ({ page }) => {
      await page.goto('/brand-manual')
      await fillManual(page)
      await choose(page, 'Page orientation', orientation)

      const found: string[] = []
      for (const template of TEMPLATES) {
        await choose(page, 'Template', template)
        const grid = await measureView(page, 'Grid')
        expect(Object.keys(grid)).toHaveLength(10)
        for (const view of VIEWS) found.push(...differences(grid, await measureView(page, view), view).map((line) => `${template} · ${line}`))
      }
      expect(found.length, summary(found)).toBe(0)
    })
  }
})
