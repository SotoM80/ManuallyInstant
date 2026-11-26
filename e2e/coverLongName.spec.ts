import { expect, test, type Page } from '@playwright/test'

// Spec: specs/cover.md. A "Designed by" with no spaces or break points breaks into lines,
// like the title, instead of leaving the Cover page.

const TEMPLATES = ['Template 1', 'Template 2', 'Template 3'] as const
// No break opportunity at all (a URL can still break after its / and -)
const LONG_NAME = 'AVeryLongStudioNameWithNoSpacesAtAll'.repeat(4)

async function chooseTemplate(page: Page, name: string) {
  // The radio sits under its label's text (a segmented control), so the click is forced; the app
  // applies it inside a view transition (ADR 0006), so it is checked a moment later
  const radio = page.getByRole('group', { name: 'Template' }).getByRole('radio', { name, exact: true })
  if (!(await radio.isChecked())) await radio.click({ force: true })
  await expect(radio).toBeChecked()
  await page.waitForTimeout(700)
}

test('a long Designed by stays inside the Cover, in the 3 templates', async ({ page }) => {
  await page.goto('/brand-manual')
  await page.getByLabel('Designed by', { exact: true }).fill(LONG_NAME)

  for (const template of TEMPLATES) {
    await chooseTemplate(page, template)
    const cover = page.locator('.manual-preview article.manual-page[aria-label="Cover"]')
    const text = cover.locator('.cover-designed-by')
    await expect(text).toContainText(LONG_NAME)

    const pageBox = await cover.boundingBox()
    // Its text, not its box: a grid item's box can be narrower than what spills out of it
    const textRight = await text.evaluate((element) => {
      const range = document.createRange()
      range.selectNodeContents(element)
      return Math.max(...[...range.getClientRects()].map((rect) => rect.right))
    })
    expect(pageBox, template).not.toBeNull()
    expect(textRight, template).toBeLessThanOrEqual(pageBox!.x + pageBox!.width + 0.5)
  }
})
