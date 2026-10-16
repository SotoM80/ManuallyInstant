import { fireEvent, screen, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { MANUAL_PAGES } from '../src/data/manualSections';

// Spec: specs/skins.md (a stack of layers, ADR 0010; the Skin owns its colors, ADR 0011)
const INNER_PAGES = MANUAL_PAGES.filter((page) => page !== 'Cover');
function openSkin() {
  fireEvent.click(screen.getByRole('button', { name: /5\. Skin/ }));
  return screen.getByRole('form', { name: 'Skin' });
}

function add(form: HTMLElement, preset: string) {
  fireEvent.click(within(form).getByRole('button', { name: '+ Add layer' }));
  fireEvent.click(within(form).getByRole('button', { name: `Add ${preset}` }));
}

// The backdrop of a page, or undefined when no layer is drawn on it
function backdrop(page = 'Brand concept') {
  const svgs = screen.getByRole('article', { name: page }).querySelectorAll('svg.skin-layer');
  expect(svgs.length).toBeLessThanOrEqual(1);
  return svgs[0];
}

// What each page draws, from the bottom group to the top one
function drawnKinds(page = 'Brand concept') {
  return [...(backdrop(page)?.querySelectorAll(':scope > g') ?? [])].map((group) => group.getAttribute('data-skin'));
}

function layerNames(form: HTMLElement) {
  const list = within(form).queryByRole('list', { name: 'Layers' });
  return list ? within(list).getAllByRole('listitem').map((item) => item.querySelector('.skin-row-name')!.textContent) : [];
}

describe('Skin – layers', () => {
  it('starts with white pages, black text, no layers and Brand concept first (scenario 1)', () => {
    renderApp();
    const form = openSkin();
    expect(within(form).getByRole('textbox', { name: 'Page background HEX' })).toHaveValue('#FFFFFF');
    expect(within(form).getByRole('textbox', { name: 'Page text HEX' })).toHaveValue('#000000');
    expect(within(form).getByText(/No layers yet/)).toBeInTheDocument();
    expect(within(form).getByRole('button', { name: '+ Add layer' })).toBeEnabled();
    expect(MANUAL_PAGES.every((page) => backdrop(page) === undefined)).toBe(true);
    expect(screen.getAllByRole('article')[0]).toHaveAccessibleName('Brand concept');
  });

  it('offers only the presets that can be drawn (scenario 2)', () => {
    renderApp();
    const form = openSkin();
    fireEvent.click(within(form).getByRole('button', { name: '+ Add layer' }));
    const gallery = within(form).getByRole('group', { name: 'Add a layer' });
    expect(within(gallery).getAllByRole('button').map((card) => card.getAttribute('aria-label'))).toEqual([
      'Add Linear',
      'Add Radial',
      'Add Circles',
      'Add Diagonal block',
      'Add Waves',
      'Add Dots',
      'Add Stripes',
      'Add Grain',
      'Add Paper',
    ]);
    expect(within(gallery).getByText('Shapes')).toBeInTheDocument();
    expect(within(gallery).getByText('Textures')).toBeInTheDocument();
  });

  it('adds a layer, on and open, drawn on every inner page but not the Cover (scenario 3)', () => {
    renderApp();
    const form = openSkin();
    add(form, 'Linear');
    expect(layerNames(form)).toEqual(['Linear']);
    expect(within(form).getByRole('checkbox', { name: 'Show Linear' })).toBeChecked();
    expect(within(form).getByRole('slider', { name: 'Angle' })).toHaveValue('135');
    expect(within(form).queryByRole('group', { name: 'Add a layer' })).not.toBeInTheDocument();
    expect(within(form).getByRole('checkbox', { name: 'Also on the Cover' })).not.toBeChecked();
    for (const page of INNER_PAGES) {
      expect(backdrop(page)).toHaveAttribute('aria-hidden', 'true');
      expect(backdrop(page)!.querySelector('g')).toHaveAttribute('opacity', '0.3');
    }
    expect(backdrop('Cover')).toBeUndefined();
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

  it('brings only the title of a new layer into view, with the focus on it, so a tall layer does not pull the page', () => {
    const scrollIntoView = jest.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    renderApp();
    const form = openSkin();
    add(form, 'Linear');
    add(form, 'Waves');
    const waves = within(form).getByRole('button', { name: 'Waves' });
    expect(waves).toHaveFocus();
    expect(scrollIntoView).toHaveBeenLastCalledWith(expect.objectContaining({ block: 'nearest' }));
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(waves.closest('.skin-row-header'));
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

  it('draws Shapes on the page, turned around its center', () => {
    renderApp();
    const form = openSkin();
    add(form, 'Waves');
    add(form, 'Circles');
    add(form, 'Diagonal block');
    expect(drawnKinds()).toEqual(['shapes', 'shapes', 'shapes']);
    const [waves] = backdrop()!.querySelectorAll(':scope > g');
    expect(waves.querySelector('g')).toHaveAttribute('transform', 'rotate(0 105 148.5)');
    expect(waves.querySelectorAll('path').length).toBeGreaterThan(3);
  });

  it('draws Grain over the layers under it with a fixed noise filter (scenarios 24 and 27)', () => {
    renderApp();
    const form = openSkin();
    add(form, 'Linear');
    add(form, 'Grain');
    expect(drawnKinds()).toEqual(['linear', 'texture']);
    expect(within(form).getByRole('slider', { name: 'Grain size' })).toHaveValue('1');
    const seeds = INNER_PAGES.map((page) => {
      const filter = backdrop(page)!.querySelector('filter')!;
      // Only filter primitives in a filter: a <g> there would be ignored by the browser
      expect([...filter.children].every((child) => child.tagName.startsWith('fe'))).toBe(true);
      expect(filter.querySelectorAll('feFlood')).toHaveLength(2);
      return filter.querySelector('feTurbulence')!.getAttribute('seed');
    });
    expect(new Set(seeds).size).toBe(1);
    const [, grain] = backdrop()!.querySelectorAll(':scope > g');
    expect(grain.querySelector('rect')).toHaveAttribute('filter', expect.stringMatching(/^url\(#/));
  });

  it('draws Paper over a base of Color B (scenario 26)', () => {
    renderApp();
    const form = openSkin();
    add(form, 'Paper');
    const [paper] = backdrop()!.querySelectorAll(':scope > g');
    const [base, fibers] = paper.querySelectorAll(':scope > rect');
    expect(base).toHaveAttribute('fill', '#FFFFFF');
    expect(fibers).toHaveAttribute('filter');
    expect(paper.querySelector('feTurbulence')).toHaveAttribute('baseFrequency', '0.075 0.6');
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

  it('uses the Page text and Page background colors with an empty palette (scenario 13)', () => {
    renderApp();
    const form = openSkin();
    add(form, 'Linear');
    const stops = [...backdrop()!.querySelectorAll('stop')].map((stop) => stop.getAttribute('stop-color'));
    expect(stops).toEqual(['#000000', '#FFFFFF']);
    expect(within(form).queryByRole('button', { name: /use / })).not.toBeInTheDocument();
  });

  it('keeps the layers with Landscape (scenario 16)', () => {
    renderApp();
    const form = openSkin();
    add(form, 'Linear');
    add(form, 'Dots');
    fireEvent.click(screen.getByRole('radio', { name: 'Landscape' }));
    for (const page of INNER_PAGES) {
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
  function addPaletteColors() {
    // The Colors section starts with Black; each new color takes the next unused swatch (White, Gray)
    fireEvent.click(screen.getByRole('button', { name: /3\. Colors/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }));
  }

  function hexOf(form: HTMLElement, label: string) {
    return within(form).getByRole('textbox', { name: `${label} HEX` });
  }

  it('starts a layer with palette colors 1 and 2, copied (scenarios 3 and 14)', () => {
    renderApp();
    addPaletteColors();
    const form = openSkin();
    add(form, 'Linear');
    expect(hexOf(form, 'Linear Color A')).toHaveValue('#000000');
    expect(hexOf(form, 'Linear Color B')).toHaveValue('#FFFFFF');
    // A chip copies the palette color into the field
    fireEvent.click(within(form).getByRole('button', { name: 'Linear Color A: use Color 3' }));
    const gray = (hexOf(form, 'Linear Color A') as HTMLInputElement).value;
    expect(gray).not.toBe('#000000');
    // Removing that color from the palette does not change the layer
    fireEvent.click(screen.getByRole('button', { name: /3\. Colors/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Color 3' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove Color 3' }));
    const stops = [...backdrop()!.querySelectorAll('stop')].map((stop) => stop.getAttribute('stop-color'));
    expect(stops).toEqual([gray, '#FFFFFF']);
  });

  it('gives each layer its own colors (scenario 11)', () => {
    renderApp();
    const form = openSkin();
    add(form, 'Linear');
    add(form, 'Dots');
    fireEvent.change(hexOf(form, 'Dots Color A'), { target: { value: '#1E88E5' } });
    const [linear, dots] = backdrop()!.querySelectorAll('g');
    expect(dots.querySelector('circle')).toHaveAttribute('fill', '#1E88E5');
    expect(linear.querySelector('stop')).toHaveAttribute('stop-color', '#000000');
  });

  it('keeps the Cover colors on the Cover only (scenario 20)', () => {
    renderApp();
    const background = screen.getByRole('group', { name: 'Background color' });
    fireEvent.click(within(background).getByRole('button', { name: /swatches/ }));
    fireEvent.click(within(background).getByRole('radio', { name: 'Navy' }));
    expect(screen.getByRole('article', { name: 'Cover' })).toHaveStyle({ background: '#1A237E' });
    for (const page of INNER_PAGES) {
      expect(screen.getByRole('article', { name: page })).toHaveStyle({ background: '#FFFFFF' });
    }
  });

  it('paints the inner pages with the page colors (scenario 21)', () => {
    renderApp();
    addPaletteColors(); // so the Color palette page shows its colors, in the Page text color
    const form = openSkin();
    fireEvent.change(hexOf(form, 'Page background'), { target: { value: '#F5F0E6' } });
    fireEvent.change(hexOf(form, 'Page text'), { target: { value: '#2b2d42' } });
    for (const page of INNER_PAGES) {
      expect(screen.getByRole('article', { name: page })).toHaveStyle({ background: '#F5F0E6' });
    }
    expect(screen.getByRole('article', { name: 'Cover' })).not.toHaveStyle({ background: '#F5F0E6' });
    expect(screen.getByRole('article', { name: 'Color palette' }).querySelector('.palette-layout')).toHaveStyle({
      color: '#2B2D42',
    });
  });

  it('draws a layer on the Cover when asked (scenario 22)', () => {
    renderApp();
    const form = openSkin();
    add(form, 'Linear');
    add(form, 'Dots');
    const linear = within(form).getByRole('button', { name: 'Linear' });
    fireEvent.click(linear);
    fireEvent.click(within(linear.closest('li')!).getByRole('checkbox', { name: 'Also on the Cover' }));
    expect(drawnKinds('Cover')).toEqual(['linear']);
    expect(drawnKinds()).toEqual(['linear', 'pattern']);
  });

  it('flags a wrong HEX and keeps the last valid color (scenario 23)', () => {
    renderApp();
    const form = openSkin();
    fireEvent.change(hexOf(form, 'Page background'), { target: { value: 'blue' } });
    fireEvent.blur(hexOf(form, 'Page background'));
    expect(hexOf(form, 'Page background')).toHaveAccessibleDescription('Enter a valid HEX color, like #1E88E5');
    expect(screen.getByRole('article', { name: 'Brand concept' })).toHaveStyle({ background: '#FFFFFF' });
  });
});
