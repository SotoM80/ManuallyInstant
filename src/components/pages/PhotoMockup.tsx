import { useEffect, useState } from 'react'
import { renderPhotoMockup } from '../../mockups/render/renderPhotoMockup'
import type { MockupSettings, PhotoTemplate } from '../../mockups/types'

type PhotoMockupProps = {
  template: PhotoTemplate
  settings: MockupSettings
  logo: { url: string } | null // null → a dashed box where the logo goes
  width?: number // of the image made, in pixels: enough for the print PDF by default
}

// A photo mockup, composed in WebGL and shown as an image, so the PDF copies it as it is
// (see specs/mockups.md, Photo mockups, and ADR 0014). `data-rendering` tells the PDF export
// to wait for it.
export function PhotoMockup({ template, settings, logo, width = 1500 }: PhotoMockupProps) {
  const [result, setResult] = useState<{ key: string; url: string | null }>({ key: '', url: null })
  const key = JSON.stringify([template.id, template.revision ?? 0, settings, logo?.url ?? null, width])

  useEffect(() => {
    let current = true
    renderPhotoMockup({
      template,
      color: settings.color,
      logoUrl: logo?.url ?? null,
      placement: settings.placement,
      blend: settings.blend,
      width,
    }).then(
      (url) => current && setResult({ key, url }),
      () => current && setResult({ key, url: null }),
    )
    return () => {
      current = false
    }
    // `key` covers the template, the settings, the logo and the width
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const ready = result.key === key
  const area = template.area
  const [photoWidth, photoHeight] = template.size
  return (
    <div className="photo-mockup" data-rendering={ready ? undefined : true} style={{ aspectRatio: `${photoWidth} / ${photoHeight}` }}>
      {!ready && <p className="photo-mockup-note">Preparing…</p>}
      {ready && !result.url && <p className="photo-mockup-note">This mockup could not be drawn</p>}
      {ready && result.url && <img src={result.url} alt={`${template.name} mockup`} />}
      {ready && result.url && !logo && (
        <span
          className="photo-mockup-placeholder"
          aria-hidden="true"
          style={{
            left: `${(area.x / photoWidth) * 100}%`,
            top: `${(area.y / photoHeight) * 100}%`,
            width: `${(area.width / photoWidth) * 100}%`,
            height: `${(area.height / photoHeight) * 100}%`,
          }}
        />
      )}
    </div>
  )
}
