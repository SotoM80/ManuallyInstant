import { readFileSync } from 'fs';
import { join } from 'path';
import { DEFAULT_FOOTER, FOOTER_TEXT_MAX, pageFooter, pageNumber, setFooter, skinFooter } from '../src/skins/footer';
import { NO_SKIN } from '../src/skins/presets';
import { MANUAL_PAGES } from '../src/data/manualSections';

// Spec: specs/footer.md (ADR 0031)
describe('Footer – settings', () => {
  it('is not shown on an untouched skin, with page numbers ready and no text (scenario 1)', () => {
    expect(NO_SKIN.footer).toBeUndefined();
    expect(skinFooter(NO_SKIN)).toEqual({ shown: false, numbers: true, text: '' });
    expect(DEFAULT_FOOTER).toEqual(skinFooter(NO_SKIN));
    expect(MANUAL_PAGES.every((page) => pageFooter(NO_SKIN, page) === null)).toBe(true);
  });

  it('numbers the pages in the natural order, the Cover being 1 (scenarios 2, 3)', () => {
    expect(pageNumber('Cover')).toBe(1);
    expect(pageNumber('Brand concept')).toBe(2);
    expect(pageNumber('Color palette')).toBe(8);
    expect(pageNumber('Mockups')).toBe(10);
  });

  it('gives every inner page its number, and the Cover none', () => {
    const skin = setFooter(NO_SKIN, { shown: true });
    expect(pageFooter(skin, 'Cover')).toBeNull();
    expect(pageFooter(skin, 'Brand concept')).toEqual({ number: 2, text: '' });
    expect(pageFooter(skin, 'Mockups')).toEqual({ number: 10, text: '' });
  });

  it('shows the text alone, the number alone, both, or nothing', () => {
    const shown = setFooter(NO_SKIN, { shown: true, text: '  Northwind Coffee  ' });
    expect(pageFooter(shown, 'Anatomy')).toEqual({ number: 3, text: 'Northwind Coffee' });
    expect(pageFooter(setFooter(shown, { numbers: false }), 'Anatomy')).toEqual({ number: null, text: 'Northwind Coffee' });
    expect(pageFooter(setFooter(shown, { numbers: false, text: '   ' }), 'Anatomy')).toBeNull();
  });

  it('keeps the numbers and the text while it is hidden (scenario 2b)', () => {
    const skin = setFooter(NO_SKIN, { shown: true, numbers: false, text: 'Northwind Coffee' });
    const hidden = setFooter(skin, { shown: false });
    expect(pageFooter(hidden, 'Anatomy')).toBeNull();
    expect(skinFooter(hidden)).toEqual({ shown: false, numbers: false, text: 'Northwind Coffee' });
    expect(pageFooter(setFooter(hidden, { shown: true }), 'Anatomy')).toEqual({ number: null, text: 'Northwind Coffee' });
  });

  it('keeps the text to 80 characters', () => {
    expect(FOOTER_TEXT_MAX).toBe(80);
    expect(skinFooter(setFooter(NO_SKIN, { text: 'x'.repeat(100) })).text).toHaveLength(80);
  });
});

describe('Footer – the rules', () => {
  const shared = readFileSync(join(__dirname, '../src/templates/shared.css'), 'utf8');
  const template2 = readFileSync(join(__dirname, '../src/templates/template2/template2.css'), 'utf8');
  const template3 = readFileSync(join(__dirname, '../src/templates/template3/template3.css'), 'utf8');

  function rule(css: string, selector: string) {
    const start = css.indexOf(`\n${selector} {`);
    expect(start).toBeGreaterThan(-1);
    return css.slice(start, css.indexOf('}', start));
  }

  it('sits in the bottom margin, measured on the page, in the Secondary font', () => {
    const footer = rule(shared, '.page-footer');
    for (const line of ['bottom: 3.5cqw', 'left: 8cqw', 'right: 8cqw', 'font-size: 1.3cqw', 'font-family: var(--font-text, sans-serif)', 'line-height: 1.4;']) {
      expect(footer).toContain(line);
    }
    expect(rule(shared, '.page-footer-text')).toContain('text-overflow: ellipsis');
  });

  it('is placed by each template (scenario 6)', () => {
    expect(rule(shared, '.page-footer')).toContain('justify-items: center');
    expect(rule(template2, ".manual-preview[data-template='template2'] .page-footer")).toContain('display: flex');
    expect(rule(template2, ".manual-preview[data-template='template2'] .page-footer-number")).toContain('margin-left: auto');
    expect(rule(template3, ".manual-preview[data-template='template3'] .page-footer")).toContain('width: 25.2cqw');
  });
});
