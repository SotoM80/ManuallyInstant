import { fireEvent, screen, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { MANUAL_PAGES } from '../src/data/manualSections';

// Spec: specs/skins.md (a stack of layers, ADR 0010)
function openSkin() {
  fireEvent.click(screen.getByRole('button', { name: /5\. Skin/ }));
  return screen.getByRole('form', { name: 'Skin' });
}

function add(form: HTMLElement, preset: string) {
  fireEvent.click(within(form).getByRole('button', { name: '+ Add layer' }));
  fireEvent.click(within(form).getByRole('button', { name: `Add ${preset}` }));
}

// The backdrop of a page, or undefined when no layer is drawn on it
function backdrop(page = 'Cover') {
  const svgs = screen.getByRole('article', { name: page }).querySelectorAll('svg.skin-layer');
  expect(svgs.length).toBeLessThanOrEqual(1);
  return svgs[0];
}

// What each page draws, from the bottom group to the top one
function drawnKinds(page = 'Cover') {
  return [...(backdrop(page)?.querySelectorAll('g') ?? [])].map((group) => group.getAttribute('data-skin'));
}

function layerNames(form: HTMLElement) {
  const list = within(form).queryByRole('list', { name: 'Layers' });
  return list ? within(list).getAllByRole('listitem').map((item) => item.querySelector('.skin-row-name')!.textContent) : [];
}

describe('Skin – layers', () => {
  it('starts with no layers and plain pages (scenario 1)', () => {
    renderApp();
    const form = openSkin();
    expect(within(form).getByText(/No layers yet/)).toBeInTheDocument();
    expect(within(form).getByRole('button', { name: '+ Add layer' })).toBeEnabled();
    expect(MANUAL_PAGES.every((page) => backdrop(page) === undefined)).toBe(true);
    expect(screen.getAllByRole('article')[0]).toHaveAccessibleName('Cover');
  });

  it('offers only the presets that can be drawn (scenario 2)', () => {
    renderApp();
    const form = openSkin();
    fireEvent.click(within(form).getByRole('button', { name: '+ Add layer' }));
    const gallery = within(form).getByRole('group', { name: 'Add a layer' });
    expect(within(gallery).getAllByRole('button').map((card) => card.getAttribute('aria-label'))).toEqual([
      'Add Linear',
      'Add Radial',
      'Add Dots',
      'Add Stripes',
    ]);
    expect(within(gallery).queryByText('Textures')).not.toBeInTheDocument();
  });

  it('adds a layer, on and open, drawn on every page (scenario 3)', () => {
    renderApp();
    const form = openSkin();
    add(form, 'Linear');
    expect(layerNames(form)).toEqual(['Linear']);
    expect(within(form).getByRole('checkbox', { name: 'Show Linear' })).toBeChecked();
    expect(within(form).getByRole('slider', { name: 'Angle' })).toHaveValue('135');
    expect(within(form).queryByRole('group', { name: 'Add a layer' })).not.toBeInTheDocument();
    for (const page of MANUAL_PAGES) {
      expect(backdrop(page)).toHaveAttribute('aria-hidden', 'true');
      expect(backdrop(page)!.querySelector('g')).toHaveAttribute('opacity', '0.3');
    }
  });

  it('puts a new layer on top, and draws it over the others (scenario 4)', () => {
    renderApp();
    const form = openSkin();
    add(form, 'Linear');
    add(form, 'Dots');
    expect(layerNames(form)).toEqual(['Dots', 'Linear']);
    expect(drawnKinds()).toEqual(['linear', 'pattern']); // the last group is on top
    const toggles = within(form).getAllByRole('button', { expanded: true });
    expect(toggles.map((toggle) => toggle.textContent)).toEqual(['Dots']);
  });

  it('hides and shows a layer (scenario 5)', () => {
    renderApp();
    const form = openSkin();
    add(form, 'Linear');
    add(form, 'Dots');
    fireEvent.click(within(form).getByRole('checkbox', { name: 'Show Dots' }));
    expect(drawnKinds()).toEqual(['linear']);
    fireEvent.click(within(form).getByRole('checkbox', { name: 'Show Dots' }));
    expect(drawnKinds()).toEqual(['linear', 'pattern']);
  });

  it('moves a layer and keeps the focus on it (scenarios 6 and 7)', () => {
    renderApp();
    const form = openSkin();
    add(form, 'Linear');
    add(form, 'Dots');
    expect(within(form).getByRole('button', { name: 'Move Dots up' })).toBeDisabled();
    expect(within(form).getByRole('button', { name: 'Move Linear down' })).toBeDisabled();
    fireEvent.click(within(form).getByRole('button', { name: 'Move Dots down' }));
    expect(layerNames(form)).toEqual(['Linear', 'Dots']);
    expect(drawnKinds()).toEqual(['pattern', 'linear']);
    // Dots is last now, so its Move down is off and the focus goes to its Move up
    expect(within(form).getByRole('button', { name: 'Move Dots up' })).toHaveFocus();
  });

  it('removes a layer (scenario 8)', () => {
    renderApp();
    const form = openSkin();
    add(form, 'Linear');
    add(form, 'Dots');
    fireEvent.click(within(form).getByRole('button', { name: 'Remove Dots' }));
    expect(layerNames(form)).toEqual(['Linear']);
    expect(drawnKinds()).toEqual(['linear']);
  });

  it('allows up to four layers (scenarios 9 and 10)', () => {
    renderApp();
    const form = openSkin();
    for (const preset of ['Dots', 'Linear', 'Dots', 'Stripes']) add(form, preset);
    expect(layerNames(form)).toEqual(['Stripes', 'Dots 2', 'Linear', 'Dots']);
    expect(within(form).getByRole('button', { name: '+ Add layer' })).toBeDisabled();
    expect(within(form).getByText('Up to 4 layers.')).toBeInTheDocument();
    fireEvent.click(within(form).getByRole('button', { name: 'Remove Linear' }));
    expect(within(form).getByRole('button', { name: '+ Add layer' })).toBeEnabled();
  });

  it('gives each layer its own values (scenario 11)', () => {
    renderApp();
    const form = openSkin();
    add(form, 'Linear');
    fireEvent.change(within(form).getByRole('slider', { name: 'Intensity' }), { target: { value: '80' } });
    add(form, 'Dots');
    const [linear, dots] = backdrop()!.querySelectorAll('g');
    expect(linear).toHaveAttribute('opacity', '0.8');
    expect(dots).toHaveAttribute('opacity', '0.3');
  });

  it('uses the Cover colors with an empty palette (scenario 13)', () => {
    renderApp();
    const form = openSkin();
    add(form, 'Linear');
    const stops = [...backdrop()!.querySelectorAll('stop')].map((stop) => stop.getAttribute('stop-color'));
    expect(stops).toEqual(['#000000', '#FFFFFF']);
    expect(within(form).getByRole('combobox', { name: 'Linear Color A' })).toHaveDisplayValue('Auto · Typography color');
  });

  it('keeps the layers with Landscape (scenario 16)', () => {
    renderApp();
    const form = openSkin();
    add(form, 'Linear');
    add(form, 'Dots');
    fireEvent.click(screen.getByRole('radio', { name: 'Landscape' }));
    for (const page of MANUAL_PAGES) {
      expect(backdrop(page)).toHaveAttribute('viewBox', '0 0 297 210');
      expect(drawnKinds(page)).toEqual(['linear', 'pattern']);
    }
  });

  it('gives every gradient and pattern its own id (scenario 17)', () => {
    const { container } = renderApp();
    const form = openSkin();
    add(form, 'Linear');
    add(form, 'Dots');
    add(form, 'Dots');
    fireEvent.click(within(form).getByRole('button', { name: '+ Add layer' }));
    const ids = [...container.querySelectorAll('linearGradient, radialGradient, pattern')].map((paint) => paint.id);
    expect(ids.length).toBeGreaterThan(MANUAL_PAGES.length * 3);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps the layers between pages (scenario 18)', () => {
    renderApp();
    const form = openSkin();
    add(form, 'Linear');
    add(form, 'Dots');
    fireEvent.click(within(form).getByRole('checkbox', { name: 'Show Dots' }));
    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    fireEvent.click(screen.getByRole('link', { name: 'Brand Manual' }));
    const again = openSkin();
    expect(layerNames(again)).toEqual(['Dots', 'Linear']);
    expect(within(again).getByRole('checkbox', { name: 'Show Dots' })).not.toBeChecked();
  });

  it('closes the gallery with Escape', () => {
    renderApp();
    const form = openSkin();
    fireEvent.click(within(form).getByRole('button', { name: '+ Add layer' }));
    fireEvent.keyDown(within(form).getByRole('button', { name: 'Add Dots' }), { key: 'Escape' });
    expect(within(form).queryByRole('group', { name: 'Add a layer' })).not.toBeInTheDocument();
    expect(within(form).getByRole('button', { name: '+ Add layer' })).toHaveFocus();
  });
});

describe('Skin – colors', () => {
  it('uses a chosen palette color for one layer only (scenarios 6 and 11 of the colors)', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /3\. Colors/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }));
    const form = openSkin();
    add(form, 'Linear');
    add(form, 'Dots');
    const colorA = within(form).getByRole('combobox', { name: 'Dots Color A' });
    const third = within(colorA).getAllByRole('option')[3];
    fireEvent.change(colorA, { target: { value: third.getAttribute('value') } });
    const [linear, dots] = backdrop()!.querySelectorAll('g');
    const linearStops = [...linear.querySelectorAll('stop')].map((stop) => stop.getAttribute('stop-color'));
    const dotFills = [...dots.querySelectorAll('circle')].map((dot) => dot.getAttribute('fill'));
    expect(dotFills[0]).not.toBe(linearStops[0]);
    expect(dotFills[1]).toBe(linearStops[1]);
  });
});
