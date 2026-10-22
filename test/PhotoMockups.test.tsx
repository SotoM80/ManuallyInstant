import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { uploadLogo } from './coverForm';
import { renderPhotoMockup } from '../src/mockups/render/renderPhotoMockup';
import { createPdf } from '../src/export/createPdf';

// Spec: specs/mockups.md, Photo mockups (ADR 0014). jsdom has no WebGL: the renderer is mocked,
// and the tests check what it is asked to draw and what the page shows.
jest.mock('../src/mockups/render/renderPhotoMockup', () => ({ renderPhotoMockup: jest.fn() }));
jest.mock('../src/export/createPdf', () => ({ createPdf: jest.fn(async () => {}) }));
jest.setTimeout(20000);

const render = renderPhotoMockup as jest.MockedFunction<typeof renderPhotoMockup>;
const PHOTO = 'Business card (photo)';

beforeEach(() => {
  render.mockReset();
  render.mockImplementation(async (input) => `data:image/jpeg;base64,${input.color}`);
});

function page() {
  return screen.getByRole('article', { name: 'Mockups' });
}

function openMockups() {
  fireEvent.click(screen.getByRole('button', { name: /7\. Mockups/ }));
  return screen.getByRole('form', { name: 'Mockups' });
}

function lastInput() {
  return render.mock.lastCall![0];
}

describe('Photo mockups (phase 1)', () => {
  it('shows "Preparing…", then the composed photo, with its Photo tag in the list (scenario 17)', async () => {
    // The page and the open block's preview both ask for it: finish every one asked so far
    const pending: ((url: string) => void)[] = [];
    const finish = (url: string) => pending.splice(0).forEach((done) => done(url));
    render.mockImplementation(() => new Promise((done) => pending.push(done)));
    renderApp();
    const form = openMockups();
    expect(within(form).getByText(PHOTO).closest('label')).toHaveTextContent('Photo');
    fireEvent.click(within(form).getByRole('checkbox', { name: new RegExp(`^${PHOTO.replace(/[()]/g, '\\$&')}`) }));
    expect(within(page()).getByText('Preparing…')).toBeInTheDocument();
    await act(async () => finish('data:image/jpeg;base64,card'));
    expect(within(page()).getByRole('img', { name: `${PHOTO} mockup` })).toHaveAttribute('src', 'data:image/jpeg;base64,card');
  });

  function tickPhoto() {
    const form = openMockups();
    fireEvent.click(within(form).getByRole('checkbox', { name: /^Business card \(photo\)/ }));
    return form;
  }

  it('asks the renderer for the product color and a dashed box until there is a logo (scenarios 11 and 18)', async () => {
    renderApp();
    const form = tickPhoto();
    await waitFor(() => expect(within(page()).getByRole('img', { name: `${PHOTO} mockup` })).toBeInTheDocument());
    expect(lastInput()).toMatchObject({ color: '#FFFFFF', logoUrl: null, blend: 'printed' });
    expect(page().querySelector('.photo-mockup-placeholder')).not.toBeNull();

    fireEvent.change(within(form).getByRole('textbox', { name: `${PHOTO} product color HEX` }), { target: { value: '#1A237E' } });
    await waitFor(() => expect(lastInput()).toMatchObject({ color: '#1A237E' }));
  });

  it('sends the size, rotation and blend, and Reset puts the logo back (scenarios 19 and 20)', async () => {
    renderApp();
    uploadLogo();
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    const form = tickPhoto();
    fireEvent.change(within(form).getByRole('slider', { name: 'Size' }), { target: { value: '60' } });
    fireEvent.change(within(form).getByRole('slider', { name: 'Rotation' }), { target: { value: '10' } });
    fireEvent.change(within(form).getByRole('combobox', { name: `${PHOTO} blend` }), { target: { value: 'solid' } });
    await waitFor(() =>
      expect(lastInput()).toMatchObject({
        logoUrl: 'blob:logo.png',
        placement: { x: 0, y: 0, scale: 0.6, rotate: 10 },
        blend: 'solid',
      }),
    );
    fireEvent.click(within(form).getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(lastInput().placement).toEqual({ x: 0, y: 0, scale: 1, rotate: 0 }));
  });

  it('moves the logo with the arrow keys, never out of its area', async () => {
    renderApp();
    uploadLogo();
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    const form = tickPhoto();
    fireEvent.change(within(form).getByRole('slider', { name: 'Size' }), { target: { value: '40' } });
    const handle = within(form).getByRole('slider', { name: `Move the logo on the ${PHOTO}` });
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    await waitFor(() => expect(lastInput().placement.x).toBeCloseTo(0.02), { timeout: 5000 });
    for (let i = 0; i < 60; i++) fireEvent.keyDown(handle, { key: 'ArrowRight' });
    // A 40 % square logo in a 2:1 area can move (1 − 0.2) / 2 = 0.4 across at most
    await waitFor(() => expect(lastInput().placement.x).toBeCloseTo(0.4), { timeout: 5000 });
  });

  it('says so when the mockup cannot be drawn, and the page keeps working (scenario 25)', async () => {
    render.mockRejectedValue(new Error('No WebGL'));
    renderApp();
    tickPhoto();
    expect(await within(page()).findByText('This mockup could not be drawn')).toBeInTheDocument();
    expect(within(page()).getByRole('img', { name: 'T-shirt mockup' })).toBeInTheDocument();
  });

  it('makes the PDF wait until the photo mockups are drawn (scenario 26)', async () => {
    const pending: ((url: string) => void)[] = [];
    const finish = (url: string) => pending.splice(0).forEach((done) => done(url));
    renderApp();
    tickPhoto();
    await waitFor(() => expect(within(page()).getByRole('img', { name: `${PHOTO} mockup` })).toBeInTheDocument());
    // The PDF copy draws it at the same size, from the cache in the app; here, a slow one
    render.mockImplementation(() => new Promise((done) => pending.push(done)));
    fireEvent.click(screen.getByRole('button', { name: 'Download print PDF' }));
    fireEvent.click(screen.getByRole('button', { name: 'Download anyway' }));
    const pdf = createPdf as jest.MockedFunction<typeof createPdf>;
    await new Promise((done) => setTimeout(done, 600));
    expect(pdf).not.toHaveBeenCalled();
    await act(async () => finish('data:image/jpeg;base64,late'));
    await waitFor(() => expect(pdf).toHaveBeenCalled(), { timeout: 5000 });
    const mockupsPage = pdf.mock.calls[0][0][9];
    expect(within(mockupsPage).getByRole('img', { name: `${PHOTO} mockup`, hidden: true })).toHaveAttribute(
      'src',
      'data:image/jpeg;base64,late',
    );
  });
});
