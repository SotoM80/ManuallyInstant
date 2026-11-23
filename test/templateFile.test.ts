import { readTemplateFile, templateFileName, templateFileText } from '../src/mockups/templateFile';
import { TEST_PHOTO_TEMPLATE } from './photoTemplateFixture';

// Spec: specs/mockups.md, Template files (ADR 0040)
const template = { ...TEST_PHOTO_TEMPLATE, image: 'data:image/png;base64,eA==' };

describe('templateFileName', () => {
  it('is the name made safe for a file', () => {
    expect(templateFileName('Taza Café (cliente A)')).toBe('taza-cafe-cliente-a.template.json');
    expect(templateFileName('  ')).toBe('template.template.json');
  });
});

describe('readTemplateFile', () => {
  it('reads back what templateFileText wrote', () => {
    expect(readTemplateFile(templateFileText({ ...template, revision: 5 }))).toEqual({ ...template, revision: undefined });
  });

  const file = (change: (data: Record<string, unknown>) => void) => {
    const data = JSON.parse(templateFileText(template));
    change(data);
    return JSON.stringify(data);
  };

  it.each([
    ['not JSON', 'not json'],
    ['another app', file((d) => (d.app = 'Other'))],
    ['another version', file((d) => (d.version = 2))],
    ['no template', file((d) => delete d.template)],
    ['a photo from an address', file((d) => ((d.template as Record<string, unknown>).image = 'https://example.com/a.png'))],
    ['an SVG photo', file((d) => ((d.template as Record<string, unknown>).image = 'data:image/svg+xml;base64,PHN2Zz4='))],
    ['a mask from an address', file((d) => ((d.template as Record<string, unknown>).maskImage = 'https://example.com/m.png'))],
  ])('refuses %s', (_, text) => {
    expect(readTemplateFile(text)).toBeNull();
  });
});
