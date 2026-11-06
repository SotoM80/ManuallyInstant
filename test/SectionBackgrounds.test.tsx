import { fireEvent, screen, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { makeLogo } from './coverForm';
import { skinPicturesReady } from '../src/export/skinPictures';

// Spec: specs/sectionbackgrounds.md (ADR 0025). jsdom loads no pictures, so a picture is checked
// by the <image> drawn on the page.
jest.setTimeout(20000);

const SECTIONS = { Cover: 1, Logo: 2, Usage: 3, Colors: 4, Typography: 5, Skin: 6, Mockups: 7 } as const;
type Section = keyof typeof SECTIONS;

function openSection(section: Section) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${SECTIONS[section]}\\. ${section}`) }));
  return within(document.querySelector(`li[data-section="${section.toLowerCase()}"]`) as HTMLElement);
}

// Opens the section (unless it is the Cover, open at the start) and unfolds its group
function unfold(section: Section) {
  const form = section === 'Cover' ? within(document.querySelector('li[data-section="cover"]') as HTMLElement) : openSection(section);
  fireEvent.click(form.getByRole('button', { name: `${section} section background` }));
  return form;
}

function page(name: string) {
  return screen.getByRole('article', { name });
}

function picture(name: string) {
  return page(name).querySelector('svg.skin-layer g[data-skin="section"] image');
}

function setColor(form: ReturnType<typeof unfold>, section: Section, hex: string) {
  fireEvent.change(form.getByRole('textbox', { name: `${section} background color HEX` }), { target: { value: hex } });
}

function applyPicture(form: ReturnType<typeof unfold>, section: Section, name = 'studio.jpg') {
  fireEvent.change(form.getByLabelText(`${section} background image`, { selector: 'input' }), {
    target: { files: [makeLogo(name, 'image/jpeg')] },
  });
  fireEvent.click(form.getByRole('button', { name: `Apply ${section} background image` }));
}

const LOGO_PAGES = ['Brand concept', 'Anatomy', 'Logo versions', 'Clear space'];

describe('Section backgrounds', () => {
  it('sets nothing by default (scenario 1)', () => {
    renderApp();
    const form = unfold('Colors');

    expect(form.getByRole('button', { name: "Colors background color: Skin's" })).toHaveAttribute('aria-pressed', 'true');
    expect(form.getByRole('button', { name: 'Apply Colors background image' })).toBeDisabled();
    expect(form.getByRole('radio', { name: 'Colors background fit: Cover' })).toBeChecked();
    expect(form.getByRole('slider', { name: 'Colors background opacity' })).toHaveValue('100');
    expect(page('Color palette')).toHaveStyle({ background: '#FFFFFF' });
    expect(picture('Color palette')).toBeNull();
  });

  it("paints only its section's pages, keeping the text color (scenario 2)", () => {
    renderApp();
    setColor(unfold('Colors'), 'Colors', '#111111');

    expect(page('Color palette')).toHaveStyle({ background: '#111111' });
    for (const other of ['Typography', 'Brand concept', 'Mockups']) {
      expect(page(other)).toHaveStyle({ background: '#FFFFFF' });
    }
  });

  it('paints every page of the section (scenario 3)', () => {
    renderApp();
    setColor(unfold('Logo'), 'Logo', '#1E88E5');

    for (const name of LOGO_PAGES) expect(page(name)).toHaveStyle({ background: '#1E88E5' });
    expect(page('Correct use')).toHaveStyle({ background: '#FFFFFF' });
  });

  it("goes back to the Skin's Page background and follows it (scenario 4)", () => {
    renderApp();
    const form = unfold('Colors');
    setColor(form, 'Colors', '#111111');
    fireEvent.click(form.getByRole('button', { name: "Colors background color: Skin's" }));

    const skin = openSection('Skin');
    fireEvent.change(skin.getByRole('textbox', { name: 'Page background HEX' }), { target: { value: '#FFF8E1' } });

    expect(page('Color palette')).toHaveStyle({ background: '#FFF8E1' });
  });

  it('draws the picture only after its Apply, under the Skin layers (scenarios 5 and 9)', () => {
    renderApp();
    const skin = openSection('Skin');
    fireEvent.click(skin.getByRole('button', { name: '+ Add layer' }));
    fireEvent.click(skin.getByRole('button', { name: 'Add Dots' }));

    const form = unfold('Mockups');
    fireEvent.change(form.getByLabelText('Mockups background image', { selector: 'input' }), {
      target: { files: [makeLogo('studio.jpg', 'image/jpeg')] },
    });
    expect(picture('Mockups')).toBeNull();

    fireEvent.click(form.getByRole('button', { name: 'Apply Mockups background image' }));

    expect(picture('Mockups')).toHaveAttribute('href', 'blob:studio.jpg');
    const groups = [...page('Mockups').querySelectorAll('svg.skin-layer > g')].map((g) => g.getAttribute('data-skin'));
    expect(groups[0]).toBe('section'); // drawn first, so under the layers
    expect(groups).toContain('pattern');
    expect(picture('Typography')).toBeNull();
    expect(form.getByRole('button', { name: 'Apply Mockups background image' })).toBeDisabled();
  });

  it('fades the picture with its opacity, over the color (scenario 6)', () => {
    renderApp();
    const form = unfold('Mockups');
    setColor(form, 'Mockups', '#000000');
    applyPicture(form, 'Mockups');

    fireEvent.change(form.getByRole('slider', { name: 'Mockups background opacity' }), { target: { value: '40' } });

    expect(picture('Mockups')!.closest('g')).toHaveAttribute('opacity', '0.4');
    expect(page('Mockups')).toHaveStyle({ background: '#000000' });
    expect(form.getByText('40%')).toBeInTheDocument();
  });

  it('shows the whole picture with Contain (scenario 7)', () => {
    renderApp();
    const form = unfold('Typography');
    applyPicture(form, 'Typography');
    expect(picture('Typography')).toHaveAttribute('preserveAspectRatio', 'xMidYMid slice');

    fireEvent.click(form.getByRole('radio', { name: 'Typography background fit: Contain' }));

    expect(picture('Typography')).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
  });

  it('removes the picture and keeps the opacity (scenario 8)', () => {
    renderApp();
    const form = unfold('Usage');
    applyPicture(form, 'Usage');
    fireEvent.change(form.getByRole('slider', { name: 'Usage background opacity' }), { target: { value: '60' } });

    fireEvent.click(form.getByRole('button', { name: 'Remove Usage background image' }));

    expect(picture('Correct use')).toBeNull();
    expect(picture('Incorrect use')).toBeNull();
    expect(form.getByRole('slider', { name: 'Usage background opacity' })).toHaveValue('60');
  });

  it('gives the Cover a picture but no color field (scenario 10)', () => {
    renderApp();
    const form = unfold('Cover');

    expect(form.queryByRole('textbox', { name: 'Cover background color HEX' })).not.toBeInTheDocument();
    applyPicture(form, 'Cover');
    fireEvent.change(form.getByRole('slider', { name: 'Cover background opacity' }), { target: { value: '50' } });

    expect(picture('Cover')!.closest('g')).toHaveAttribute('opacity', '0.5');
    expect(picture('Brand concept')).toBeNull();
  });

  it('flags a file over 5 MB and keeps Apply off (scenario 11)', () => {
    renderApp();
    const form = unfold('Logo');
    fireEvent.change(form.getByLabelText('Logo background image', { selector: 'input' }), {
      target: { files: [makeLogo('photo.png', 'image/png', 7 * 1024 * 1024)] },
    });

    expect(form.getByText('The image must be 5 MB or smaller')).toBeInTheDocument();
    expect(form.getByRole('button', { name: 'Apply Logo background image' })).toBeDisabled();
    expect(picture('Brand concept')).toBeNull();
  });

  it('keeps the background when going to Home and back (scenario 12)', () => {
    renderApp();
    const form = unfold('Colors');
    setColor(form, 'Colors', '#111111');
    applyPicture(form, 'Colors');

    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    fireEvent.click(screen.getByRole('link', { name: 'Brand Manual' }));

    expect(page('Color palette')).toHaveStyle({ background: '#111111' });
    expect(picture('Color palette')).toHaveAttribute('href', 'blob:studio.jpg');
    const again = unfold('Colors');
    expect(again.getByRole('textbox', { name: 'Colors background color HEX' })).toHaveValue('#111111');
  });

  it('folds the group again when its section is closed and opened (scenario 16)', () => {
    renderApp();
    const form = unfold('Colors');
    setColor(form, 'Colors', '#111111');

    openSection('Typography');
    const again = openSection('Colors');

    expect(again.getByRole('button', { name: 'Colors section background' })).toHaveAttribute('aria-expanded', 'false');
    expect(page('Color palette')).toHaveStyle({ background: '#111111' });
  });

  it('is checked before the PDF like a Skin picture, and stops it when unreadable (scenarios 14 and 15)', async () => {
    renderApp();
    applyPicture(unfold('Mockups'), 'Mockups', 'gone.jpg');
    const realImage = globalThis.Image;
    const loads: string[] = [];
    class FakeImage {
      onload: () => void = () => {};
      onerror: () => void = () => {};
      set src(url: string) {
        loads.push(url);
        setTimeout(() => this.onerror());
      }
    }
    Object.assign(globalThis, { Image: FakeImage });
    try {
      await expect(skinPicturesReady(document.body)).rejects.toThrow('A picture of the Skin could not be read');
      expect(loads).toEqual(['blob:gone.jpg']);
    } finally {
      Object.assign(globalThis, { Image: realImage });
    }
  });
});
