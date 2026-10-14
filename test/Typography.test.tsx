import { screen, fireEvent, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { toFontFamilyCss } from '../src/data/fontOptions';
import { fontPreviewHref, googleFontHref } from '../src/utils/googleFonts';

function getTypographyForm() {
  return screen.getByRole('form', { name: 'Typography' });
}

function getTypographyPage() {
  const preview = screen.getByRole('region', { name: 'Manual preview' });
  return within(preview).getByRole('article', { name: 'Typography' });
}

type FontField = 'Primary font' | 'Secondary font';

function getField(name: FontField) {
  return within(getTypographyForm()).getByRole('combobox', { name });
}

function typeFont(name: FontField, value: string) {
  fireEvent.change(getField(name), { target: { value } });
}

function pickFont(name: FontField, family: string) {
  typeFont(name, family);
  fireEvent.click(within(getTypographyForm()).getByRole('option', { name: family }));
}

function pickFonts(primary = 'Playfair Display', secondary = 'Inter') {
  pickFont('Primary font', primary);
  pickFont('Secondary font', secondary);
}

// Spec: specs/typography.md, Section 2 — Loading the fonts
describe('Typography – loading fonts', () => {
  it('asks for the four variants by default (Cover title) and only regular for brand fonts', () => {
    expect(googleFontHref('Open Sans')).toBe(
      'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap',
    );
    expect(googleFontHref('Bebas Neue', 'regular')).toBe(
      'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
    );
  });

  it('previews every family in one request, with only the letters of their names', () => {
    expect(fontPreviewHref(['Lora', 'Inter'])).toBe(
      'https://fonts.googleapis.com/css2?family=Lora&family=Inter&text=ILaenort&display=swap',
    );
  });

  it('adds the preview stylesheet once when the section is shown', () => {
    renderApp();

    const previews = document.head.querySelectorAll('link[href*="text="]');
    expect(previews).toHaveLength(1);
  });

  it('falls back to a font of the same kind', () => {
    expect(toFontFamilyCss('Playfair Display')).toBe("'Playfair Display', serif");
    expect(toFontFamilyCss('Space Mono')).toBe("'Space Mono', monospace");
    expect(toFontFamilyCss('Bebas Neue')).toBe("'Bebas Neue', sans-serif");
  });
});

// Spec: specs/typography.md, Scenario 1 — Defaults
describe('Typography – defaults', () => {
  it('starts with Montserrat and Open Sans, and a placeholder page', () => {
    renderApp();

    expect(getField('Primary font')).toHaveValue('Montserrat');
    expect(getField('Secondary font')).toHaveValue('Open Sans');
    expect(within(getTypographyPage()).getByText('Your typography')).toBeInTheDocument();
  });
});

// Spec: specs/typography.md, Scenario 2 — Options in Their Own Font
describe('Typography – options', () => {
  it('draws each option in its own font', () => {
    renderApp();

    typeFont('Primary font', 'Play');

    const option = within(getTypographyForm()).getByRole('option', { name: 'Playfair Display' });
    expect(option).toHaveStyle({ fontFamily: "'Playfair Display', serif" });
  });
});

// Spec: specs/typography.md, Scenario 3 — Live Fonts
describe('Typography – live page', () => {
  it('shows both fonts with their usage, name, "Aa" and alphabet', () => {
    renderApp();

    pickFonts('Playfair Display', 'Inter');

    const page = within(getTypographyPage());
    const [primary, secondary] = page.getAllByRole('listitem');
    expect(within(primary).getByText('Primary · Headings')).toBeInTheDocument();
    expect(within(primary).getByText('Playfair Display')).toHaveStyle({
      fontFamily: "'Playfair Display', serif",
    });
    expect(within(primary).getByText('Aa')).toBeInTheDocument();
    expect(within(primary).getByText('ABCDEFGHIJKLMNOPQRSTUVWXYZ')).toBeInTheDocument();
    expect(within(primary).getByText('0123456789')).toBeInTheDocument();
    expect(within(secondary).getByText('Secondary · Body text')).toBeInTheDocument();
    expect(within(secondary).getByText('Inter')).toBeInTheDocument();
  });

  it('downloads both picked fonts in regular only', () => {
    renderApp();

    pickFonts('Bebas Neue', 'Lora');

    expect(document.head.querySelector(`link[href="${googleFontHref('Bebas Neue', 'regular')}"]`)).not.toBeNull();
    expect(document.head.querySelector(`link[href="${googleFontHref('Lora', 'regular')}"]`)).not.toBeNull();
  });

  it('snaps a case-insensitive match to the option', () => {
    renderApp();

    typeFont('Primary font', 'inter');
    fireEvent.blur(getField('Primary font'));

    expect(getField('Primary font')).toHaveValue('Inter');
  });
});

// Spec: specs/typography.md, Scenario 4 — A Font Not in the List + Failure Modes
describe('Typography – errors', () => {
  it('flags a font that is not in the list, and leaves the page as it was', () => {
    renderApp();

    typeFont('Primary font', 'Comic Sans');
    fireEvent.blur(getField('Primary font'));

    expect(within(getTypographyForm()).getByRole('alert')).toHaveTextContent('Select a valid option');
    expect(getField('Primary font')).toHaveStyle({ borderColor: 'red' });
    expect(within(getTypographyPage()).getByText('Your typography')).toBeInTheDocument();
  });

  it('shows no error for an empty field', () => {
    renderApp();

    typeFont('Secondary font', '');
    fireEvent.blur(getField('Secondary font'));

    expect(within(getTypographyForm()).queryByRole('alert')).not.toBeInTheDocument();
  });
});

// Spec: specs/typography.md, Scenario 5 — Fonts Change at Once
describe('Typography – live changes', () => {
  it('changes the page as soon as another font is picked', () => {
    renderApp();
    pickFonts('Playfair Display', 'Inter');

    pickFont('Primary font', 'Lora');

    expect(within(getTypographyPage()).getByText('Lora')).toBeInTheDocument();
    expect(within(getTypographyPage()).queryByText('Playfair Display')).not.toBeInTheDocument();
  });

  it('keeps the last valid font while a name is half typed', () => {
    renderApp();
    pickFonts('Playfair Display', 'Inter');

    typeFont('Primary font', 'Lor');

    expect(within(getTypographyPage()).getByText('Playfair Display')).toBeInTheDocument();
  });
});

// Spec: specs/typography.md, Scenario 6 — Fonts Are Kept Between Pages
describe('Typography – navigation', () => {
  it('keeps the fonts when going Home and back', () => {
    renderApp();
    pickFonts('Playfair Display', 'Inter');

    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    fireEvent.click(screen.getByRole('link', { name: 'Brand Manual' }));

    expect(within(getTypographyPage()).getByText('Playfair Display')).toBeInTheDocument();
  });
});
