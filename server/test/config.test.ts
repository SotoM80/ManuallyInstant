import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ConfigError, readConfig } from '../src/config.ts'

describe('readConfig', () => {
  it('uses the defaults of specs/cmykserver.md', () => {
    const config = readConfig({}, '/srv/server')
    assert.equal(config.port, 8787)
    assert.deepEqual(config.corsOrigins, ['http://localhost:5173'])
    assert.deepEqual(config.profile, {
      path: '/srv/server/profiles/ISOcoated_v2_eci.icc',
      id: 'FOGRA39',
      name: 'ISO Coated v2 (ECI)',
      blackPointCompensation: true,
    })
    assert.equal(config.maxPageBytes, 40 * 1024 * 1024)
    assert.equal(config.maxPagePixels, 25_000_000)
    assert.equal(config.maxConcurrent, 2)
    assert.equal(config.maxColors, 64)
  })

  it('reads a list of sites, without spaces, empty items or a final slash', () => {
    const config = readConfig({ CORS_ORIGINS: ' https://studio.com/ , ,http://localhost:5173' }, '/srv')
    assert.deepEqual(config.corsOrigins, ['https://studio.com', 'http://localhost:5173'])
  })

  it('reads a relative profile path from the server folder, and an absolute one as it is', () => {
    assert.equal(readConfig({ CMYK_PROFILE_PATH: 'profiles/a.icc' }, '/srv/server').profile.path, '/srv/server/profiles/a.icc')
    assert.equal(readConfig({ CMYK_PROFILE_PATH: '/icc/b.icc' }, '/srv/server').profile.path, '/icc/b.icc')
  })

  it('turns black point compensation off', () => {
    assert.equal(readConfig({ CMYK_BLACK_POINT_COMPENSATION: 'false' }, '/srv').profile.blackPointCompensation, false)
  })

  it('refuses settings it cannot use', () => {
    assert.throws(() => readConfig({ PORT: 'eighty' }, '/srv'), ConfigError)
    assert.throws(() => readConfig({ MAX_PAGE_MB: '0' }, '/srv'), ConfigError)
    assert.throws(() => readConfig({ MAX_CONCURRENT: '1.5' }, '/srv'), ConfigError)
    assert.throws(() => readConfig({ CMYK_BLACK_POINT_COMPENSATION: 'yes' }, '/srv'), ConfigError)
  })
})
