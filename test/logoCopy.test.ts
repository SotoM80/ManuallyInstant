import {
  anatomyText,
  clearSpaceText,
  minSizeRules,
  philosophyText,
  primaryText,
  usageRules,
} from '../src/data/logoCopy';
import type { LogoData } from '../src/types';

// Spec: specs/logo.md, Section 3 — Text of the pages
const image = { url: 'blob:logo', name: 'logo.png' };

const volta: LogoData = {
  brandName: 'VOLTA',
  concept: 'Energy that moves cities.',
  marks: [{ type: 'Imagotype', name: 'Lightning symbol', role: 'Conveys energy', image: null, parts: [] }],
  variants: [
    { name: 'Horizontal', usage: 'for web and long stationery.', image },
    { name: 'Vertical', usage: 'for packaging and social media', image },
  ],
  clearSpaceUnit: 'the height of the letter X',
  minDigitalPx: 32,
  minPrintMm: 15,
  grid: null,
};

describe('logo copy', () => {
  it('frames the concept the user wrote with fixed sentences', () => {
    const text = philosophyText(volta);

    expect(text[0]).toBe('The identity of VOLTA is built on a clear idea:');
    expect(text[1]).toBe('Energy that moves cities.');
  });

  it('defines a single mark type, with the right article', () => {
    expect(anatomyText(volta)).toMatch(/^VOLTA is an Imagotype: a symbol and a wordmark/);
    const logotype = { ...volta, marks: [{ ...volta.marks[0], type: 'Logotype' as const }] };
    expect(anatomyText(logotype)).toMatch(/^VOLTA is a Logotype:/);
  });

  it('names every mark type when the brand uses several', () => {
    const mark = (type: 'Logotype' | 'Imagotype' | 'Isotype') => ({ type, name: '', role: '', image: null, parts: [] });

    expect(anatomyText({ ...volta, marks: [mark('Logotype'), mark('Isotype')] })).toBe(
      'VOLTA works with a Logotype and an Isotype. Each one has its own role:',
    );
    expect(anatomyText({ ...volta, marks: [mark('Logotype'), mark('Imagotype'), mark('Isotype')] })).toBe(
      'VOLTA works with a Logotype, an Imagotype and an Isotype. Each one has its own role:',
    );
  });

  it('names the first variant as the master configuration', () => {
    expect(primaryText(volta)).toMatch(/^The Horizontal version is the master configuration of VOLTA\./);
  });

  it('writes one imperative rule per variant, without a double period', () => {
    expect(usageRules(volta)).toEqual([
      'Use the Horizontal version for web and long stationery.',
      'Use the Vertical version for packaging and social media.',
    ]);
  });

  it('measures the clear space with the unit X', () => {
    expect(clearSpaceText(volta)).toContain('base unit X, which equals the height of the letter X.');
  });

  it('states both minimum sizes', () => {
    const [digital, print] = minSizeRules(volta);

    expect(digital).toEqual(expect.objectContaining({ label: 'Digital media' }));
    expect(digital.text).toContain('32 px');
    expect(print).toEqual(expect.objectContaining({ label: 'Print media' }));
    expect(print.text).toContain('15 mm');
  });
});
