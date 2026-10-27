// The landing's contact form has no backend (ADR 0002): it opens the user's email app
// with the message already written, through a mailto: link.

export type ContactMessage = { name: string; email: string; message: string }

export function buildMailto(to: string, { name, email, message }: ContactMessage) {
  const subject = `New project — ${name.trim()}`
  const body = `${message.trim()}\n\n${name.trim()} · ${email.trim()}`
  // encodeURIComponent, not URLSearchParams: mail apps read "+" literally, not as a space
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

// In its own function so tests can replace it (jsdom cannot navigate to a mailto: link).
export function openMailto(url: string) {
  window.location.href = url
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// '' means valid, as in src/utils/validation.ts.
export function validateContact({ name, email, message }: ContactMessage) {
  return {
    name: name.trim() === '' ? 'Please fill in this field' : '',
    email:
      email.trim() === ''
        ? 'Please fill in this field'
        : EMAIL_PATTERN.test(email.trim())
          ? ''
          : 'Please enter a valid email',
    message: message.trim() === '' ? 'Please fill in this field' : '',
  }
}
