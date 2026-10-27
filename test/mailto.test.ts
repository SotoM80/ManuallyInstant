import { buildMailto, validateContact } from '../src/utils/mailto';

function parse(url: string) {
  const parsed = new URL(url);
  return { to: parsed.pathname, subject: parsed.searchParams.get('subject'), body: parsed.searchParams.get('body') };
}

// Spec: specs/landing.md, Section 2 — Contact form
describe('buildMailto', () => {
  it('writes the subject and the body from the form', () => {
    const url = buildMailto('hi@studio.com', { name: 'Ana', email: 'ana@x.com', message: 'Hello' });

    expect(parse(url)).toEqual({ to: 'hi@studio.com', subject: 'New project — Ana', body: 'Hello\n\nAna · ana@x.com' });
  });

  it('keeps accents, line breaks and symbols unchanged', () => {
    const message = 'Diseño & tipografía\nLínea 2 + 100% ?=#';
    const url = buildMailto('hi@studio.com', { name: 'José', email: 'jose@x.com', message });

    expect(parse(url).subject).toBe('New project — José');
    expect(parse(url).body).toBe(`${message}\n\nJosé · jose@x.com`);
    // A "+" must not be sent as is: mail apps would read it literally, but some decoders as a space
    expect(url).not.toContain('+');
  });

  it('trims spaces around each field', () => {
    const url = buildMailto('hi@studio.com', { name: '  Ana ', email: ' ana@x.com ', message: ' Hello \n' });

    expect(parse(url).body).toBe('Hello\n\nAna · ana@x.com');
  });
});

// Spec: specs/landing.md, Failure Modes — Invalid form
describe('validateContact', () => {
  it('accepts a complete form', () => {
    expect(validateContact({ name: 'Ana', email: 'ana@x.com', message: 'Hi' })).toEqual({ name: '', email: '', message: '' });
  });

  it('asks for empty or blank fields', () => {
    expect(validateContact({ name: ' ', email: '', message: '' })).toEqual({
      name: 'Please fill in this field',
      email: 'Please fill in this field',
      message: 'Please fill in this field',
    });
  });

  it.each(['ana@', 'ana', 'ana@x', '@x.com', 'ana @x.com'])('rejects the email "%s"', (email) => {
    expect(validateContact({ name: 'Ana', email, message: 'Hi' }).email).toBe('Please enter a valid email');
  });
});
