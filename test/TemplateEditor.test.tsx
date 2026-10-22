import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { loadEditorMask, loadEditorPhoto, maskToDataUrl } from '../src/mockups/editorImage';
import { renderPhotoMockup } from '../src/mockups/render/renderPhotoMockup';
import { emptyMask } from '../src/mockups/selection';
import { mockupCatalog, resetSessionTemplates } from '../src/mockups/catalog';

// Spec: specs/mockups.md, The template editor. The canvas parts are mocked (jsdom draws nothing):
// a 10 × 10 photo, white in the middle (the product) on gray.
jest.mock('../src/mockups/editorImage', () => ({
  EDITOR_WIDTH: 1000,
  loadEditorPhoto: jest.fn(),
  loadEditorMask: jest.fn(),
  maskToDataUrl: jest.fn(() => 'data:image/png;base64,mask'),
  drawSelection: jest.fn(),
}));
jest.mock('../src/mockups/render/renderPhotoMockup', () => ({ renderPhotoMockup: jest.fn(async () => 'data:image/png;base64,mockup') }));
jest.setTimeout(20000);

// jsdom has no PointerEvent, and the generic event it falls back to drops clientX / clientY:
// a PointerEvent built on MouseEvent keeps them (and the modifier keys)
if (!('PointerEvent' in window)) {
  class PointerEventStandIn extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
    }
  }
  Object.assign(window, { PointerEvent: PointerEventStandIn });
}

const SIZE = 10;
function photoPixels() {
  const data = new Uint8ClampedArray(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const product = x >= 3 && x <= 6 && y >= 2 && y <= 7;
      data.set(product ? [250, 250, 250, 255] : [120, 120, 120, 255], (y * SIZE + x) * 4);
    }
  return { data, width: SIZE, height: SIZE };
}

beforeEach(() => {
  resetSessionTemplates();
  (loadEditorPhoto as jest.Mock).mockResolvedValue({ pixels: photoPixels(), size: [100, 100], scale: 0.1 });
  (loadEditorMask as jest.Mock).mockImplementation(async (_mask, width, height) => emptyMask(width, height));
  (maskToDataUrl as jest.Mock).mockClear();
});

function openMockups() {
  fireEvent.click(screen.getByRole('button', { name: /7\. Mockups/ }));
  return screen.getByRole('form', { name: 'Mockups' });
}

async function openEditorFor(form: HTMLElement) {
  fireEvent.click(within(form).getByRole('checkbox', { name: /^Business card \(photo\)/ }));
  fireEvent.click(within(form).getByRole('button', { name: 'Edit template' }));
  const editor = screen.getByRole('dialog', { name: 'Template editor' });
  await within(editor).findByLabelText('Photo: click the product to select it', {}, { timeout: 5000 });
  return editor;
}

// A click on the canvas at a point of the 10 × 10 photo (jsdom gives the canvas no size, so
// clientX/Y are the photo's own pixels with a 1 × 1 box)
function clickPhoto(editor: HTMLElement, x: number, y: number, keys: { shiftKey?: boolean; altKey?: boolean } = {}) {
  const canvas = within(editor).getByLabelText('Photo: click the product to select it');
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: SIZE, height: SIZE }) as DOMRect;
  fireEvent.pointerDown(canvas, { clientX: x, clientY: y, ...keys });
  fireEvent.pointerUp(canvas, { clientX: x, clientY: y });
}

function dragPhoto(editor: HTMLElement, from: [number, number], to: [number, number]) {
  const canvas = within(editor).getByLabelText('Photo: click the product to select it');
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: SIZE, height: SIZE }) as DOMRect;
  fireEvent.pointerDown(canvas, { clientX: from[0], clientY: from[1] });
  fireEvent.pointerMove(canvas, { clientX: to[0], clientY: to[1] });
  fireEvent.pointerUp(canvas, { clientX: to[0], clientY: to[1] });
}

