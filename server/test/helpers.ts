import { existsSync } from 'node:fs'
import sharp from 'sharp'
import { createApp } from '../src/app.ts'
import { readConfig } from '../src/config.ts'
import { loadProfile } from '../src/profile.ts'

// FOGRA39 when there is one (CMYK_TEST_PROFILE, or the one Adobe's apps install), so the values
// can be checked against ColorSync and Illustrator; otherwise any CMYK output profile on a Mac
const ADOBE_FOGRA39 = '/Library/Application Support/Adobe/Color/Profiles/Recommended/CoatedFOGRA39.icc'
const MAC_GENERIC = '/System/Library/ColorSync/Profiles/Generic CMYK Profile.icc'

export const fogra39 = process.env.CMYK_TEST_PROFILE ?? (existsSync(ADOBE_FOGRA39) ? ADOBE_FOGRA39 : undefined)
export const anyProfile = fogra39 ?? (existsSync(MAC_GENERIC) ? MAC_GENERIC : undefined)
export const noProfile = anyProfile ? false : 'No CMYK profile found: set CMYK_TEST_PROFILE'

export function testConfig(env: Record<string, string> = {}) {
  return readConfig({ CMYK_PROFILE_PATH: anyProfile, ...env }, process.cwd())
}

// The app with its log kept in a list instead of printed
export async function testApp(env: Record<string, string> = {}) {
  const config = testConfig(env)
  const profile = await loadProfile(config.profile)
  const lines: string[] = []
  return { app: createApp(config, profile, { log: (line) => lines.push(line) }), lines, profile }
}

// A PNG of one color, with an optional transparent right half
export function png(width: number, height: number, color = '#ffffff', transparentRight = false) {
  const base = sharp({ create: { width, height, channels: 4, background: transparentRight ? { r: 0, g: 0, b: 0, alpha: 0 } : color } })
  const half = Math.ceil(width / 2)
  const image = transparentRight
    ? base.composite([{ input: { create: { width: half, height, channels: 4, background: color } }, left: 0, top: 0 }])
    : base
  return image.png().toBuffer()
}
