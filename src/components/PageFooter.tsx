import { pageFooter } from '../skins/footer'
import type { Skin } from '../skins/types'

type PageFooterProps = {
  skin: Skin
  page: string
}

// The footer of one inner page: its number and the Skin's footer text, in the page's bottom
// margin. The template places them (specs/footer.md, ADR 0031); nothing is drawn without one.
export function PageFooter({ skin, page }: PageFooterProps) {
  const footer = pageFooter(skin, page)
  if (!footer) return null
  return (
    <footer className="page-footer" style={{ color: skin.pageText }}>
      {footer.number !== null && <span className="page-footer-number">{footer.number}</span>}
      {footer.text && <span className="page-footer-text">{footer.text}</span>}
    </footer>
  )
}
