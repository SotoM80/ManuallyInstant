import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { typeTitle } from './coverForm';
import { MANUAL_PAGES } from '../src/data/manualSections';
import { ColorPalettePage } from '../src/components/pages/ColorPalettePage';
import { createPdf } from '../src/export/createPdf';

// Spec: specs/export.md. jsdom cannot draw pages, so the drawing is mocked (ADR 0012) and the
// tests check which pages, settings and file name it gets.
jest.mock('../src/export/createPdf', () => ({ createPdf: jest.fn() }));

// Each test fills the whole app before exporting, which takes a few seconds when the suites
// run side by side
jest.setTimeout(20000);
const mockCreatePdf = createPdf as jest.MockedFunction<typeof createPdf>;

beforeEach(() => {
  mockCreatePdf.mockReset();
  mockCreatePdf.mockImplementation(async (pages, _kind, _orientation, _name, onProgress) => {
    pages.forEach((_, i) => onProgress?.(i + 1));
  });
});

function sectionsColumn() {
  return screen.getByRole('region', { name: 'Manual sections' });
}

function touchEverySection() {
  typeTitle('My Brand');
  fireEvent.change(screen.getByLabelText('Brand name'), { target: { value: 'My Brand' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add color' }));
  const typography = screen.getByRole('form', { name: 'Typography' });
  fireEvent.change(within(typography).getByRole('combobox', { name: 'Primary font' }), { target: { value: 'Inter' } });
  fireEvent.click(within(typography).getByRole('option', { name: 'Inter' }));
}

describe('Export – buttons', () => {
  it('shows the two downloads before Apply (scenario 1)', () => {
    renderApp();
    const names = within(sectionsColumn())
      .getAllByRole('button')
      .slice(0, 3)
      .map((button) => button.getAttribute('aria-label') ?? button.textContent);
    expect(names).toEqual(['Download print PDF', 'Download web PDF', 'Apply']);
    expect(screen.getByRole('button', { name: 'Download print PDF' })).toBeEnabled();
  });

  it('makes a print PDF of every page, in natural order (scenarios 2 and 6)', async () => {
    renderApp();
    touchEverySection();
    fireEvent.click(screen.getByRole('button', { name: /4\. Typography/ })); // its page comes first
    fireEvent.click(screen.getByRole('button', { name: 'Download print PDF' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await waitFor(() => expect(mockCreatePdf).toHaveBeenCalledTimes(1), { timeout: 5000 });
    const [pages, kind, orientation, name] = mockCreatePdf.mock.calls[0];
    expect(pages.map((page) => page.getAttribute('aria-label'))).toEqual(MANUAL_PAGES);
    expect([kind, orientation, name]).toEqual(['print', 'portrait', 'my-brand-print.pdf']);
  });

  it('makes the web PDF in Landscape (scenarios 3 and 7)', async () => {
    renderApp();
    touchEverySection();
    fireEvent.click(screen.getByRole('radio', { name: 'Landscape' }));
    fireEvent.click(screen.getByRole('button', { name: 'Download web PDF' }));
    await waitFor(() => expect(mockCreatePdf).toHaveBeenCalledTimes(1), { timeout: 5000 });
    const [pages, kind, orientation, name] = mockCreatePdf.mock.calls[0];
    expect([kind, orientation, name]).toEqual(['web', 'landscape', 'my-brand-web.pdf']);
    expect(pages.every((page) => page.dataset.orientation === 'landscape')).toBe(true);
  });

  it('warns about empty sections first (scenario 4)', async () => {
    renderApp();
    typeTitle('My Brand');
    fireEvent.click(screen.getByRole('button', { name: 'Download web PDF' }));
    const warning = screen.getByRole('alertdialog', { name: 'Empty pages' });
    expect(warning).toHaveTextContent('Some pages are still empty: Logo, Colors, Typography.');
    fireEvent.click(within(warning).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(mockCreatePdf).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Download web PDF' }));
    fireEvent.click(screen.getByRole('button', { name: 'Download anyway' }));
    await waitFor(() => expect(mockCreatePdf).toHaveBeenCalledTimes(1), { timeout: 5000 });
  });

  it('disables both buttons while a PDF is made (scenario 8)', async () => {
    let finish: () => void = () => {};
    mockCreatePdf.mockImplementation(async (_pages, _kind, _orientation, _name, onProgress) => {
      onProgress?.(3);
      await new Promise<void>((done) => (finish = done));
    });
    renderApp();
    touchEverySection();
    fireEvent.click(screen.getByRole('button', { name: 'Download print PDF' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Download print PDF' })).toHaveTextContent('Creating… 3/7'), {
      timeout: 5000, // the copy waits until it is drawn before the first page
    });
    expect(screen.getByRole('button', { name: 'Download web PDF' })).toBeDisabled();
    finish();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Download print PDF' })).toBeEnabled(), { timeout: 5000 });
    expect(screen.getByRole('button', { name: 'Download print PDF' })).toHaveTextContent('↓ Print PDF');
  });

  it('says so when the PDF fails (scenario 9)', async () => {
    mockCreatePdf.mockRejectedValue(new Error('font failed'));
    renderApp();
    touchEverySection();
    fireEvent.click(screen.getByRole('button', { name: 'Download web PDF' }));
    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent('The PDF could not be created. Try again.');
    expect(screen.getByRole('button', { name: 'Download web PDF' })).toBeEnabled();
  });

  it('draws the guides but not their bands, and no copy is left behind (scenario 10)', async () => {
    let pagesSeen: HTMLElement[] = [];
    mockCreatePdf.mockImplementation(async (pages) => {
      pagesSeen = pages;
      expect(pages.some((page) => page.querySelector('.construction-grid-band, .construction-grid-hit'))).toBe(false);
    });
    renderApp();
    touchEverySection();
    fireEvent.click(screen.getByRole('button', { name: 'Download print PDF' }));
    await waitFor(() => expect(pagesSeen).toHaveLength(MANUAL_PAGES.length), { timeout: 5000 });
    await waitFor(() => expect(document.querySelector('.manual-export')).toBeNull());
  });
});

describe('Export – highlighted values (scenario 5)', () => {
  const palette = [{ id: 0, name: 'Navy', hex: '#1A237E' }];

  function rows(container: HTMLElement) {
    return [...container.querySelectorAll('.palette-values > span')].map((row) => [
      row.querySelector('.palette-label')!.textContent,
      row.getAttribute('data-strength'),
    ]);
  }

  it('lists CMYK first and highlighted for print', () => {
    const { container } = render(<ColorPalettePage palette={palette} color="#000000" emphasis="print" />);
    expect(rows(container)).toEqual([
      ['CMYK ≈', 'strong'],
      ['HEX', 'soft'],
      ['RGB', 'soft'],
    ]);
  });

  it('highlights HEX and RGB for the web, with CMYK last', () => {
    const { container } = render(<ColorPalettePage palette={palette} color="#000000" emphasis="web" />);
    expect(rows(container)).toEqual([
      ['HEX', 'strong'],
      ['RGB', 'strong'],
      ['CMYK ≈', 'soft'],
    ]);
  });

  it('highlights nothing in the preview', () => {
    const { container } = render(<ColorPalettePage palette={palette} color="#000000" />);
    expect(rows(container)).toEqual([
      ['HEX', null],
      ['RGB', null],
      ['CMYK ≈', null],
    ]);
  });
});
