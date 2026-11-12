import { readFileSync } from 'fs';
import { join } from 'path';
import { DEFAULT_SPACING, SPACING_CONTROLS, sectionSpacing, setSectionSpacing, spacingVariables } from '../src/skins/spacing';
import { DEFAULT_LINES, LINE_CONTROLS, lineVariables, setLines, skinLines } from '../src/skins/lines';
import { NO_SKIN } from '../src/skins/presets';

// Specs: specs/linespacing.md and specs/lines.md (ADR 0026)
describe('Line spacing – settings', () => {
  it("starts every section at today's spacing", () => {
    expect(NO_SKIN.spacing).toBeUndefined();
    expect(sectionSpacing(NO_SKIN, 'logo')).toEqual({ title: 100, text: 100 });
    expect(DEFAULT_SPACING).toEqual({ title: 100, text: 100 });
  });

  it('has the ranges of the spec', () => {
    expect(SPACING_CONTROLS.map(({ key, label, min, max, step }) => [key, label, min, max, step])).toEqual([
      ['title', 'Titles', 50, 200, 5],
      ['text', 'Text', 50, 200, 5],
    ]);
  });

  it('changes one value of one section, and keeps the rest and the skin it came from', () => {
    const skin = setSectionSpacing(setSectionSpacing(NO_SKIN, 'logo', { title: 80 }), 'colors', { text: 160 });
    expect(sectionSpacing(skin, 'logo')).toEqual({ title: 80, text: 100 });
    expect(sectionSpacing(skin, 'colors')).toEqual({ title: 100, text: 160 });
    expect(sectionSpacing(skin, 'usage')).toEqual({ title: 100, text: 100 });
    expect(NO_SKIN.spacing).toBeUndefined();
  });

  it("gives each page its section's factors, the Cover included", () => {
    const skin = setSectionSpacing(setSectionSpacing(NO_SKIN, 'logo', { title: 80 }), 'cover', { title: 140, text: 70 });
    expect(spacingVariables(skin, 'Anatomy')).toEqual({ '--title-leading': '0.8', '--text-leading': '1' });
    expect(spacingVariables(skin, 'Cover')).toEqual({ '--title-leading': '1.4', '--text-leading': '0.7' });
    expect(spacingVariables(skin, 'Color palette')).toEqual({ '--title-leading': '1', '--text-leading': '1' });
  });
});

describe('Lines – settings', () => {
  it("starts with today's lines", () => {
    expect(NO_SKIN.lines).toBeUndefined();
    expect(skinLines(NO_SKIN)).toEqual({ decorative: 1, technical: 100 });
    expect(DEFAULT_LINES).toEqual({ decorative: 1, technical: 100 });
    expect(lineVariables(NO_SKIN)).toEqual({ '--line-decorative': '1px', '--line-technical': '1' });
  });

  it('has the ranges of the spec', () => {
    expect(LINE_CONTROLS.map(({ key, label, min, max, step }) => [key, label, min, max, step])).toEqual([
      ['decorative', 'Decorative lines', 0.5, 4, 0.5],
      ['technical', 'Technical lines', 50, 300, 25],
    ]);
  });

  it('changes one value and keeps the other', () => {
    const skin = setLines(NO_SKIN, { technical: 200 });
    expect(skin.lines).toEqual({ decorative: 1, technical: 200 });
    expect(lineVariables(setLines(skin, { decorative: 2.5 }))).toEqual({ '--line-decorative': '2.5px', '--line-technical': '2' });
  });
});

// Jest does not load the stylesheets, so the rules that read the variables are checked as text
describe('Line spacing and lines – the templates\' CSS', () => {
  const shared = readFileSync(join(__dirname, '../src/templates/shared.css'), 'utf8');
  const template3 = readFileSync(join(__dirname, '../src/templates/template3/template3.css'), 'utf8');

  function rule(css: string, selector: string) {
    const start = css.indexOf(`\n${selector} {`);
    expect(start).toBeGreaterThan(-1);
    return css.slice(start, css.indexOf('}', start));
  }

  it("multiplies today's line heights by the section's factors", () => {
    expect(rule(shared, '.cover-designed-by')).toContain('line-height: calc(5.7cqw * var(--text-leading, 1))');
    expect(rule(shared, '.palette-layout')).toContain('line-height: calc(1.25 * var(--text-leading, 1))');
    expect(rule(shared, '.palette-heading')).toContain('line-height: calc(1.25 * var(--title-leading, 1))');
    expect(rule(shared, '.type-layout')).toContain('line-height: calc(1.2 * var(--text-leading, 1))');
    expect(rule(shared, '.type-heading')).toContain('line-height: calc(1.2 * var(--title-leading, 1))');
    expect(rule(shared, '.logo-page')).toContain('line-height: calc(1.3 * var(--text-leading, 1))');
    expect(rule(shared, '.usage-description')).toContain('line-height: calc(1.3 * var(--text-leading, 1))');
    expect(rule(shared, '.logo-page-brand,\n.logo-page-heading,\n.logo-block-title')).toContain(
      'line-height: calc(1.3 * var(--title-leading, 1))',
    );
  });

  // linespacing.md, Scenario 5
  it('keeps the "Aa" sample at line-height 1', () => {
    expect(rule(shared, '.type-sample')).toContain('line-height: 1;');
  });

  it('draws the decorative lines with Decorative lines', () => {
    expect(rule(shared, '.palette-chip')).toContain('inset 0 0 0 var(--line-decorative, 1px)');
    expect(template3).toContain('no-repeat 34% 0 / var(--line-decorative, 1px) 100%');
    expect(template3).toContain('border-top: var(--line-decorative, 1px) solid');
  });

  it("multiplies each technical line by Technical lines, and leaves the guides' grab band alone", () => {
    const widths = [...shared.matchAll(/stroke-width: ([^;]+);/g)].map((match) => match[1]);
    expect(widths).toEqual([
      'calc(1px * var(--line-technical, 1))', // clear space edge
      'calc(0.75px * var(--line-technical, 1))', // box around the logo
      'calc(0.75px * var(--line-technical, 1))', // grid's edge and guide lines along the logo
      'calc(0.75px * var(--line-technical, 1))', // X marks
      'calc(0.75px * var(--line-technical, 1))', // rulers
      '8px', // the grab band of the guides
      'calc(0.75px * var(--line-technical, 1))', // guides
    ]);
  });
});
