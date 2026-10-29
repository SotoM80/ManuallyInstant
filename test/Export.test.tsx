import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { typeTitle } from './coverForm';
import { MANUAL_PAGES } from '../src/data/manualSections';
import { ColorPalettePage } from '../src/components/pages/ColorPalettePage';
import { createCmykPdf, createPdf } from '../src/export/createPdf';
import { checkServer, CmykServerError, fetchCmykColors } from '../src/export/cmykClient';
import { setCmykServerUrl } from './cmykServerUrlMock';

// Spec: specs/export.md. jsdom cannot draw pages, so the drawing is mocked (ADR 0012) and the
// tests check which pages, settings and file name it gets. The CMYK server is mocked too; its
// errors stay real, since the buttons tell them apart.
jest.mock('../src/export/createPdf', () => ({ createPdf: jest.fn(), createCmykPdf: jest.fn() }));
jest.mock('../src/export/cmykClient', () => ({
  ...jest.requireActual('../src/export/cmykClient'),
  checkServer: jest.fn(),
  fetchCmykColors: jest.fn(),
}));

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
  // Searched inside each form: label queries over the whole app are slow (see coverForm.ts)
  const logo = within(screen.getByRole('form', { name: 'Logo' }));
  fireEvent.change(logo.getByLabelText('Brand name'), { target: { value: 'My Brand' } });
  const usage = within(screen.getByRole('form', { name: 'Usage' }));
  fireEvent.change(usage.getByLabelText('Correct use example 1 description'), { target: { value: 'On white' } });
  fireEvent.change(usage.getByLabelText('Incorrect use example 1 description'), { target: { value: "Don't stretch" } });
  fireEvent.click(screen.getByRole('button', { name: 'Add color' }));
  const typography = screen.getByRole('form', { name: 'Typography' });
  fireEvent.change(within(typography).getByRole('combobox', { name: 'Primary font' }), { target: { value: 'Inter' } });
  fireEvent.click(within(typography).getByRole('option', { name: 'Inter' }));
}

