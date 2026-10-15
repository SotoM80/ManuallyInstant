import { fireEvent, screen, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { MANUAL_PAGES } from '../src/data/manualSections';

// Spec: specs/skins.md
function openSkin() {
  fireEvent.click(screen.getByRole('button', { name: /5\. Skin/ }));
  return screen.getByRole('form', { name: 'Skin' });
}

function skinLayers() {
  return MANUAL_PAGES.map((page) => {
    const layers = screen.getByRole('article', { name: page }).querySelectorAll('svg.skin-layer');
    expect(layers.length).toBeLessThanOrEqual(1);
    return layers[0];
  });
}

function stopColors(layer: Element) {
  return [...layer.querySelectorAll('stop')].map((stop) => stop.getAttribute('stop-color'));
}

function chooseLinear(form: HTMLElement) {
  fireEvent.click(within(form).getByRole('radio', { name: 'Linear' }));
}

describe('Skin – section', () => {
  it('starts on None, with no sliders and plain pages (scenario 1)', () => {
    renderApp();
    const form = openSkin();
    expect(within(form).getByRole('radio', { name: 'None' })).toBeChecked();
    expect(within(form).queryAllByRole('slider')).toHaveLength(0);
    expect(within(form).getByLabelText('Color A')).toHaveValue('auto');
    expect(within(form).getByLabelText('Color B')).toHaveValue('auto');
    expect(skinLayers().every((layer) => layer === undefined)).toBe(true);
    expect(screen.getAllByRole('article')[0]).toHaveAccessibleName('Cover');
  });

  it('only offers presets that can be drawn (scenario 2)', () => {
    renderApp();
    const form = openSkin();
    const names = within(form).getAllByRole('radio').map((radio) => radio.getAttribute('value'));
    expect(names).toEqual(['none', 'linear']);
    expect(within(form).getByText('Gradients')).toBeInTheDocument();
    expect(within(form).queryByText('Textures')).not.toBeInTheDocument();
  });

  it('draws Linear on every page with its sliders (scenario 3)', () => {
    renderApp();
    const form = openSkin();
    chooseLinear(form);
    expect(within(form).getByRole('slider', { name: 'Angle' })).toHaveValue('135');
    expect(within(form).getByRole('slider', { name: 'Intensity' })).toHaveValue('30');
    for (const layer of skinLayers()) {
      expect(layer).toHaveAttribute('aria-hidden', 'true');
      expect(layer).toHaveAttribute('opacity', '0.3');
      expect(layer).toHaveAttribute('viewBox', '0 0 210 297');
    }
  });

  it('changes the angle and the intensity at once (scenarios 4 and 5)', () => {
    renderApp();
    const form = openSkin();
    chooseLinear(form);
    fireEvent.change(within(form).getByRole('slider', { name: 'Angle' }), { target: { value: '45' } });
    fireEvent.change(within(form).getByRole('slider', { name: 'Intensity' }), { target: { value: '80' } });
    const gradient = skinLayers()[0].querySelector('linearGradient')!;
    expect(Number(gradient.getAttribute('x1'))).toBeCloseTo(-21.75, 2);
    expect(Number(gradient.getAttribute('y2'))).toBeCloseTo(21.75, 2);
    expect(skinLayers()[0]).toHaveAttribute('opacity', '0.8');
    expect(within(form).getByText('45°')).toBeInTheDocument();
  });

  it('uses the Typography and Background colors with an empty palette (scenario 7)', () => {
    renderApp();
    chooseLinear(openSkin());
    expect(stopColors(skinLayers()[0])).toEqual(['#000000', '#FFFFFF']);
  });

  it('keeps the skin with Landscape (scenario 12)', () => {
    renderApp();
    chooseLinear(openSkin());
    fireEvent.click(screen.getByRole('radio', { name: 'Landscape' }));
    for (const layer of skinLayers()) {
      expect(layer).toHaveAttribute('viewBox', '0 0 297 210');
    }
  });

  it('gives every gradient its own id, gallery included (scenario 13)', () => {
    const { container } = renderApp();
    chooseLinear(openSkin());
    const ids = [...container.querySelectorAll('linearGradient')].map((gradient) => gradient.id);
    expect(ids.length).toBeGreaterThan(MANUAL_PAGES.length);
    expect(new Set(ids).size).toBe(ids.length);
    for (const layer of skinLayers()) {
      const id = layer.querySelector('linearGradient')!.id;
      expect(layer.querySelector('rect')).toHaveAttribute('fill', `url(#${id})`);
    }
  });

  it('keeps the skin between pages (scenario 14)', () => {
    renderApp();
    chooseLinear(openSkin());
    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    fireEvent.click(screen.getByRole('link', { name: 'Brand Manual' }));
    expect(skinLayers().every((layer) => layer !== undefined)).toBe(true);
  });

  it('goes back to plain pages with None (scenario 15)', () => {
    renderApp();
    const form = openSkin();
    chooseLinear(form);
    fireEvent.click(within(form).getByRole('radio', { name: 'None' }));
    expect(skinLayers().every((layer) => layer === undefined)).toBe(true);
    expect(within(form).queryAllByRole('slider')).toHaveLength(0);
  });
});

describe('Skin – colors', () => {
  function addPaletteColors(count: number) {
    fireEvent.click(screen.getByRole('button', { name: /3\. Colors/ }));
    for (let i = 1; i < count; i++) fireEvent.click(screen.getByRole('button', { name: 'Add color' }));
  }

  it('uses the first two palette colors on Auto, and a chosen one (scenario 6)', () => {
    renderApp();
    addPaletteColors(3); // Black, White, Gray: the first unused quick swatches
    const form = openSkin();
    chooseLinear(form);
    const [first, second] = stopColors(skinLayers()[0]);
    expect([first, second]).toHaveLength(2);
    const colorA = within(form).getByLabelText('Color A');
    const third = within(colorA).getAllByRole('option')[3];
    fireEvent.change(colorA, { target: { value: third.getAttribute('value') } });
    expect(stopColors(skinLayers()[0])).not.toEqual([first, second]);
    expect(stopColors(skinLayers()[0])[1]).toBe(second);
  });
});
