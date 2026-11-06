import type { CoverDraft } from '../components/BrandForm'
import type { LogoDraft } from '../components/LogoForm'
import type { UsageDraft } from '../components/UsageForm'
import type { ColorsDraft } from '../components/ColorsForm'
import type { TypographyDraft } from '../components/TypographyForm'

// What each form shows (half-typed values too), kept by App so the forms are filled again when
// the user comes back to the page (see useDraft). A key is missing until its form is touched.
export type Drafts = {
  cover?: CoverDraft
  logo?: LogoDraft
  usage?: UsageDraft
  colors?: ColorsDraft
  typography?: TypographyDraft
}

export type DraftKey = keyof Drafts
