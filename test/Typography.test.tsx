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

function clickSaveTypography() {
  fireEvent.click(within(getTypographyForm()).getByRole('button', { name: 'Save' }));
}

function saveFonts(primary = 'Playfair Display', secondary = 'Inter') {
  pickFont('Primary font', primary);
  pickFont('Secondary font', secondary);
  clickSaveTypography();
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

// Spec: specs/typography.md, Scenario 3 — Saving the Fonts
describe('Typography – saving', () => {
  it('shows both fonts with their usage, name, "Aa" and alphabet', () => {
    renderApp();

    saveFonts('Playfair Display', 'Inter');

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

  it('downloads both saved fonts in regular only', () => {
    renderApp();

    saveFonts('Bebas Neue', 'Lora');

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
  it('blocks Save for a font that is not in the list', () => {
    renderApp();

    typeFont('Primary font', 'Comic Sans');
    clickSaveTypography();

    expect(within(getTypographyForm()).getByRole('alert')).toHaveTextContent('Select a valid option');
    expect(getField('Primary font')).toHaveStyle({ borderColor: 'red' });
    expect(within(getTypographyPage()).getByText('Your typography')).toBeInTheDocument();
  });

  it('blocks Save for an empty field', () => {
    renderApp();

    typeFont('Secondary font', '');
    clickSaveTypography();

    expect(within(getTypographyForm()).getByRole('alert')).toHaveTextContent('Required field');
  });
});

// Spec: specs/typography.md, Scenario 5 — Fonts Wait for Save
describe('Typography – waits for Save', () => {
  it('does not change the page until Save', () => {
    renderApp();
    saveFonts('Playfair Display', 'Inter');

    pickFont('Primary font', 'Lora');

    expect(within(getTypographyPage()).getByText('Playfair Display')).toBeInTheDocument();
    expect(within(getTypographyPage()).queryByText('Lora')).not.toBeInTheDocument();
  });
});

// Spec: specs/typography.md, Scenario 6 — Fonts Are Kept Between Pages
describe('Typography – navigation', () => {
  it('keeps the saved fonts when going Home and back', () => {
    renderApp();
    saveFonts('Playfair Display', 'Inter');

    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    fireEvent.click(screen.getByRole('link', { name: 'Brand Manual' }));

    expect(within(getTypographyPage()).getByText('Playfair Display')).toBeInTheDocument();
  });
});
