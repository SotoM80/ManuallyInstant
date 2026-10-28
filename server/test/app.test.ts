import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { inflateSync } from 'node:zlib'
import request from 'supertest'
import { noProfile, png, testApp } from './helpers.ts'

const SITE = 'http://localhost:5173'

describe('CMYK server', { skip: noProfile }, () => {
  it('answers health with the profile, the conversion and the limits (Scenario 1)', async () => {
    const { app } = await testApp({ CMYK_PROFILE_ID: 'FOGRA39', CMYK_PROFILE_NAME: 'ISO Coated v2 (ECI)' })
    const res = await request(app).get('/v1/health').expect(200)
    assert.deepEqual(res.body, {
      ok: true,
      api: 1,
      profile: { id: 'FOGRA39', name: 'ISO Coated v2 (ECI)' },
      conversion: { intent: 'relative', blackPointCompensation: true },
      limits: { maxPageBytes: 41943040, maxPagePixels: 25000000, maxColors: 64 },
    })
    assert.equal(res.headers['cache-control'], 'no-store')
  })

  it('converts colors in order, as upper case HEX (Scenario 3)', async () => {
    const { app } = await testApp()
    const res = await request(app).post('/v1/cmyk/colors').send({ colors: ['#ffffff', '#000000', '#1E88E5'] }).expect(200)
    assert.deepEqual(res.body.colors.map((color: { hex: string }) => color.hex), ['#FFFFFF', '#000000', '#1E88E5'])
    assert.deepEqual(res.body.colors[0].cmyk, { c: 0, m: 0, y: 0, k: 0 })
    assert.ok(res.body.colors[1].cmyk.k >= 85)
  })

  it('refuses bad colors (Scenario 4)', async () => {
    const { app } = await testApp()
    const bodies = [{ colors: [] }, { colors: Array(65).fill('#000000') }, { colors: ['blue'] }, { colors: '#000000' }, {}]
    for (const body of bodies) {
      const res = await request(app).post('/v1/cmyk/colors').send(body).expect(400)
      assert.equal(res.body.error, 'invalid_colors')
    }
    const broken = await request(app).post('/v1/cmyk/colors').set('Content-Type', 'application/json').send('{"colors": [').expect(400)
    assert.equal(broken.body.error, 'invalid_colors')
    const text = await request(app).post('/v1/cmyk/colors').set('Content-Type', 'text/plain').send('#000000').expect(415)
    assert.equal(text.body.error, 'unsupported_type')
  })

  it('converts a page, with its size and profile in the headers (Scenario 5)', async () => {
    const { app } = await testApp({ CMYK_PROFILE_ID: 'FOGRA39' })
    const res = await request(app)
      .post('/v1/cmyk/page')
      .set('Content-Type', 'image/png')
      .send(await png(20, 10, '#ffffff', true))
      .buffer(true)
      .parse((r, done) => {
        const chunks: Buffer[] = []
        r.on('data', (chunk: Buffer) => chunks.push(chunk))
        r.on('end', () => done(null, Buffer.concat(chunks)))
      })
      .expect(200)
    assert.equal(res.headers['content-type'], 'application/octet-stream')
    assert.equal(res.headers['x-cmyk-width'], '20')
    assert.equal(res.headers['x-cmyk-height'], '10')
    assert.equal(res.headers['x-cmyk-profile-id'], 'FOGRA39')
    const pixels = inflateSync(res.body)
    assert.equal(pixels.length, 20 * 10 * 4)
    assert.ok(pixels.every((ink) => ink === 0))
  })

  it('refuses what is not a PNG (Scenario 6)', async () => {
    const { app } = await testApp()
    const text = await request(app).post('/v1/cmyk/page').set('Content-Type', 'text/plain').send('hello').expect(415)
    assert.equal(text.body.error, 'unsupported_type')
    const noise = await request(app).post('/v1/cmyk/page').set('Content-Type', 'image/png').send(Buffer.from('not a png at all')).expect(422)
    assert.equal(noise.body.error, 'not_an_image')
    const empty = await request(app).post('/v1/cmyk/page').set('Content-Type', 'image/png').send(Buffer.alloc(0)).expect(422)
    assert.equal(empty.body.error, 'not_an_image')
  })

  it('refuses a page that is too large, in bytes or in pixels (Scenario 7)', async () => {
    const { app } = await testApp({ MAX_PAGE_MB: '1', MAX_PAGE_PIXELS: '100' })
    const big = await request(app).post('/v1/cmyk/page').set('Content-Type', 'image/png').send(Buffer.alloc(2 * 1024 * 1024)).expect(413)
    assert.equal(big.body.error, 'too_large')
    const wide = await request(app).post('/v1/cmyk/page').set('Content-Type', 'image/png').send(await png(20, 10)).expect(422)
    assert.equal(wide.body.error, 'too_many_pixels')
  })

  it('answers busy when every slot is in use (Scenario 8)', async () => {
    const { app } = await testApp({ MAX_CONCURRENT: '0' })
    const res = await request(app).post('/v1/cmyk/page').set('Content-Type', 'image/png').send(await png(2, 2)).expect(503)
    assert.equal(res.body.error, 'busy')
    assert.equal(res.headers['retry-after'], '2')
  })

  it('gives CORS headers only to the allowed sites (Scenario 9)', async () => {
    const { app } = await testApp({ CORS_ORIGINS: SITE })
    const allowed = await request(app).get('/v1/health').set('Origin', SITE).expect(200)
    assert.equal(allowed.headers['access-control-allow-origin'], SITE)
    assert.equal(allowed.headers['access-control-expose-headers'], 'X-Cmyk-Width,X-Cmyk-Height,X-Cmyk-Profile-Id')
    const other = await request(app).get('/v1/health').set('Origin', 'https://example.com').expect(200)
    assert.equal(other.headers['access-control-allow-origin'], undefined)
    const preflight = await request(app)
      .options('/v1/cmyk/page')
      .set('Origin', SITE)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type')
      .expect(204)
    assert.equal(preflight.headers['access-control-allow-origin'], SITE)
  })

  it('logs one line per request, never its body', async () => {
    const { app, lines } = await testApp()
    await request(app).post('/v1/cmyk/colors').send({ colors: ['#1E88E5'] }).expect(200)
    assert.equal(lines.length, 1)
    assert.match(lines[0], /^POST \/v1\/cmyk\/colors 200 \d+ ms \d+ B$/)
    assert.ok(!lines[0].includes('1E88E5'))
  })

  it('answers unknown routes with a JSON error', async () => {
    const { app } = await testApp()
    const res = await request(app).get('/v2/anything').expect(404)
    assert.equal(res.body.error, 'not_found')
  })
})
