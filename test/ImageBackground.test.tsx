import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { makeLogo } from './coverForm';
import { createPdf } from '../src/export/createPdf';

// Spec: specs/imagebackground.md. The export is mocked (jsdom cannot draw pages, ADR 0012).
jest.mock('../src/export/createPdf', () => ({ createPdf: jest.fn(async () => {}), createCmykPdf: jest.fn() }));
jest.setTimeout(20000);

const BLACK = 'rgb(0, 0, 0)';

function sections() {
  return screen.getByRole('region', { name: 'Manual sections' });
}

function openSection(name: RegExp) {
  fireEvent.click(within(sections()).getByRole('button', { name }));
}

function logoForm() {
  return within(screen.getByRole('form', { name: 'Logo' }));
}

function usageForm() {
  return within(screen.getByRole('form', { name: 'Usage' }));
}

function page(name: string) {
  const preview = screen.getByRole('region', { name: 'Manual preview' });
  return within(preview).getByRole('article', { name });
}

// The boxes of a page, in reading order (the Primary first on Logo versions)
function boxes(name: string) {
  return [...page(name).querySelectorAll<HTMLElement>('figure.logo-figure')];
}

function more(form: ReturnType<typeof logoForm>, field: string) {
  fireEvent.click(form.getByRole('button', { name: `More for ${field}` }));
}

function typeHex(form: ReturnType<typeof logoForm>, label: string, value: string) {
  const field = form.getByRole('textbox', { name: `${label} HEX` });
  fireEvent.change(field, { target: { value } });
  return field;
}

function upload(form: ReturnType<typeof logoForm>, label: string, file: File) {
  fireEvent.change(form.getByLabelText(label, { selector: 'input' }), { target: { files: [file] } });
}

// Logo with two versions, the second one open
function twoVersions() {
  renderApp();
  openSection(/2\. Logo/);
  fireEvent.change(logoForm().getByLabelText('Brand name'), { target: { value: 'VOLTA' } });
  fireEvent.click(logoForm().getByRole('button', { name: 'Add version' }));
}

describe('Background per image – versions', () => {
  // Scenario 1
  it('has no background by default', () => {
    twoVersions();
    fireEvent.click(logoForm().getByRole('button', { name: 'Version 1' }));
    more(logoForm(), 'Version 1 image');

    expect(logoForm().getByRole('button', { name: 'Version 1 background: none' })).toHaveAttribute('aria-pressed', 'true');
    expect(boxes('Logo versions').map((box) => box.style.backgroundColor)).toEqual(['', '']);
  });

  // Scenario 2
  it('paints only its own box, at once, with no Apply', () => {
    twoVersions();
    upload(logoForm(), 'Version 2 image', makeLogo('negative.png'));
    fireEvent.click(logoForm().getByRole('button', { name: 'Apply Version 2 image' }));
    more(logoForm(), 'Version 2 image');

    typeHex(logoForm(), 'Version 2 background', '#000000');

    const [primary, second] = boxes('Logo versions');
    expect(second.style.backgroundColor).toBe(BLACK);
    expect(primary.style.backgroundColor).toBe('');
  });

  // Scenario 3
  it('goes back to no background', () => {
    twoVersions();
    more(logoForm(), 'Version 2 image');
    typeHex(logoForm(), 'Version 2 background', '#000000');

    fireEvent.click(logoForm().getByRole('button', { name: 'Version 2 background: none' }));

    expect(boxes('Logo versions')[1].style.backgroundColor).toBe('');
  });

  // Scenario 7
  it('paints an empty box, keeping its stripes', () => {
    twoVersions();
    more(logoForm(), 'Version 2 image');

    typeHex(logoForm(), 'Version 2 background', '#E53935');

    const box = boxes('Logo versions')[1];
    expect(box).toHaveAttribute('data-empty', 'true');
    expect(box.style.backgroundColor).toBe('rgb(229, 57, 53)');
    expect(box.style.backgroundImage).toBe(''); // the stripes come from the stylesheet, untouched
  });

  // Scenario 8
  it('keeps the last valid color while a HEX is half typed', () => {
    twoVersions();
    more(logoForm(), 'Version 2 image');
    typeHex(logoForm(), 'Version 2 background', '#000000');

    const field = typeHex(logoForm(), 'Version 2 background', '#12');
    expect(boxes('Logo versions')[1].style.backgroundColor).toBe(BLACK);

    fireEvent.blur(field);
    expect(logoForm().getByText('Enter a valid HEX color, like #1E88E5')).toBeInTheDocument();
  });

  // Scenario 9
  it('keeps the background when another image is applied', () => {
    twoVersions();
    upload(logoForm(), 'Version 2 image', makeLogo('first.png'));
    fireEvent.click(logoForm().getByRole('button', { name: 'Apply Version 2 image' }));
    more(logoForm(), 'Version 2 image');
    typeHex(logoForm(), 'Version 2 background', '#000000');

    upload(logoForm(), 'Version 2 image', makeLogo('second.png'));
    fireEvent.click(logoForm().getByRole('button', { name: 'Apply Version 2 image' }));

    const box = boxes('Logo versions')[1];
    expect(box.querySelector('img')).toHaveAttribute('src', 'blob:second.png');
    expect(box.style.backgroundColor).toBe(BLACK);
  });
});