describe('Export – buttons', () => {
  it('shows the two downloads first in the sections column (scenario 1)', () => {
    renderApp();
    const names = within(sectionsColumn())
      .getAllByRole('button')
      .slice(0, 3)
      .map((button) => button.getAttribute('aria-label') ?? button.textContent);
    expect(names).toEqual(['Download print PDF', 'Download web PDF', '1. Cover']);
    expect(screen.getByRole('button', { name: 'Download print PDF' })).toBeEnabled();
  });

  it('makes a print PDF of every page, in natural order (scenarios 2 and 6)', async () => {
    renderApp();
    touchEverySection();
    fireEvent.click(screen.getByRole('button', { name: /5\. Typography/ })); // its page comes first
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
    expect(warning).toHaveTextContent('Some pages are still empty: Logo, Usage, Colors, Typography.');
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
    await waitFor(() => expect(screen.getByRole('button', { name: 'Download print PDF' })).toHaveTextContent('Creating… 3/10'), {
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

// Spec: specs/export.md, "The print PDF with a CMYK server" (Scenarios 12–16)
describe('Export – the print PDF with a CMYK server', () => {
  const mockCreateCmykPdf = createCmykPdf as jest.MockedFunction<typeof createCmykPdf>;
  const mockCheckServer = checkServer as jest.MockedFunction<typeof checkServer>;
  const mockFetchColors = fetchCmykColors as jest.MockedFunction<typeof fetchCmykColors>;
  const PROFILE = { id: 'FOGRA39', name: 'ISO Coated v2 (ECI)' };

  beforeEach(() => {
    setCmykServerUrl('http://cmyk.test');
    mockCreateCmykPdf.mockReset().mockResolvedValue(undefined);
    mockCheckServer.mockReset().mockResolvedValue({ profile: PROFILE });
    mockFetchColors.mockReset().mockImplementation(async (_server, hexes) => ({
      profile: PROFILE,
      colors: hexes.map((hex) => ({ hex, cmyk: { c: 1, m: 2, y: 3, k: 4 } })),
    }));
  });
  afterEach(() => setCmykServerUrl(null));

  function dialog() {
    return screen.queryByRole('alertdialog', { name: 'CMYK server unavailable' });
  }

  it('draws, then converts, every page (Scenario 12)', async () => {
    let finish: () => void = () => {};
    mockCreateCmykPdf.mockImplementation(async (_pages, _orientation, _name, _server, onStep) => {
      onStep?.({ phase: 'drawing', done: 3 });
      onStep?.({ phase: 'converting', done: 3 });
      await new Promise<void>((done) => (finish = done));
    });
    renderApp();
    touchEverySection();
    fireEvent.click(screen.getByRole('button', { name: 'Download print PDF' }));

    await waitFor(
      () => expect(screen.getByRole('button', { name: 'Download print PDF' })).toHaveTextContent('Converting to CMYK… 3/10'),
      { timeout: 5000 },
    );
    expect(screen.getByRole('button', { name: 'Download web PDF' })).toBeDisabled();
    const [pages, orientation, name, server] = mockCreateCmykPdf.mock.calls[0];
    expect(pages.map((page) => page.getAttribute('aria-label'))).toEqual(MANUAL_PAGES);
    expect([orientation, name, server]).toEqual(['portrait', 'my-brand-print.pdf', 'http://cmyk.test']);
    expect(mockCreatePdf).not.toHaveBeenCalled();
    finish();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Download print PDF' })).toHaveTextContent('↓ Print PDF'));
  });

  it('offers the RGB PDF when the server cannot be reached, before drawing anything (Scenario 13)', async () => {
    mockCheckServer.mockRejectedValue(new CmykServerError('unreachable', 'no answer'));
    renderApp();
    touchEverySection();
    fireEvent.click(screen.getByRole('button', { name: 'Download print PDF' }));

    const offer = await screen.findByRole('alertdialog', { name: 'CMYK server unavailable' }, { timeout: 5000 });
    expect(offer).toHaveTextContent('The CMYK server cannot be reached, so the print PDF cannot be made in CMYK. Download it in RGB instead?');
    expect(mockCreateCmykPdf).not.toHaveBeenCalled();
    expect(mockCreatePdf).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Download print PDF' })).toBeEnabled();

    fireEvent.click(within(offer).getByRole('button', { name: 'Cancel' }));
    expect(dialog()).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Download print PDF' }));
    fireEvent.click(within(await screen.findByRole('alertdialog', {}, { timeout: 5000 })).getByRole('button', { name: 'Download RGB PDF' }));
    await waitFor(() => expect(mockCreatePdf).toHaveBeenCalledTimes(1), { timeout: 5000 });
    expect(mockCreatePdf.mock.calls[0].slice(1, 4)).toEqual(['print', 'portrait', 'my-brand-print.pdf']);
    expect(dialog()).not.toBeInTheDocument();
  });

  it('makes no PDF when the server stops during the export (Scenario 14)', async () => {
    mockCreateCmykPdf.mockRejectedValue(new CmykServerError('unreachable', 'gone on page 4'));
    renderApp();
    touchEverySection();
    fireEvent.click(screen.getByRole('button', { name: 'Download print PDF' }));

    expect(await screen.findByRole('alertdialog', { name: 'CMYK server unavailable' }, { timeout: 5000 })).toBeInTheDocument();
    expect(mockCreatePdf).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Download print PDF' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Download web PDF' })).toBeEnabled();
  });

  it('shows the usual failure when the server refuses a page', async () => {
    mockCreateCmykPdf.mockRejectedValue(new CmykServerError('rejected', 'The page is larger than 40 MB.'));
    renderApp();
    touchEverySection();
    fireEvent.click(screen.getByRole('button', { name: 'Download print PDF' }));

    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent('The PDF could not be created. Try again.');
    expect(dialog()).not.toBeInTheDocument();
  });

  it('never uses the server for the web PDF (Scenario 15)', async () => {
    renderApp();
    touchEverySection();
    fireEvent.click(screen.getByRole('button', { name: 'Download web PDF' }));

    await waitFor(() => expect(mockCreatePdf).toHaveBeenCalledTimes(1), { timeout: 5000 });
    expect(mockCreatePdf.mock.calls[0][1]).toBe('web');
    expect(mockCheckServer).not.toHaveBeenCalled();
    expect(mockCreateCmykPdf).not.toHaveBeenCalled();
  });

  it('puts the profile values on the Color palette page before drawing it (Scenario 16)', async () => {
    let palettePage: HTMLElement | undefined;
    mockCreateCmykPdf.mockImplementation(async (pages) => {
      palettePage = pages.find((page) => page.getAttribute('aria-label') === 'Color palette');
    });
    renderApp();
    touchEverySection();
    fireEvent.click(screen.getByRole('button', { name: 'Download print PDF' }));

    await waitFor(() => expect(palettePage).toBeDefined(), { timeout: 5000 });
    const labels = [...palettePage!.querySelectorAll('.palette-label')].map((label) => label.textContent);
    expect(labels.filter((label) => label?.startsWith('CMYK'))).toEqual(['CMYK', 'CMYK']);
    expect(palettePage).toHaveTextContent('1, 2, 3, 4');
    expect(palettePage).toHaveTextContent('CMYK values for ISO Coated v2 (ECI)');
  });
});
