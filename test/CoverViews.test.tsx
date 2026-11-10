import { readFileSync } from 'fs';
import { join } from 'path';
import { fireEvent, screen, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { typeTitle } from './coverForm';
import { FONT_SIZES } from '../src/data/titleOptions';

// Spec: specs/cover.md, "The same Cover in every view" (ADR 0027). jsdom does not lay out text,
// so these check that nothing in the Cover's text depends on the view: the browser then breaks
// the title the same way on every page width.
jest.setTimeout(20000);

function coverTitle() {
  const preview = screen.getByRole('region', { name: 'Manual preview' });
  return within(within(preview).getByRole('article', { name: 'Cover' })).getByText('My Brand');
}

function chooseView(name: 'Grid' | 'Overview' | 'Pages') {
  fireEvent.click(within(screen.getByRole('group', { name: 'Preview view' })).getByRole('radio', { name }));
}

describe('Cover – the same in every view', () => {
  it('measures the title sizes on the page, with the Grid look of today', () => {
    expect(FONT_SIZES).toEqual({ Small: '2.6cqw', Medium: '3.5cqw', Large: '5.2cqw' });
  });

  // Scenario 8
  it('draws the title at the same size in Grid, Overview and Pages', () => {
    renderApp();
    typeTitle('My Brand');

    for (const view of ['Grid', 'Overview', 'Pages'] as const) {
      chooseView(view);
      expect(coverTitle().style.getPropertyValue('--cover-title-size')).toBe('3.5cqw');
      expect(coverTitle().style.lineHeight).toBe('calc(1.15 * var(--title-leading, 1))');
    }
  });

  it('draws the whole Cover in the title\'s family, placeholders included', () => {
    renderApp();
    const cover = () => within(screen.getByRole('region', { name: 'Manual preview' })).getByRole('article', { name: 'Cover' });
    const layout = () => cover().querySelector<HTMLElement>('.cover-layout')!;

    // Untouched: the default family, with the grey placeholders
    expect(layout().style.fontFamily).toContain('Roboto');
    expect(within(cover()).getByText('Designed by …')).toHaveClass('manual-page-empty');

    typeTitle('My Brand');
    fireEvent.change(screen.getByRole('combobox', { name: 'Font family' }), { target: { value: 'Lato' } });
    fireEvent.blur(screen.getByRole('combobox', { name: 'Font family' }));

    expect(layout().style.fontFamily).toContain('Lato');
    expect(coverTitle().style.fontFamily).toContain('Lato');
  });

  // Scenarios 8 to 10: the page is the container its text is measured on, in every view and the PDF
  it('makes every page a container, and has no Pages-view rule for "Designed by"', () => {
    const preview = readFileSync(join(__dirname, '../src/css/ManualPreview.css'), 'utf8');
    const shared = readFileSync(join(__dirname, '../src/templates/shared.css'), 'utf8');
    const page = preview.slice(preview.indexOf('\n.manual-page {'), preview.indexOf('}', preview.indexOf('\n.manual-page {')));
    expect(page).toContain('container-type: inline-size');
    expect(shared).toContain('font-size: var(--cover-title-size, 3.5cqw)');
    // The letter spacing is measured on every page (ADR 0028), the Cover included
    const content = preview.slice(preview.indexOf('\n.manual-page-content {'), preview.indexOf('}', preview.indexOf('\n.manual-page-content {')));
    expect(content).toContain('letter-spacing: 0.04cqw');
    const empty = shared.slice(shared.indexOf('\n.manual-page-content .manual-page-empty {'), shared.indexOf('}', shared.indexOf('\n.manual-page-content .manual-page-empty {')));
    expect(empty).toContain('font-size: 2.8cqw');
    expect(empty).toContain('line-height: 5.7cqw');

    const designedBy = shared.slice(shared.indexOf('\n.cover-designed-by {'), shared.indexOf('}', shared.indexOf('\n.cover-designed-by {')));
    expect(designedBy).toContain('font-size: 2.4cqw');
    expect(designedBy).toContain('line-height: calc(5.7cqw * var(--text-leading, 1))');
    expect(shared).not.toContain(".manual-preview[data-view='pages'] .cover-designed-by");
  });
});