describe('Background per image – Anatomy and Clear space', () => {
  // Scenario 5
  it('gives the mark and each part their own box color', () => {
    renderApp();
    openSection(/2\. Logo/);
    fireEvent.click(logoForm().getByRole('button', { name: 'Add part to Imagotype' }));
    fireEvent.click(logoForm().getByRole('button', { name: 'Add part to Imagotype' }));
    more(logoForm(), 'Imagotype image');
    typeHex(logoForm(), 'Imagotype background', '#FFD600');
    more(logoForm(), 'Imagotype part 2 image');
    typeHex(logoForm(), 'Imagotype part 2 background', '#1A237E');
    // A part with nothing in it is left out of the page: give both parts a label
    fireEvent.change(logoForm().getByLabelText('Imagotype part 1 label'), { target: { value: 'Symbol' } });
    fireEvent.change(logoForm().getByLabelText('Imagotype part 2 label'), { target: { value: 'Word' } });

    const [part1, part2, mark] = boxes('Anatomy');
    expect(part1.style.backgroundColor).toBe('');
    expect(part2.style.backgroundColor).toBe('rgb(26, 35, 126)');
    expect(mark.style.backgroundColor).toBe('rgb(255, 214, 0)');
  });

  // Scenario 6
  it('paints 3.1 inside the dashed edge and the box of 3.2 with Version 1\'s background', () => {
    renderApp();
    openSection(/2\. Logo/);
    upload(logoForm(), 'Version 1 image', makeLogo('primary.png'));
    fireEvent.click(logoForm().getByRole('button', { name: 'Apply Version 1 image' }));
    more(logoForm(), 'Version 1 image');

    typeHex(logoForm(), 'Version 1 background', '#000000');

    const fill = page('Clear space').querySelector<SVGRectElement>('.clearspace-area-fill');
    const edge = page('Clear space').querySelector('.clearspace-area-edge');
    expect(fill?.style.fill).toBe('#000000'); // jsdom keeps an SVG fill as written
    expect(fill?.getAttribute('width')).toBe(edge?.getAttribute('width'));
    expect(boxes('Clear space')[0].style.backgroundColor).toBe(BLACK);
  });

  it('draws no fill in 3.1 with no background', () => {
    renderApp();
    openSection(/2\. Logo/);
    fireEvent.change(logoForm().getByLabelText('Brand name'), { target: { value: 'VOLTA' } });

    expect(page('Clear space').querySelector('.clearspace-area-fill')).toBeNull();
  });
});

describe('Background per image – Usage', () => {
  function openUsage() {
    renderApp();
    openSection(/3\. Usage/);
  }

  // Scenario 4
  it('copies a palette color, and the mark keeps its white circle', () => {
    renderApp();
    openSection(/4\. Colors/);
    const colors = within(screen.getByRole('form', { name: 'Colors' }));
    fireEvent.change(colors.getByLabelText('Color 1 name'), { target: { value: 'Primary blue' } });
    const group = colors.getByRole('group', { name: 'Color 1' });
    fireEvent.click(within(group).getByRole('radio', { name: 'Blue' }));
    openSection(/3\. Usage/);
    more(usageForm(), 'Correct use example 1 image');

    fireEvent.click(usageForm().getByRole('button', { name: 'Correct use example 1 background: use Primary blue' }));

    const [first] = boxes('Correct use');
    expect(first.style.backgroundColor).toBe('rgb(30, 136, 229)');
    expect(first.querySelector('.usage-mark')).toBeInTheDocument();
  });

  // Scenario 11
  it('starts with More folded, out of reach', () => {
    openUsage();

    const toggle = usageForm().getByRole('button', { name: 'More for Correct use example 1 image' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const body = document.getElementById(toggle.getAttribute('aria-controls')!)!;
    expect(body).toHaveAttribute('inert');
    expect(body).not.toBeVisible();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(body).not.toHaveAttribute('inert');
  });
});

describe('Background per image – other pages and the PDF', () => {
  // Scenario 10
  it('does not reach the Mockups page', () => {
    twoVersions();
    more(logoForm(), 'Version 2 image');
    typeHex(logoForm(), 'Version 2 background', '#000000');

    expect(page('Mockups').querySelector('[style*="background-color: rgb(0, 0, 0)"]')).toBeNull();
  });

  // Scenario 12
  it('is in the PDF as in the preview', async () => {
    let versions: HTMLElement | undefined;
    (createPdf as jest.Mock).mockImplementation(async (pages: HTMLElement[]) => {
      versions = pages.find((element) => element.getAttribute('aria-label') === 'Logo versions');
    });
    twoVersions();
    more(logoForm(), 'Version 2 image');
    typeHex(logoForm(), 'Version 2 background', '#000000');

    fireEvent.click(screen.getByRole('button', { name: 'Download web PDF' }));
    fireEvent.click(screen.getByRole('button', { name: 'Download anyway' }));

    await waitFor(() => expect(versions).toBeDefined(), { timeout: 8000 });
    expect(versions!.querySelectorAll<HTMLElement>('figure.logo-figure')[1].style.backgroundColor).toBe(BLACK);
  });
});
