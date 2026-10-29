import { readFileSync } from 'fs';
import { join } from 'path';
import { BOX_CONTROLS, DEFAULT_BOXES, boxVariables, setBoxes } from '../src/skins/boxes';
import { NO_SKIN } from '../src/skins/presets';

// Spec: specs/imageboxes.md (ADR 0022)
describe('Image boxes – settings', () => {
  it('starts with the look the boxes had before', () => {
    expect(NO_SKIN.boxes).toEqual({ radius: 4, margin: 8, outline: true, outlineWidth: 1 });
    expect(DEFAULT_BOXES).toBe(NO_SKIN.boxes);
  });

  it('has the ranges of the spec', () => {
    expect(BOX_CONTROLS.map(({ key, min, max, step }) => [key, min, max, step])).toEqual([
      ['radius', 0, 24, 1],
      ['margin', 0, 20, 1],
      ['outlineWidth', 1, 4, 1],
    ]);
  });

  it('changes one setting and keeps the rest, and the skin it came from', () => {
    const skin = setBoxes(NO_SKIN, { radius: 12 });
    expect(skin.boxes).toEqual({ radius: 12, margin: 8, outline: true, outlineWidth: 1 });
    expect(NO_SKIN.boxes.radius).toBe(4);
  });

  it('turns the settings into CSS variables, with an inset outline', () => {
    expect(boxVariables(DEFAULT_BOXES)).toEqual({
      '--box-radius': '4px',
      '--box-margin': '8%',
      '--box-outline': 'inset 0 0 0 1px color-mix(in srgb, currentColor 15%, transparent)',
    });
    expect(boxVariables({ radius: 0, margin: 15, outline: true, outlineWidth: 3 })).toMatchObject({
      '--box-radius': '0px',
      '--box-margin': '15%',
      '--box-outline': 'inset 0 0 0 3px color-mix(in srgb, currentColor 15%, transparent)',
    });
    expect(boxVariables({ ...DEFAULT_BOXES, outline: false })).toMatchObject({ '--box-outline': 'none' });
  });
});

// Jest does not load the stylesheets, so the rules that read the variables are checked as text
describe('Image boxes – shared.css', () => {
  const css = readFileSync(join(__dirname, '../src/templates/shared.css'), 'utf8');

  function rule(selector: string) {
    const start = css.indexOf(`\n${selector} {`);
    expect(start).toBeGreaterThan(-1);
    return css.slice(start, css.indexOf('}', start));
  }

  it('reads the variables in every image box, with today\'s look as fallback', () => {
    expect(rule('.logo-figure')).toContain('border-radius: var(--box-radius, 4px)');
    expect(rule('.logo-figure')).toContain('box-shadow: var(--box-outline, inset 0 0 0 1px');
    expect(rule('.logo-figure img')).toContain('inset: var(--box-margin, 8%)');
    expect(rule('.logo-figure img')).toContain('width: calc(100% - 2 * var(--box-margin, 8%))');
  });

  // Scenario 7
  it('keeps the Brand concept logo out of them', () => {
    expect(rule('.concept-logo')).toContain('border-radius: 4px');
    expect(rule('.concept-logo')).toContain('box-shadow: none');
    expect(rule('.concept-logo img')).toContain('inset: 8%');
    expect(css.indexOf('\n.concept-logo img {')).toBeGreaterThan(css.indexOf('\n.logo-figure img {'));
  });
});
