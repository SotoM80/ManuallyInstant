import { fireEvent, screen, within } from '@testing-library/react';
import { renderApp } from './renderApp';

// Specs: specs/linespacing.md and specs/lines.md (ADR 0026). Jest does not load the stylesheets,
// so the pages are checked by the variables they set (the CSS is checked in lineSettings.test.ts).
jest.setTimeout(20000);

const SECTIONS = { Cover: 1, Logo: 2, Usage: 3, Colors: 4, Typography: 5, Skin: 6, Mockups: 7 } as const;
type Section = keyof typeof SECTIONS;

function sectionForm(section: Section) {
  return within(document.querySelector(`li[data-section="${section.toLowerCase()}"]`) as HTMLElement);
}

function openSection(section: Section) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${SECTIONS[section]}\\. ${section}`) }));
  return sectionForm(section);
}

// Opens the section (unless it is the Cover, open at the start) and unfolds its Line spacing
function unfold(section: Section) {
  const form = section === 'Cover' ? sectionForm('Cover') : openSection(section);
  fireEvent.click(form.getByRole('button', { name: `${section} line spacing` }));
  return form;
}

function slide(form: ReturnType<typeof unfold>, name: string, value: number) {
  fireEvent.change(form.getByRole('slider', { name }), { target: { value: String(value) } });
}

function variable(page: string, name: string) {
  return screen.getByRole('article', { name: page }).style.getPropertyValue(name);
}

const LOGO_PAGES = ['Brand concept', 'Anatomy', 'Logo versions', 'Clear space'];
const ALL_PAGES = ['Cover', ...LOGO_PAGES, 'Correct use', 'Incorrect use', 'Color palette', 'Typography', 'Mockups'];

describe('Line spacing per section', () => {
  // Scenario 1
  it("starts at today's spacing", () => {
    renderApp();
    const form = unfold('Colors');

    expect(form.getByRole('slider', { name: 'Colors title line spacing' })).toHaveValue('100');
    expect(form.getByRole('slider', { name: 'Colors text line spacing' })).toHaveValue('100');
    expect(form.getAllByText('100%')).toHaveLength(2);
    for (const page of ALL_PAGES) {
      expect(variable(page, '--title-leading')).toBe('1');
      expect(variable(page, '--text-leading')).toBe('1');
    }
  });

  // Scenario 2
  it('changes the text of its own pages only, at once', () => {
    renderApp();
    const form = unfold('Colors');

    slide(form, 'Colors text line spacing', 160);

    expect(form.getByText('160%')).toBeInTheDocument();
    expect(variable('Color palette', '--text-leading')).toBe('1.6');
    expect(variable('Color palette', '--title-leading')).toBe('1');
    expect(variable('Typography', '--text-leading')).toBe('1');
  });

  // Scenario 3
  it('changes the titles of every page of the section', () => {
    renderApp();
    const form = unfold('Logo');

    slide(form, 'Logo title line spacing', 80);

    for (const page of LOGO_PAGES) {
      expect(variable(page, '--title-leading')).toBe('0.8');
      expect(variable(page, '--text-leading')).toBe('1');
    }
    expect(variable('Correct use', '--title-leading')).toBe('1');
  });

  // Scenario 4
  it('changes the Cover too, and no inner page', () => {
    renderApp();
    const form = unfold('Cover');

    slide(form, 'Cover title line spacing', 140);
    slide(form, 'Cover text line spacing', 70);

    expect(variable('Cover', '--title-leading')).toBe('1.4');
    expect(variable('Cover', '--text-leading')).toBe('0.7');
    expect(variable('Brand concept', '--title-leading')).toBe('1');
  });

  // Scenario 6
  it('stays between 50 and 200 %, in steps of 5', () => {
    renderApp();
    const slider = unfold('Mockups').getByRole('slider', { name: 'Mockups title line spacing' });

    expect(slider).toHaveAttribute('min', '50');
    expect(slider).toHaveAttribute('max', '200');
    expect(slider).toHaveAttribute('step', '5');
  });

  // Scenario 7
  it('is kept after going to Home and back', () => {
    renderApp();
    slide(unfold('Usage'), 'Usage text line spacing', 130);
    const menu = within(screen.getByRole('banner')).getByRole('navigation', { name: 'Main' });

    fireEvent.click(within(menu).getByRole('link', { name: 'Home' }));
    fireEvent.click(within(menu).getByRole('link', { name: 'Brand Manual' }));

    expect(variable('Correct use', '--text-leading')).toBe('1.3');
    expect(variable('Incorrect use', '--text-leading')).toBe('1.3');
    expect(unfold('Usage').getByRole('slider', { name: 'Usage text line spacing' })).toHaveValue('130');
  });

  // Scenario 10
  it('folds again when its section is opened again, keeping its values', () => {
    renderApp();
    slide(unfold('Colors'), 'Colors text line spacing', 120);

    openSection('Typography');
    const colors = openSection('Colors');

    expect(colors.getByRole('button', { name: 'Colors line spacing' })).toHaveAttribute('aria-expanded', 'false');
    expect(variable('Color palette', '--text-leading')).toBe('1.2');
  });

  it('has no group in the Skin section', () => {
    renderApp();
    expect(openSection('Skin').queryByRole('button', { name: 'Skin line spacing' })).not.toBeInTheDocument();
  });
});

describe('Lines – the Skin group', () => {
  function lines() {
    openSection('Skin');
    return within(screen.getByRole('group', { name: 'Lines' }));
  }

  // lines.md, Scenario 1
  it("starts with today's lines", () => {
    renderApp();
    const group = lines();

    expect(group.getByLabelText('Decorative lines')).toHaveValue('1');
    expect(group.getByLabelText('Technical lines')).toHaveValue('100');
    expect(group.getByText('1 px')).toBeInTheDocument();
    expect(group.getByText('100%')).toBeInTheDocument();
  });

  // lines.md, Scenarios 2 and 3
  it('sets the same weight on every page, the Cover included', () => {
    renderApp();
    const group = lines();

    fireEvent.change(group.getByLabelText('Decorative lines'), { target: { value: '3' } });
    fireEvent.change(group.getByLabelText('Technical lines'), { target: { value: '200' } });

    for (const page of ALL_PAGES) {
      expect(variable(page, '--line-decorative')).toBe('3px');
      expect(variable(page, '--line-technical')).toBe('2');
    }
  });

  // lines.md, Scenario 5
  it('leaves the image boxes their own outline', () => {
    renderApp();
    fireEvent.change(lines().getByLabelText('Technical lines'), { target: { value: '300' } });

    expect(variable('Logo versions', '--box-outline')).toContain('inset 0 0 0 1px');
  });

  // lines.md, Scenario 7
  it('is kept after going to Home and back', () => {
    renderApp();
    fireEvent.change(lines().getByLabelText('Decorative lines'), { target: { value: '2' } });
    const menu = within(screen.getByRole('banner')).getByRole('navigation', { name: 'Main' });

    fireEvent.click(within(menu).getByRole('link', { name: 'Home' }));
    fireEvent.click(within(menu).getByRole('link', { name: 'Brand Manual' }));

    expect(variable('Typography', '--line-decorative')).toBe('2px');
    expect(lines().getByLabelText('Decorative lines')).toHaveValue('2');
  });
});
