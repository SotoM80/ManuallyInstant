import { dirname } from 'node:path'
import { createApp } from './app.ts'
import { ConfigError, readConfig } from './config.ts'
import { loadProfile, ProfileError } from './profile.ts'

// Starts the CMYK server (specs/cmykserver.md). A wrong setting or profile stops it with the reason.
try {
  const config = readConfig(process.env, dirname(import.meta.dirname))
  const profile = await loadProfile(config.profile)
  createApp(config, profile).listen(config.port, () => {
    console.log(`CMYK server on http://localhost:${config.port}`)
    console.log(`Profile: ${profile.name} (${profile.description}), Relative Colorimetric, black point compensation ${profile.blackPointCompensation ? 'on' : 'off'}`)
    console.log(`Allowed sites: ${config.corsOrigins.join(', ') || 'none'}`)
  })
} catch (error) {
  if (error instanceof ConfigError || error instanceof ProfileError) {
    console.error(`The CMYK server cannot start: ${error.message}`)
    process.exit(1)
  }
  throw error
}
