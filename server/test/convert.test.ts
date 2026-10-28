import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { inflateSync } from 'node:zlib'
import { BadInput, colorsToCmyk, pageToCmyk } from '../src/convert.ts'
import { loadProfile, ProfileError } from '../src/profile.ts'
import { anyProfile, fogra39, noProfile, png } from './helpers.ts'

const settings = (path: string, blackPointCompensation = true) => ({ path, id: 'TEST', name: 'Test', blackPointCompensation })
const values = (cmyk: { c: number; m: number; y: number; k: number }) => [cmyk.c, cmyk.m, cmyk.y, cmyk.k]

// Every value within `tolerance` of the reference (specs/cmykserver.md, Scenarios 10 and 11)
function near(actual: number[], expected: number[], tolerance: number) {
  actual.forEach((value, i) => assert.ok(Math.abs(value - expected[i]) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`))
}

describe('loadProfile', () => {
  it('does not start without the profile file', async () => {
    await assert.rejects(loadProfile(settings('/nowhere/profile.icc')), ProfileError)
  })

  it('does not start with a profile that is not a CMYK output profile', { skip: process.platform !== 'darwin' }, async () => {
    await assert.rejects(loadProfile(settings('/System/Library/ColorSync/Profiles/sRGB Profile.icc')), /not a CMYK output profile/)
  })
})

describe('colorsToCmyk', { skip: noProfile }, () => {
  it('gives no ink for white and rich black for black, in the order asked', async () => {
    const profile = await loadProfile(settings(anyProfile!))
    const [white, black, blue] = colorsToCmyk(['#FFFFFF', '#000000', '#1E88E5'], profile)
    assert.deepEqual(values(white), [0, 0, 0, 0])
    assert.ok(black.k >= 85 && black.c > 0 && black.m > 0 && black.y > 0, `black is ${values(black)}`)
    assert.ok(blue.c > blue.m && blue.y < 10, `blue is ${values(blue)}`) // so the order is kept
    for (const value of [white, black, blue].flatMap(values)) assert.ok(Number.isInteger(value) && value >= 0 && value <= 100)
  })

  it('matches ColorSync with Relative Colorimetric (Scenario 10)', { skip: !fogra39 && 'No FOGRA39 profile' }, async () => {
    const profile = await loadProfile(settings(fogra39!, false))
    // Measured with macOS ColorSync (CoreGraphics), Coated FOGRA39, Relative Colorimetric, on 2026-10-28
    const colorSync = { '#1E88E5': [79, 43, 0, 0], '#E53935': [2, 90, 84, 0], '#FFD600': [1, 14, 95, 0], '#00A86B': [81, 0, 74, 0], '#000000': [91, 79, 62, 98] }
    const cmyk = colorsToCmyk(Object.keys(colorSync), profile)
    Object.values(colorSync).forEach((expected, i) => near(values(cmyk[i]), expected, 1))
  })

  it('matches Illustrator with black point compensation (Scenario 11)', { skip: !fogra39 && 'No FOGRA39 profile' }, async () => {
    const profile = await loadProfile(settings(fogra39!))
    // Read in Illustrator by the studio: Europe Prepress 3 with sRGB, on 2026-10-28
    const illustrator = { '#1E88E5': [77, 42, 0, 0], '#E53935': [1, 88, 78, 0], '#00A86B': [79, 0, 73, 0] }
    const cmyk = colorsToCmyk(Object.keys(illustrator), profile)
    Object.values(illustrator).forEach((expected, i) => near(values(cmyk[i]), expected, 2))
  })
})

describe('pageToCmyk', { skip: noProfile }, () => {
  it('keeps the size, gives 4 bytes per pixel, and turns transparency into paper (Scenario 5)', async () => {
    const profile = await loadProfile(settings(anyProfile!))
    const page = await pageToCmyk(await png(20, 10, '#ffffff', true), profile, 25_000_000)
    assert.equal(page.width, 20)
    assert.equal(page.height, 10)
    const pixels = inflateSync(page.deflated)
    assert.equal(pixels.length, 20 * 10 * 4)
    assert.ok(pixels.every((ink) => ink === 0))
  })

  it('gives the same CMYK for a page as for its color', async () => {
    const profile = await loadProfile(settings(anyProfile!))
    const pixels = inflateSync((await pageToCmyk(await png(2, 2, '#1E88E5'), profile, 100)).deflated)
    const [blue] = colorsToCmyk(['#1E88E5'], profile)
    assert.deepEqual([...pixels.subarray(0, 4)].map((value) => Math.round((value / 255) * 100)), values(blue))
  })

  it('refuses what is not a PNG, and a page with too many pixels', async () => {
    const profile = await loadProfile(settings(anyProfile!))
    await assert.rejects(pageToCmyk(Buffer.from('not a picture'), profile, 100), (error) => error instanceof BadInput && error.code === 'not_an_image')
    const jpeg = await (await import('sharp')).default({ create: { width: 2, height: 2, channels: 3, background: '#fff' } }).jpeg().toBuffer()
    await assert.rejects(pageToCmyk(jpeg, profile, 100), (error) => error instanceof BadInput && error.code === 'not_an_image')
    await assert.rejects(pageToCmyk(await png(20, 10), profile, 199), (error) => error instanceof BadInput && error.code === 'too_many_pixels')
  })
})
