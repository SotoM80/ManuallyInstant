import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { SOCIAL_LINKS, STUDIO } from '../../data/landing'
import { SectionLabel } from './SectionLabel'
import { buildMailto, openMailto, validateContact } from '../../utils/mailto'
import type { ContactMessage } from '../../utils/mailto'

const FIELDS = [
  { name: 'name', label: 'Name', type: 'text', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'message', label: 'Message', type: 'textarea', autoComplete: 'off' },
] as const

const EMPTY: ContactMessage = { name: '', email: '', message: '' }

// No backend (ADR 0002): Send opens the user's email app with the message already written.
export function Contact() {
  const formRef = useRef<HTMLFormElement>(null)
  const [values, setValues] = useState<ContactMessage>(EMPTY)
  const [errors, setErrors] = useState<Record<keyof ContactMessage, string>>({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const found = validateContact(values)
    setErrors(found)
    const firstInvalid = FIELDS.find((field) => found[field.name])
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid.name}"]`)?.focus()
      setSent(false)
      return
    }
    openMailto(buildMailto(STUDIO.email, values))
    setSent(true)
  }

  return (
    <section id="contact" className="landing-section landing-contact" aria-label="Contact">
      <SectionLabel number={5}>Contact</SectionLabel>
      <div className="landing-contact-grid">
        <div className="landing-contact-links reveal">
          <p className="landing-section-title">Let's talk</p>
          <a className="landing-contact-email" href={`mailto:${STUDIO.email}`}>
            {STUDIO.email}
          </a>
          <ul>
            {SOCIAL_LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.url} target="_blank" rel="noreferrer">
                  {link.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>

        <form ref={formRef} className="landing-form reveal" noValidate onSubmit={handleSubmit}>
          {FIELDS.map((field) => {
            const id = `contact-${field.name}`
            const error = errors[field.name]
            const props = {
              id,
              name: field.name,
              autoComplete: field.autoComplete,
              value: values[field.name],
              'aria-invalid': error ? true : undefined,
              'aria-describedby': error ? `${id}-error` : undefined,
              onChange: (event: { target: { value: string } }) =>
                setValues((current) => ({ ...current, [field.name]: event.target.value })),
            }
            return (
              <div key={field.name} className="landing-field">
                <label htmlFor={id}>{field.label}</label>
                {field.type === 'textarea' ? <textarea rows={4} {...props} /> : <input type={field.type} {...props} />}
                {error && (
                  <span id={`${id}-error`} className="landing-field-error">
                    {error}
                  </span>
                )}
              </div>
            )
          })}
          <button type="submit" className="landing-button landing-button-solid">
            Send
          </button>
          <p role="status" className="landing-form-status">
            {sent && `Your email app should open now. If it doesn't, write to ${STUDIO.email}.`}
          </p>
        </form>
      </div>
    </section>
  )
}
