import { expect, test, type Locator, type Page } from '@playwright/test'

// Spec: specs/typography.md (ADR 0029). In a real browser, where the page's CSS decides which
// font each text inherits: everything in the Primary block, its "Primary · Headings" label
// included, must stay in the Primary font when only the Secondary font changes.

async function pickFont(page: Page, field: 'Primary font' | 'Secondary font', family: string) {
  const form = page.getByRole('form', { name: 'Typography' })
  await form.getByRole('combobox', { name: field }).fill(family)
  await form.getByRole('option', { name: family }).click()
}

// The first family the browser was asked for, without quotes
function fontOf(locator: Locator) {
  return locator.evaluate((el) => getComputedStyle(el).fontFamily.split(',')[0].trim().replace(/['"]/g, ''))
}

test('the Primary block keeps the Primary font when the Secondary font changes', async ({ page }) => {
  await page.goto('/brand-manual')
  const sections = page.getByRole('region', { name: 'Manual sections' })
  await sections.getByRole('button', { name: /^5\. Typography/ }).click()

  await pickFont(page, 'Primary font', 'Playfair Display')
  await pickFont(page, 'Secondary font', 'Inter')

  const typography = page.getByRole('region', { name: 'Manual preview' }).getByRole('article', { name: 'Typography' })
  const [primary, secondary] = [typography.getByRole('listitem').nth(0), typography.getByRole('listitem').nth(1)]
  const title = typography.getByText('Typography', { exact: true })
  const primaryName = primary.getByText('Playfair Display', { exact: true })
  const primaryLabel = primary.getByText('Primary · Headings')
  const secondaryLabel = secondary.getByText('Secondary · Body text')

  await expect(primaryName).toBeVisible()
  const read = async () => ({
    title: await fontOf(title),
    primaryName: await fontOf(primaryName),
    primaryLabel: await fontOf(primaryLabel),
    secondaryLabel: await fontOf(secondaryLabel),
  })

  expect(await read()).toEqual({
    title: 'Playfair Display',
    primaryName: 'Playfair Display',
    primaryLabel: 'Playfair Display',
    secondaryLabel: 'Inter',
  })

  // Only the Secondary changes: nothing in the Primary block may follow it
  await pickFont(page, 'Secondary font', 'Roboto')
  await expect(secondary.getByText('Roboto', { exact: true })).toBeVisible()
  expect(await read()).toEqual({
    title: 'Playfair Display',
    primaryName: 'Playfair Display',
    primaryLabel: 'Playfair Display',
    secondaryLabel: 'Roboto',
  })
})
