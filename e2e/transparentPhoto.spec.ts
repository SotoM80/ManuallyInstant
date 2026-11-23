import { deflateSync, crc32 } from 'node:zlib'
import { expect, test } from '@playwright/test'

// Spec: specs/mockups.md, Scenario 48 (photo mockups, ADR 0014). In a real browser, where the
// mockup is composed in WebGL: the transparent parts of a PNG photo stay transparent, so the page
// shows behind them, instead of turning black.

// A 40 × 30 PNG (RGBA): the left half transparent, the right half opaque red
function halfTransparentPng() {
  const [width, height] = [40, 30]
  const rows = []
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4) // filter byte 0, then RGBA
    for (let x = width / 2; x < width; x++) row.set([255, 0, 0, 255], 1 + x * 4)
    rows.push(row)
  }
  const chunk = (type: string, data: Buffer) => {
    const length = Buffer.alloc(4)
    length.writeUInt32BE(data.length)
    const body = Buffer.concat([Buffer.from(type), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(body))
    return Buffer.concat([length, body, crc])
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header.set([8, 6, 0, 0, 0], 8) // 8 bits, RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

test('a transparent PNG photo keeps its transparency on the mockup', async ({ page }) => {
  await page.goto('/brand-manual')
  const sections = page.getByRole('region', { name: 'Manual sections' })
  await sections.getByRole('button', { name: /^7\. Mockups/ }).click()
  const form = page.getByRole('form', { name: 'Mockups' })

  await form.getByLabel('Upload your own photo').setInputFiles({ name: 'cutout.png', mimeType: 'image/png', buffer: halfTransparentPng() })
  const editor = page.getByRole('dialog', { name: 'Template editor' })
  await editor.getByLabel('Photo: click the product to select it').waitFor()
  await editor.getByRole('button', { name: 'Use now' }).click()
  await expect(editor).toBeHidden()

  const mockup = page.getByRole('region', { name: 'Manual preview' }).getByRole('img', { name: 'cutout mockup' }).first()
  await expect(mockup).toBeVisible()

  // The opacity (0–255) of the composed image at a share of its width, halfway down
  async function alphaAt(share: number) {
    return mockup.evaluate(async (img: HTMLImageElement, share) => {
      await img.decode()
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const context = canvas.getContext('2d')!
      context.drawImage(img, 0, 0)
      const x = Math.floor(share * canvas.width)
      return context.getImageData(x, Math.floor(canvas.height / 2), 1, 1).data[3]
    }, share)
  }

  expect(await alphaAt(0.1)).toBe(0) // the transparent half: still transparent, not black
  expect(await alphaAt(0.9)).toBe(255) // the red half: still opaque
})
