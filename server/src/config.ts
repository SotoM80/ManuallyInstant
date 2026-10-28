import { resolve } from 'node:path'
import type { ProfileSettings } from './profile.ts'

// The server's settings, from its environment variables (specs/cmykserver.md)
export type Config = {
  port: number
  corsOrigins: string[]
  profile: ProfileSettings
  maxPageBytes: number
  maxPagePixels: number
  maxConcurrent: number
  maxColors: number
}

// A setting the server cannot start with
export class ConfigError extends Error {}

type Env = Record<string, string | undefined>

function whole(env: Env, name: string, fallback: number, min: number) {
  const text = env[name]?.trim()
  if (!text) return fallback
  const value = Number(text)
  if (!Number.isInteger(value) || value < min) throw new ConfigError(`${name} must be a whole number from ${min}, not "${text}"`)
  return value
}

function yesNo(env: Env, name: string, fallback: boolean) {
  const text = env[name]?.trim().toLowerCase()
  if (!text) return fallback
  if (text === 'true') return true
  if (text === 'false') return false
  throw new ConfigError(`${name} must be true or false, not "${text}"`)
}

// `serverDir` is where a relative CMYK_PROFILE_PATH is read from (the server/ folder)
export function readConfig(env: Env, serverDir: string): Config {
  const origins = env.CORS_ORIGINS ?? 'http://localhost:5173'
  return {
    port: whole(env, 'PORT', 8787, 1),
    corsOrigins: origins
      .split(',')
      .map((origin) => origin.trim().replace(/\/+$/, ''))
      .filter(Boolean),
    profile: {
      path: resolve(serverDir, env.CMYK_PROFILE_PATH?.trim() || 'profiles/ISOcoated_v2_eci.icc'),
      id: env.CMYK_PROFILE_ID?.trim() || 'FOGRA39',
      name: env.CMYK_PROFILE_NAME?.trim() || 'ISO Coated v2 (ECI)',
      blackPointCompensation: yesNo(env, 'CMYK_BLACK_POINT_COMPENSATION', true),
    },
    maxPageBytes: whole(env, 'MAX_PAGE_MB', 40, 1) * 1024 * 1024,
    maxPagePixels: whole(env, 'MAX_PAGE_PIXELS', 25_000_000, 1),
    maxConcurrent: whole(env, 'MAX_CONCURRENT', 2, 0),
    maxColors: 64,
  }
}
