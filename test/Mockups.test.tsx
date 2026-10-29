import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { typeTitle, uploadLogo } from './coverForm';
import { MOCKUP_PRODUCTS } from '../src/mockups/products';
import { DEFAULT_MOCKUPS } from '../src/mockups/mockups';
import { createPdf } from '../src/export/createPdf';

// Spec: specs/mockups.md. The drawing of the PDF is mocked (ADR 0012).
jest.mock('../src/export/createPdf', () => ({ createPdf: jest.fn(async () => {}) }));
jest.setTimeout(20000);

const DEFAULT_NAMES = DEFAULT_MOCKUPS.chosen.map((id) => MOCKUP_PRODUCTS.find((product) => product.id === id)!.name);

function page() {
  return screen.getByRole('article', { name: 'Mockups' });
}

function mockupsOnPage() {
  return within(page())
    .queryAllByRole('img')
    .map((art) => art.getAttribute('aria-label'));
}

function openMockups() {
  fireEvent.click(screen.getByRole('button', { name: /7\. Mockups/ }));
  return screen.getByRole('form', { name: 'Mockups' });
}

function tick(form: HTMLElement, name: string) {
  fireEvent.click(within(form).getByRole('checkbox', { name }));
}

describe('Mockups – the page', () => {
  it('shows the default mockups, named for screen readers, under the Cover title (scenarios 1 and 14)', () => {
    renderApp();
    typeTitle('My Brand');
    expect(mockupsOnPage()).toEqual(DEFAULT_NAMES.map((name) => `${name} mockup`));
    expect(within(page()).getByText('My Brand')).toBeInTheDocument();
    expect(within(page()).getByText('Mockups')).toBeInTheDocument();
    // Captions too
    for (const name of DEFAULT_NAMES) expect(within(page()).getByText(name)).toBeInTheDocument();
  });

  it('shows a dashed box where the logo goes until a logo is applied (scenario 11)', () => {
    renderApp();
    const boxes = page().querySelectorAll('.mockup-logo-placeholder');
    expect(boxes).toHaveLength(DEFAULT_NAMES.length);
    expect(page().querySelector('image')).toBeNull();
  });

  it('shows the Cover logo once it is applied, as no version has an image (scenario 9)', () => {
    renderApp();
    uploadLogo();
    fireEvent.click(screen.getByRole('button', { name: 'Apply Logo' }));
    const images = [...page().querySelectorAll('image')].map((image) => image.getAttribute('href'));
    expect(images).toEqual(DEFAULT_NAMES.map(() => 'blob:logo.png'));
  });

  it('asks to choose mockups when none is ticked (scenario 13)', () => {
    renderApp();
    const form = openMockups();
    for (const name of DEFAULT_NAMES) tick(form, name);
    expect(within(page()).getByText('Choose mockups in the Mockups section')).toBeInTheDocument();
  });
});

describe('Mockups – the section', () => {
  it('lists the products by group, ticks the defaults and features its page (scenario 2)', () => {
    renderApp();
    const form = openMockups();
    expect(screen.getAllByRole('article')[0]).toHaveAccessibleName('Mockups');
    for (const product of MOCKUP_PRODUCTS) {
      const box = within(form).getByRole('checkbox', { name: product.name });
      expect(box).toHaveProperty('checked', DEFAULT_MOCKUPS.chosen.includes(product.id));
    }
    expect(within(form).getByText('Stationery')).toBeInTheDocument();
    // The small drawings are decoration: the only images in the form are none
    expect(within(form).queryAllByRole('img')).toHaveLength(0);
    // Every block starts folded
    const headers = within(form).getAllByRole('button', { expanded: false });
    expect(headers.map((header) => header.textContent)).toEqual(expect.arrayContaining(DEFAULT_NAMES));
  });

  it('keeps the order of the list and opens the block of a ticked product (scenario 4)', () => {
    renderApp();
    const form = openMockups();
    tick(form, 'Business card');
    tick(form, 'Business card');
    expect(mockupsOnPage()[0]).toBe('Business card mockup');
    expect(within(form).getByRole('button', { name: 'Business card', expanded: true })).toBeInTheDocument();
  });

  it('paints one product with a new color (scenario 5)', () => {
    renderApp();
    const form = openMockups();
    fireEvent.click(within(form).getByRole('button', { name: 'T-shirt' }));
    fireEvent.change(within(form).getByRole('textbox', { name: 'T-shirt product color HEX' }), {
      target: { value: '#1A237E' },
    });
    const fills = (name: string) =>
      [...within(page()).getByRole('img', { name: `${name} mockup` }).querySelectorAll('path')].map((path) =>
        path.getAttribute('fill'),
      );
    expect(fills('T-shirt')).toContain('#1A237E');
    expect(fills('Mug')).not.toContain('#1A237E');
  });

  it('copies a palette color with its chip (scenario 7)', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /4\. Colors/ })); // the palette starts with Black
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }));
    const form = openMockups();
    fireEvent.click(within(form).getByRole('button', { name: 'Mug' }));
    fireEvent.click(within(form).getByRole('button', { name: 'Mug product color: use Color 1' }));
    const mug = within(page()).getByRole('img', { name: 'Mug mockup' });
    expect([...mug.querySelectorAll('path')].map((path) => path.getAttribute('fill'))).toContain('#000000');
  });

  it('offers the Primary in the Logo select when the Logo section is empty', () => {
    renderApp();
    const form = openMockups();
    const select = within(form).getByRole('combobox', { name: 'Mug logo' });
    expect(within(select).getAllByRole('option').map((option) => option.textContent)).toEqual(['Primary']);
  });
});

describe('Mockups – with the rest of the manual', () => {
  it('keeps the page in Template 3 and Landscape (scenario 15)', () => {
    renderApp();
    fireEvent.click(screen.getByRole('radio', { name: 'Template 3' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Landscape' }));
    expect(page()).toHaveAttribute('data-orientation', 'landscape');
    expect(page().querySelector('.mockups-layout .logo-page-header')).not.toBeNull();
    expect(mockupsOnPage()).toHaveLength(DEFAULT_NAMES.length);
  });

  it('is the 8th page of the PDF (scenario 16)', async () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'Download web PDF' }));
    fireEvent.click(screen.getByRole('button', { name: 'Download anyway' }));
    const mock = createPdf as jest.MockedFunction<typeof createPdf>;
    await waitFor(() => expect(mock).toHaveBeenCalled(), { timeout: 5000 });
    const pages = mock.mock.calls[0][0];
    expect(pages).toHaveLength(10);
    expect(pages[9]).toHaveAccessibleName('Mockups');
    expect(within(pages[9]).getAllByRole('img', { hidden: true })).toHaveLength(DEFAULT_NAMES.length);
  });
});
