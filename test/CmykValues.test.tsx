import { screen, fireEvent, within, waitFor } from '@testing-library/react';
import { renderApp } from './renderApp';
import { setCmykServerUrl } from './cmykServerUrlMock';
import { fetchCmykColors } from '../src/export/cmykClient';
import type { Cmyk } from '../src/data/colorPalette';

jest.mock('../src/export/cmykClient', () => ({ fetchCmykColors: jest.fn() }));
const fetchColors = fetchCmykColors as jest.MockedFunction<typeof fetchCmykColors>;

const PROFILE = { id: 'FOGRA39', name: 'ISO Coated v2 (ECI)' };
// What the FOGRA39 server gives for the two swatches these tests pick
const SERVER_VALUES: Record<string, Cmyk> = {
  '#1E88E5': { c: 76, m: 42, y: 0, k: 0 },
  '#000000': { c: 89, m: 78, y: 62, k: 97 },
  '#FFFFFF': { c: 0, m: 0, y: 0, k: 0 },
};

function answerWith(values: Record<string, Cmyk>) {
  return async (_server: string, hexes: string[]) => ({
    profile: PROFILE,
    colors: hexes.map((hex) => ({ hex, cmyk: values[hex] })),
  });
}

function getColorsForm() {
  return screen.getByRole('form', { name: 'Colors' });
}

function getPalettePage() {
  const preview = screen.getByRole('region', { name: 'Manual preview' });
  return within(preview).getByRole('article', { name: 'Color palette' });
}

function pickBlue(n: number) {
  const group = within(getColorsForm()).getByRole('group', { name: `Color ${n}` });
  fireEvent.click(within(group).getByRole('radio', { name: 'Blue' }));
}

function formValues() {
  return getColorsForm().querySelector('.palette-block[data-open="true"] .palette-block-values')!.textContent;
}

function pageLabels() {
  return [...getPalettePage().querySelectorAll('.palette-label')].map((label) => label.textContent).filter((text) => text?.startsWith('CMYK'));
}

beforeEach(() => {
  fetchColors.mockReset();
  setCmykServerUrl('http://cmyk.test');
});
afterEach(() => setCmykServerUrl(null));

// Spec: specs/colorpalette.md, Scenario 12 — Profile Values
describe('CMYK values – from the server', () => {
  it('shows the profile values in the form and on the page, and names the profile', async () => {
    fetchColors.mockImplementation(answerWith(SERVER_VALUES));
    renderApp();

    pickBlue(1);

    // Approximate until the server answers
    expect(formValues()).toContain('CMYK ≈ 87, 41, 0, 10');
    await waitFor(() => expect(formValues()).toContain('CMYK 76, 42, 0, 0'));
    const page = within(getPalettePage());
    expect(page.getByText('76, 42, 0, 0')).toBeInTheDocument();
    expect(pageLabels()).toEqual(['CMYK']);
    expect(page.getByText('CMYK values for ISO Coated v2 (ECI)')).toBeInTheDocument();
    expect(fetchColors).toHaveBeenLastCalledWith('http://cmyk.test', ['#1E88E5']);
  });

  it('asks once after the colors stop changing, and never twice for the same color', async () => {
    fetchColors.mockImplementation(answerWith(SERVER_VALUES));
    renderApp();
    const group = within(getColorsForm()).getByRole('group', { name: 'Color 1' });

    fireEvent.click(within(group).getByRole('radio', { name: 'White' }));
    fireEvent.click(within(group).getByRole('radio', { name: 'Blue' }));
    await waitFor(() => expect(formValues()).toContain('CMYK 76, 42, 0, 0'));
    expect(fetchColors.mock.calls.flatMap(([, hexes]) => hexes)).not.toContain('#FFFFFF');

    fireEvent.click(within(group).getByRole('radio', { name: 'Black' }));
    await waitFor(() => expect(formValues()).toContain('CMYK 89, 78, 62, 97'));
    fireEvent.click(within(group).getByRole('radio', { name: 'Blue' }));
    expect(formValues()).toContain('CMYK 76, 42, 0, 0'); // kept from before, at once
    await new Promise((wait) => setTimeout(wait, 400));
    expect(fetchColors.mock.calls.flatMap(([, hexes]) => hexes).filter((hex) => hex === '#1E88E5')).toHaveLength(1);
  });
});

// Spec: specs/colorpalette.md, Scenario 13 — Mixed Sources
describe('CMYK values – mixed sources', () => {
  it('keeps the approximate note while one color is still approximate', async () => {
    fetchColors.mockImplementationOnce(answerWith(SERVER_VALUES)).mockImplementation(() => new Promise(() => {}));
    renderApp();
    pickBlue(1);
    await waitFor(() => expect(pageLabels()).toEqual(['CMYK']));

    fireEvent.click(within(getColorsForm()).getByRole('button', { name: 'Add color' }));

    await waitFor(() => expect(pageLabels()).toEqual(['CMYK', 'CMYK ≈']));
    expect(within(getPalettePage()).getByText('CMYK values are approximate')).toBeInTheDocument();
  });
});

// Spec: specs/colorpalette.md, Scenario 14 — The Server Fails
describe('CMYK values – the server fails', () => {
  it('stays approximate, with no error', async () => {
    fetchColors.mockRejectedValue(new Error('unreachable'));
    renderApp();

    pickBlue(1);

    await waitFor(() => expect(fetchColors).toHaveBeenCalled());
    await new Promise((wait) => setTimeout(wait, 50));
    expect(formValues()).toContain('CMYK ≈ 87, 41, 0, 10');
    expect(pageLabels()).toEqual(['CMYK ≈']);
    expect(within(getPalettePage()).getByText('CMYK values are approximate')).toBeInTheDocument();
    expect(within(getColorsForm()).queryByRole('alert')).not.toBeInTheDocument();
  });
});

// Spec: specs/cmykserver.md, Section 1 — without a server the app works as before
describe('CMYK values – no server', () => {
  it('never calls the client', async () => {
    setCmykServerUrl(null);
    renderApp();

    pickBlue(1);

    await new Promise((wait) => setTimeout(wait, 400));
    expect(fetchColors).not.toHaveBeenCalled();
    expect(formValues()).toContain('CMYK ≈ 87, 41, 0, 10');
  });
});
