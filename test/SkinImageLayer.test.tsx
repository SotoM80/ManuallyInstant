import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { makeLogo } from './coverForm';
import { createPdf } from '../src/export/createPdf';
import { skinPicturesReady } from '../src/export/skinPictures';

// Spec: specs/skins.md, "Image layers" (scenarios 28–35, ADR 0023). jsdom loads no pictures and
// draws no pages, so the picture check and the PDF are mocked.
jest.mock('../src/export/createPdf', () => ({ createPdf: jest.fn(async () => {}), createCmykPdf: jest.fn() }));
jest.mock('../src/export/skinPictures', () => ({ skinPicturesReady: jest.fn(async () => {}) }));
jest.setTimeout(20000);

function openSkin() {
  fireEvent.click(screen.getByRole('button', { name: /6\. Skin/ }));
  return within(screen.getByRole('form', { name: 'Skin' }));
}

function add(form: ReturnType<typeof openSkin>, preset: string) {
  fireEvent.click(form.getByRole('button', { name: '+ Add layer' }));
  fireEvent.click(form.getByRole('button', { name: `Add ${preset}` }));
}

function choose(form: ReturnType<typeof openSkin>, file: File, name = 'Image') {
  fireEvent.change(form.getByLabelText(`${name} image`, { selector: 'input' }), { target: { files: [file] } });
}

// The picture drawn on a page, if any
function picture(page = 'Brand concept') {
  return screen.getByRole('article', { name: page }).querySelector('svg.skin-layer image');
}

function withPicture() {
  renderApp();
  const form = openSkin();
  add(form, 'Image');
  choose(form, makeLogo('paper.jpg', 'image/jpeg'));
  fireEvent.click(form.getByRole('button', { name: 'Apply Image image' }));
  return form;
}

describe('Skin – Image layers', () => {
  // Scenario 28
  it('adds an Image layer with a picture field, Fit and Intensity, and no colors', () => {
    renderApp();
    const form = openSkin();

    add(form, 'Image');

    expect(form.getByRole('button', { name: 'Apply Image image' })).toBeDisabled();
    expect(form.getByRole('radio', { name: 'Cover' })).toBeChecked();
    expect(form.getByLabelText('Intensity')).toHaveValue('30');
    expect(form.queryByRole('textbox', { name: 'Image Color A HEX' })).not.toBeInTheDocument();
    expect(form.getByRole('listitem').querySelector('.skin-image-icon')).toBeInTheDocument();
    expect(picture()).toBeNull();
  });

  // Scenario 29
  it('draws the picture on every inner page only after its Apply', () => {
    renderApp();
    const form = openSkin();
    add(form, 'Image');
    choose(form, makeLogo('paper.jpg', 'image/jpeg'));
    expect(picture()).toBeNull();

    fireEvent.click(form.getByRole('button', { name: 'Apply Image image' }));

    for (const page of ['Brand concept', 'Logo versions', 'Typography']) {
      expect(picture(page)).toHaveAttribute('href', 'blob:paper.jpg');
      expect(picture(page)!.closest('g')).toHaveAttribute('opacity', '0.3');
    }
    expect(picture('Cover')).toBeNull();
    expect(form.getByRole('button', { name: 'Apply Image image' })).toBeDisabled();
    expect(form.getByRole('listitem').querySelector('.skin-image-icon')).toBeNull();
  });

  // Scenario 30
  it('fills the page with Cover and shows it whole with Contain', () => {
    const form = withPicture();
    expect(picture()).toHaveAttribute('preserveAspectRatio', 'xMidYMid slice');

    fireEvent.click(form.getByRole('radio', { name: 'Contain' }));

    expect(picture()).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
  });

  // Scenario 31
  it('flags a wrong file and keeps the picture it had', () => {
    const form = withPicture();

    choose(form, makeLogo('brief.pdf', 'application/pdf'));

    expect(form.getByText('Use a PNG, JPG, SVG or WebP image')).toBeInTheDocument();
    expect(form.getByRole('button', { name: 'Apply Image image' })).toBeDisabled();
    expect(picture()).toHaveAttribute('href', 'blob:paper.jpg');
  });

  // Scenario 32
  it('draws the picture on the Cover too when asked', () => {
    const form = withPicture();

    fireEvent.click(form.getByRole('checkbox', { name: 'Also on the Cover' }));

    expect(picture('Cover')).toHaveAttribute('href', 'blob:paper.jpg');
  });

  // Scenario 33
  it('keeps both pictures while hidden, and drops them when removed', () => {
    const form = withPicture();
    choose(form, makeLogo('linen.jpg', 'image/jpeg'));

    fireEvent.click(form.getByRole('checkbox', { name: 'Show Image' }));
    expect(picture()).toBeNull();

    fireEvent.click(form.getByRole('checkbox', { name: 'Show Image' }));
    expect(picture()).toHaveAttribute('href', 'blob:paper.jpg');
    expect(form.getByRole('button', { name: 'Apply Image image' })).toBeEnabled();

    fireEvent.click(form.getByRole('button', { name: 'Remove Image' }));
    expect(form.queryByRole('list', { name: 'Layers' })).not.toBeInTheDocument();
    expect(picture()).toBeNull();
  });

  // Scenario 34
  it('counts for the 4 layers', () => {
    renderApp();
    const form = openSkin();
    add(form, 'Dots');
    add(form, 'Grain');
    add(form, 'Linear');

    add(form, 'Image');

    expect(form.getAllByRole('listitem')).toHaveLength(4);
    expect(form.getByRole('button', { name: '+ Add layer' })).toBeDisabled();
  });

  // Scenario 35
  it('makes no PDF when a picture of the Skin cannot be read', async () => {
    (skinPicturesReady as jest.Mock).mockRejectedValueOnce(new Error('A picture of the Skin could not be read'));
    withPicture();

    fireEvent.click(screen.getByRole('button', { name: 'Download web PDF' }));
    fireEvent.click(screen.getByRole('button', { name: 'Download anyway' }));

    expect(await screen.findByRole('alert', {}, { timeout: 8000 })).toHaveTextContent('The PDF could not be created. Try again.');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Download web PDF' })).toBeEnabled());
    expect(createPdf).not.toHaveBeenCalled();
  });
});
