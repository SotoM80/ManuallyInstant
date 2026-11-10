import { readFileSync } from 'fs';
import { join } from 'path';
import { fireEvent, screen, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { toFontFamilyCss } from '../src/data/fontOptions';
import { googleFontHref } from '../src/utils/googleFonts';

// Spec: specs/everyview.md (ADRs 0028 and 0029). jsdom cannot lay text out: the browser test
// (npm run test:e2e) measures the pages; these check the fonts and the rules as text.
jest.setTimeout(20000);

const INNER_PAGES = ['Brand concept', 'Anatomy', 'Logo versions', 'Clear space', 'Correct use', 'Incorrect use', 'Color palette', 'Typography', 'Mockups'];

function page(name: string) {
  return within(screen.getByRole('region', { name: 'Manual preview' })).getByRole('article', { name });
}

function pickFont(name: 'Primary font' | 'Secondary font', family: string) {
  const form = within(screen.getByRole('form', { name: 'Typography' }));
  fireEvent.change(form.getByRole('combobox', { name }), { target: { value: family } });
  fireEvent.click(form.getByRole('option', { name: family }));
}

describe('Every view – the brand fonts', () => {
  afterEach(() => {
    document.head.querySelectorAll('link[href*="fonts.googleapis.com"]').forEach((link) => link.remove());
  });

  // Scenario 4
  it('sets every page in the default brand fonts, loaded from the start', () => {
    renderApp('/brand-manual');

    for (const name of INNER_PAGES) {
      expect(page(name).style.getPropertyValue('--font-titles')).toBe(toFontFamilyCss('Montserrat'));
      expect(page(name).style.getPropertyValue('--font-text')).toBe(toFontFamilyCss('Open Sans'));
    }
    for (const family of ['Montserrat', 'Open Sans']) {
      expect(document.head.querySelector(`link[href="${googleFontHref(family, 'regular')}"]`)).not.toBeNull();
    }
  });

  // Scenario 5
  it('follows the Typography section at once, and leaves the Cover in the title\'s family', () => {
    renderApp('/brand-manual');
    fireEvent.click(screen.getByRole('button', { name: /^5\. Typography/ }));

    pickFont('Primary font', 'Playfair Display');
    pickFont('Secondary font', 'Lato');

    for (const name of INNER_PAGES) {
      expect(page(name).style.getPropertyValue('--font-titles')).toBe(toFontFamilyCss('Playfair Display'));
      expect(page(name).style.getPropertyValue('--font-text')).toBe(toFontFamilyCss('Lato'));
    }
    expect(page('Cover').querySelector<HTMLElement>('.cover-layout')!.style.fontFamily).toContain('Roboto');
  });
});

describe('Every view – the rules', () => {
  const shared = readFileSync(join(__dirname, '../src/templates/shared.css'), 'utf8');
  const preview = readFileSync(join(__dirname, '../src/css/ManualPreview.css'), 'utf8');

  function rule(css: string, selector: string) {
    const start = css.indexOf(`\n${selector} {`);
    expect(start).toBeGreaterThan(-1);
    return css.slice(start, css.indexOf('}', start));
  }

  it('has no rule for one view only: Pages is Grid, only bigger', () => {
    expect(shared).not.toMatch(/data-view=/);
  });

  it('sets the text in the Secondary font and the titles in the Primary one', () => {
    expect(rule(preview, '.manual-page-content')).toContain('font-family: var(--font-text, sans-serif)');
    expect(rule(shared, '.logo-page-brand,\n.logo-page-heading,\n.logo-block-title,\n.palette-heading,\n.type-heading')).toContain(
      'font-family: var(--font-titles, sans-serif)',
    );
  });

  it('measures the sizes on the page, with today\'s Grid look (px ÷ 4.6)', () => {
    expect(rule(shared, '.palette-name')).toContain('font-size: 1.75cqw');
    expect(rule(shared, '.logo-text')).toContain('font-size: 1.3cqw');
    expect(rule(shared, '.usage-mark')).toContain('width: 2.6cqw');
    expect(rule(shared, '.type-sample')).toContain('font-size: 6.5cqw');
  });

  // Scenario 6
  it('makes the "Aa" sample smaller on every landscape page, in every view', () => {
    expect(rule(shared, ".manual-page[data-orientation='landscape'] .type-sample")).toContain('font-size: 4.8cqw');
  });
});
