import type { CSSProperties } from 'react'
import { PhotoMockup } from './PhotoMockup'
import { useMockupCatalog } from '../../mockups/catalog'
import { extraPageLayout, extraPagePhotos, mockupLogo, settingsFor } from '../../mockups/mockups'
import type { Mockups } from '../../mockups/types'
import type { CoverData, LogoData } from '../../types'

type ExtraMockupsPageProps = {
  index: number // 1 → "Mockups 2", the first extra page
  mockups: Mockups
  logo: LogoData | null
  cover: CoverData | null
}

// An extra mockup page (specs/mockups.md, More pages, ADR 0036): photos that did not fit on the
// Mockups page, in a grid of Columns × Rows (1 × 1 for a photo on a page of its own) inside the
// chosen margin, with no header or captions.
// The same in every template.
export function ExtraMockupsPage({ index, mockups, logo, cover }: ExtraMockupsPageProps) {
  const catalog = useMockupCatalog()
  const { cols, rows, margin } = extraPageLayout(mockups, index)
  const photos = extraPagePhotos(mockups, index)
    .map((id) => catalog.find((item) => item.id === id))
    .filter((item) => item?.kind === 'photo')
  const style = { '--extra-cols': cols, '--extra-rows': rows, '--extra-margin': margin } as CSSProperties
  return (
    <ul className="extra-mockups-layout" style={style}>
      {photos.map((template) => {
        const settings = settingsFor(mockups, template)
        const shown = mockupLogo(logo, cover?.logo ?? null, settings.version)
        return (
          <li
            key={template.id}
            className="extra-mockup"
            style={{ '--photo-ratio': template.size[0] / (template.size[1] || 1) } as CSSProperties}
          >
            <PhotoMockup template={template} settings={settings} logo={shown} placeholder={settings.version !== 'none'} />
          </li>
        )
      })}
    </ul>
  )
}
