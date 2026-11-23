import { expect, test, type Page } from '@playwright/test'

// Spec: specs/mockups.md, More pages (ADR 0036). In a real browser: an uploaded photo used with
// mockups already ticked lands on "Mockups 2", as large as the chosen margin allows.

// A 40 × 30 PNG, one flat color: enough for the editor and the WebGL composer
const PHOTO = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAACgAAAAeCAIAAADRv8uKAAAAK0lEQVR4nO3NMQ0AAAgDsAlDGBKRhQw4mvRvputExGKxWCwWi8VisVj8N15LdPWbc08/QwAAAABJRU5ErkJggg==',
  'base64',
)

// A photo name with no hyphen or space to break at, as cameras and phones name them
const LONG = 'a_very_long_photo_file_name_for_the_product_poster_final_version_2026'

// Every place the sidebar shows the name stays inside it. The letters themselves are measured,
// not their box: a box can fit while its text runs past it.
async function expectNamesInside(page: Page, name: string) {
  const sidebar = (await page.getByRole('region', { name: 'Manual sections' }).boundingBox())!
  const form = page.getByRole('form', { name: 'Mockups' })
  for (const shown of await form.getByText(name).all()) {
    if (!(await shown.isVisible())) continue
    const right = await shown.evaluate((el) => {
      const range = document.createRange()
      range.selectNodeContents(el)
      return range.getBoundingClientRect().right
    })
    expect(right).toBeLessThanOrEqual(sidebar.x + sidebar.width)
  }
}

test('a photo used with mockups already ticked goes to an extra page, inside its margin', async ({ page }) => {
  await page.goto('/brand-manual')
  const sections = page.getByRole('region', { name: 'Manual sections' })
  await sections.getByRole('button', { name: /^7\. Mockups/ }).click()
  const form = page.getByRole('form', { name: 'Mockups' })

  await form.getByLabel('Upload your own photo').setInputFiles({ name: 'poster.png', mimeType: 'image/png', buffer: PHOTO })
  const editor = page.getByRole('dialog', { name: 'Template editor' })
  await editor.getByLabel('Photo: click the product to select it').waitFor()
  await editor.getByRole('button', { name: 'Use now' }).click()
  await expect(editor).toBeHidden()

  const preview = page.getByRole('region', { name: 'Manual preview' })
  const extra = preview.getByRole('article', { name: 'Mockups 2' })
  const photo = extra.getByRole('img', { name: 'poster mockup' })
  await expect(photo).toBeVisible()
  await expect(preview.getByText('11. Mockups 2')).toBeVisible()

  // The photo stays inside the margin (in % of the page's width) and, kept in its proportions,
  // touches two opposite sides of it: as large as the room allows, in either orientation
  async function fit(margin: number) {
    const pageBox = (await extra.boundingBox())!
    const box = (await photo.boundingBox())!
    const m = (margin / 100) * pageBox.width
    const room = { width: pageBox.width - 2 * m, height: pageBox.height - 2 * m }
    const inside =
      box.x >= pageBox.x + m - 1 &&
      box.y >= pageBox.y + m - 1 &&
      box.x + box.width <= pageBox.x + pageBox.width - m + 1 &&
      box.y + box.height <= pageBox.y + pageBox.height - m + 1
    // 3 px: the page's 1 px border on each side, and rounding
    const fills = Math.abs(box.width - room.width) < 3 || Math.abs(box.height - room.height) < 3
    return inside && fills
  }
  await expect.poll(() => fit(8)).toBe(true)

  // Margin 0 %: edge to edge
  await form.getByLabel('Margin').fill('0')
  await expect.poll(() => fit(0)).toBe(true)

  // Scenario 42: a long name wraps inside the sections column, even with no hyphen to break at
  const long = LONG
  await form.getByLabel('Upload your own photo').setInputFiles({ name: `${long}.png`, mimeType: 'image/png', buffer: PHOTO })
  await editor.getByRole('button', { name: 'Use now' }).click()
  await expect(editor).toBeHidden()
  await expect(form.locator('.mockup-extra-head').getByText(long)).toBeVisible()
  await expectNamesInside(page, long)
})

// Scenario 42, again for a photo on the Mockups page itself: its name in the Products list and in
// the header of its settings wraps too
test('a long photo name wraps inside the sidebar on the Mockups page', async ({ page }) => {
  await page.goto('/brand-manual')
  const sections = page.getByRole('region', { name: 'Manual sections' })
  await sections.getByRole('button', { name: /^7\. Mockups/ }).click()
  const form = page.getByRole('form', { name: 'Mockups' })

  await form.getByLabel('Upload your own photo').setInputFiles({ name: `${LONG}.png`, mimeType: 'image/png', buffer: PHOTO })
  const editor = page.getByRole('dialog', { name: 'Template editor' })
  await editor.getByLabel('Photo: click the product to select it').waitFor()
  await editor.getByRole('button', { name: 'Use now' }).click()
  await expect(editor).toBeHidden()

  await expect(form.locator('.mockup-settings .palette-block-title').getByText(LONG)).toBeVisible()
  await expectNamesInside(page, LONG)
})
