import { fireEvent, screen } from '@testing-library/react';
import { renderApp } from './renderApp';
import { MANUAL_PAGES } from '../src/data/manualSections';

// Linear is turned on by hand in App until the Skin section exists (specs/skins.md, Build Order)
function skinLayers() {
  return MANUAL_PAGES.map((page) => {
    const layers = screen.getByRole('article', { name: page }).querySelectorAll('svg.skin-layer');
    expect(layers).toHaveLength(1);
    return layers[0];
  });
}

describe('Skin layer', () => {
  it('draws one decorative layer on every page, at 30% intensity', () => {
    renderApp();
    for (const layer of skinLayers()) {
      expect(layer).toHaveAttribute('aria-hidden', 'true');
      expect(layer).toHaveAttribute('opacity', '0.3');
      expect(layer).toHaveAttribute('viewBox', '0 0 210 297');
    }
  });

  it('sits behind the content of the page', () => {
    renderApp();
    const cover = screen.getByRole('article', { name: 'Cover' });
    expect(cover.firstElementChild).toHaveClass('skin-layer');
  });

  it('follows the orientation (spec scenario 12)', () => {
    renderApp();
    fireEvent.click(screen.getByRole('radio', { name: 'Landscape' }));
    for (const layer of skinLayers()) {
      expect(layer).toHaveAttribute('viewBox', '0 0 297 210');
    }
  });

  it('gives every gradient its own id (spec scenario 13)', () => {
    const { container } = renderApp();
    const ids = [...container.querySelectorAll('linearGradient')].map((gradient) => gradient.id);
    expect(ids).toHaveLength(MANUAL_PAGES.length);
    expect(new Set(ids).size).toBe(ids.length);
    for (const layer of skinLayers()) {
      const id = layer.querySelector('linearGradient')!.id;
      expect(layer.querySelector('rect')).toHaveAttribute('fill', `url(#${id})`);
    }
  });

  it('uses the Typography and Background colors with an empty palette (spec scenario 7)', () => {
    renderApp();
    const stops = skinLayers()[0].querySelectorAll('stop');
    expect([...stops].map((stop) => stop.getAttribute('stop-color'))).toEqual(['#000000', '#FFFFFF']);
  });
});
