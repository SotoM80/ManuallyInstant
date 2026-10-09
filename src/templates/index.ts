import './shared.css'
import './template1/template1.css'
import './template2/template2.css'
import './template3/template3.css'

// Templates the user can pick, in the order shown in the selector.
// Each one has its own folder with the CSS that places the content of every page.
export const TEMPLATES = [
  { id: 'template1', name: 'Template 1' },
  { id: 'template2', name: 'Template 2' },
  { id: 'template3', name: 'Template 3' },
] as const

export type TemplateId = (typeof TEMPLATES)[number]['id']

export const DEFAULT_TEMPLATE: TemplateId = 'template1'