describe('Template editor', () => {
  it('opens from a photo mockup, and closes with Escape', async () => {
    renderApp();
    const editor = await openEditorFor(openMockups());
    expect(within(editor).getByLabelText('Name')).toHaveValue('Business card (photo)');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Template editor' })).not.toBeInTheDocument();
  });

  it('asks to select the product before using the template', async () => {
    renderApp();
    const editor = await openEditorFor(openMockups());
    fireEvent.click(within(editor).getByRole('button', { name: 'Clear selection' }));
    fireEvent.click(within(editor).getByRole('button', { name: 'Use now' }));
    expect(within(editor).getByRole('alert')).toHaveTextContent('Select the product first');
  });

  it('selects the product with the magic wand and saves the template for the session (scenario 23)', async () => {
    renderApp();
    const editor = await openEditorFor(openMockups());
    clickPhoto(editor, 4, 4);
    fireEvent.click(within(editor).getByRole('radio', { name: 'Logo area' }));
    dragPhoto(editor, [3, 3], [7, 6]);
    fireEvent.change(within(editor).getByLabelText('Name'), { target: { value: 'Cards (mine)' } });
    fireEvent.click(within(editor).getByRole('button', { name: 'Use now' }));

    expect(screen.queryByRole('dialog', { name: 'Template editor' })).not.toBeInTheDocument();
    const saved = mockupCatalog().find((item) => item.id === 'business-card-photo');
    expect(saved).toMatchObject({
      name: 'Cards (mine)',
      maskImage: 'data:image/png;base64,mask',
      area: { x: 30, y: 30, width: 40, height: 30 }, // the editor works at a tenth of the photo
    });
    // The wand took the white pixels (softened at the edge): the middle is in, the corner out
    const mask = (maskToDataUrl as jest.Mock).mock.calls[0][0];
    expect(mask.data[4 * SIZE + 4]).toBeGreaterThan(128);
    expect(mask.data[0]).toBe(0);
    // And the page draws it again with the new template
    await waitFor(() =>
      expect((renderPhotoMockup as jest.Mock).mock.calls.some(([input]) => input.template.name === 'Cards (mine)')).toBe(true),
    );
  });

  it('marks an area with an angle or a curve by dragging its points', async () => {
    renderApp();
    const editor = await openEditorFor(openMockups());
    clickPhoto(editor, 4, 4);
    fireEvent.click(within(editor).getByRole('radio', { name: 'Logo area' }));
    expect(within(editor).getAllByRole('slider', { name: /^Point \d+ of the logo area$/ })).toHaveLength(4);
    fireEvent.change(within(editor).getByLabelText('Points across'), { target: { value: '3' } });
    const points = within(editor).getAllByRole('slider', { name: /^Point \d+ of the logo area$/ });
    expect(points).toHaveLength(6);

    // Drag the top middle point down: the top edge bends, like the rim of a mug
    const middle = points[1];
    const svg = middle.closest('svg')!;
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect;
    const before = Number(middle.getAttribute('cy'));
    fireEvent.pointerDown(middle, { clientX: Number(middle.getAttribute('cx')) / 16, clientY: 0 });
    fireEvent.pointerMove(middle, { clientX: 50, clientY: 50 });
    fireEvent.pointerUp(middle);
    expect(Number(middle.getAttribute('cy'))).not.toBe(before);

    fireEvent.click(within(editor).getByRole('button', { name: 'Use now' }));
    const saved = mockupCatalog().find((item) => item.id === 'business-card-photo');
    expect(saved).toMatchObject({ grid: { cols: 3, rows: 2 } });
  });

  it('undoes the last selection', async () => {
    renderApp();
    const editor = await openEditorFor(openMockups());
    const undo = within(editor).getByRole('button', { name: 'Undo' });
    expect(undo).toBeDisabled();
    clickPhoto(editor, 4, 4);
    expect(undo).toBeEnabled();
    fireEvent.click(undo);
    expect(undo).toBeDisabled();
  });

  it('opens an uploaded photo as a new template, and ticks it once used (scenario 23)', async () => {
    renderApp();
    const form = openMockups();
    fireEvent.click(within(form).getByRole('checkbox', { name: 'Mug' })); // room for a new one
    const file = new File(['x'], 'tote bag.jpg', { type: 'image/jpeg' });
    await act(async () => {
      fireEvent.change(within(form).getByLabelText('Upload your own photo'), { target: { files: [file] } });
    });
    const editor = screen.getByRole('dialog', { name: 'Template editor' });
    expect(within(editor).getByLabelText('Name')).toHaveValue('tote bag');
    await within(editor).findByLabelText('Photo: click the product to select it', {}, { timeout: 5000 });
    clickPhoto(editor, 4, 4);
    fireEvent.click(within(editor).getByRole('button', { name: 'Use now' }));
    expect(within(form).getByRole('checkbox', { name: /^tote bag/ })).toBeChecked();
  });

  it('refuses a file that is not a JPG or PNG photo up to 10 MB (scenario 24)', () => {
    renderApp();
    const form = openMockups();
    const file = new File(['x'], 'brief.pdf', { type: 'application/pdf' });
    fireEvent.change(within(form).getByLabelText('Upload your own photo'), { target: { files: [file] } });
    expect(within(form).getByRole('alert')).toHaveTextContent('Use a JPG or PNG photo, up to 10 MB');
    expect(screen.queryByRole('dialog', { name: 'Template editor' })).not.toBeInTheDocument();
  });
});
