import cors from 'cors'
import express from 'express'
import type { ErrorRequestHandler, Request, Response } from 'express'
import type { Config } from './config.ts'
import { BadInput, colorsToCmyk, pageToCmyk } from './convert.ts'
import { createLimit } from './limit.ts'
import type { Profile } from './profile.ts'

const HEX = /^#[0-9a-f]{6}$/i

// Every error is { error, message } (specs/cmykserver.md)
function fail(res: Response, status: number, error: string, message: string) {
  res.status(status).json({ error, message })
}

// The media type without its parameters, even when the body is empty
function mediaType(req: Request) {
  return req.headers['content-type']?.split(';')[0].trim().toLowerCase()
}

type Options = { log?: (line: string) => void }

export function createApp(config: Config, profile: Profile, { log = console.log }: Options = {}) {
  const app = express()
  const limit = createLimit(config.maxConcurrent)
  const profileInfo = { id: profile.id, name: profile.name }
  app.disable('x-powered-by')

  // One line per request, never its body: pages and colors belong to the studio's clients
  app.use((req, res, next) => {
    const start = performance.now()
    res.on('finish', () => {
      const bytes = req.headers['content-length'] ?? '0'
      log(`${req.method} ${req.path} ${res.statusCode} ${Math.round(performance.now() - start)} ms ${bytes} B`)
    })
    next()
  })

  // Sites not on the list get no CORS headers, so a browser on them cannot read any answer
  app.use(
    cors({
      origin: (origin, done) => done(null, origin !== undefined && config.corsOrigins.includes(origin)),
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type'],
      exposedHeaders: ['X-Cmyk-Width', 'X-Cmyk-Height', 'X-Cmyk-Profile-Id'],
    }),
  )

  app.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  app.get('/v1/health', (_req, res) => {
    res.json({
      ok: true,
      api: 1,
      profile: profileInfo,
      conversion: { intent: 'relative', blackPointCompensation: profile.blackPointCompensation },
      limits: { maxPageBytes: config.maxPageBytes, maxPagePixels: config.maxPagePixels, maxColors: config.maxColors },
    })
  })

  app.post(
    '/v1/cmyk/colors',
    (req, res, next) => {
      if (mediaType(req) !== 'application/json') return fail(res, 415, 'unsupported_type', 'Send the colors as application/json.')
      next()
    },
    express.json({ limit: '8kb' }),
    (req, res) => {
      const colors: unknown = req.body?.colors
      const valid =
        Array.isArray(colors) &&
        colors.length >= 1 &&
        colors.length <= config.maxColors &&
        colors.every((color) => typeof color === 'string' && HEX.test(color))
      if (!valid) {
        return fail(res, 400, 'invalid_colors', `Send 1 to ${config.maxColors} colors as #RRGGBB.`)
      }
      const hexes = (colors as string[]).map((color) => color.toUpperCase())
      const cmyk = colorsToCmyk(hexes, profile)
      res.json({ profile: profileInfo, colors: hexes.map((hex, i) => ({ hex, cmyk: cmyk[i] })) })
    },
  )

  app.post(
    '/v1/cmyk/page',
    (req, res, next) => {
      if (mediaType(req) !== 'image/png') return fail(res, 415, 'unsupported_type', 'Send the page as image/png.')
      next()
    },
    express.raw({ type: () => true, limit: config.maxPageBytes }),
    async (req, res) => {
      const png: unknown = req.body
      if (!Buffer.isBuffer(png) || png.length === 0) return fail(res, 422, 'not_an_image', 'The page is not a PNG.')
      const release = limit.take()
      if (!release) {
        res.set('Retry-After', '2')
        return fail(res, 503, 'busy', 'Other pages are being converted. Try again in a moment.')
      }
      try {
        const page = await pageToCmyk(png, profile, config.maxPagePixels)
        res.set({
          'X-Cmyk-Width': String(page.width),
          'X-Cmyk-Height': String(page.height),
          'X-Cmyk-Profile-Id': profile.id,
        })
        res.type('application/octet-stream').send(page.deflated)
      } catch (error) {
        if (error instanceof BadInput && error.code === 'too_many_pixels') {
          fail(res, 422, 'too_many_pixels', `The page is larger than ${config.maxPagePixels} pixels.`)
        } else if (error instanceof BadInput) {
          fail(res, 422, 'not_an_image', 'The page is not a PNG.')
        } else {
          fail(res, 500, 'conversion_failed', 'The page could not be converted to CMYK.')
        }
      } finally {
        release()
      }
    },
  )

  app.use((_req, res) => fail(res, 404, 'not_found', 'There is no such route.'))

  // Errors from the body parsers (too large, broken JSON) and anything unexpected. Express only
  // treats a handler with four parameters as an error handler, so `_next` stays.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onError: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error?.type === 'entity.too.large') {
      return fail(res, 413, 'too_large', `The page is larger than ${config.maxPageBytes / 1024 / 1024} MB.`)
    }
    if (error?.type === 'entity.parse.failed') {
      return fail(res, 400, 'invalid_colors', `Send 1 to ${config.maxColors} colors as #RRGGBB.`)
    }
    fail(res, 500, 'conversion_failed', 'Something went wrong.')
  }
  app.use(onError)

  return app
}
