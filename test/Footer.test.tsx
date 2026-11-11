import { fireEvent, screen, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { MANUAL_PAGES } from '../src/data/manualSections';

// Spec: specs/footer.md (ADR 0031)
jest.setTimeout(20000);

const INNER_PAGES = MANUAL_PAGES.filter((page) => page !== 'Cover');

function openSkin() {
  fireEvent.click(screen.getByRole('button', { name: /6\. Skin/ }));
  return within(screen.getByRole('form', { name: 'Skin' }));
}

function footer(page: string) {
  const preview = within(screen.getByRole('region', { name: 'Manual preview' }));
  return preview.getByRole('article', { name: page }).querySelector('footer.page-footer');
}

describe('Footer – in the Skin', () => {
  it('is off, with its fields hidden, and no page has a footer (scenario 1)', () => {
    renderApp('/brand-manual');
    const skin = openSkin();
    expect(skin.getByRole('checkbox', { name: 'Show footer' })).not.toBeChecked();
    expect(skin.queryByRole('checkbox', { name: 'Page numbers' })).toBeNull();
    expect(skin.queryByRole('textbox', { name: 'Footer text' })).toBeNull();
    expect(MANUAL_PAGES.every((page) => footer(page) === null)).toBe(true);
  });

  it('numbers every inner page as soon as it is shown, and never the Cover (scenario 2)', () => {
    renderApp('/brand-manual');
    const skin = openSkin();
    fireEvent.click(skin.getByRole('checkbox', { name: 'Show footer' }));

    expect(skin.getByRole('checkbox', { name: 'Page numbers' })).toBeChecked();
    expect(skin.getByRole('textbox', { name: 'Footer text' })).toHaveValue('');
    expect(footer('Cover')).toBeNull();
    INNER_PAGES.forEach((page, i) => expect(footer(page)).toHaveTextContent(String(i + 2)));
  });

  it('keeps the numbers of the manual when a section brings its pages to the top (scenario 3)', () => {
    renderApp('/brand-manual');
    fireEvent.click(openSkin().getByRole('checkbox', { name: 'Show footer' }));
    fireEvent.click(screen.getByRole('button', { name: /^4\. Colors/ }));

    const preview = within(screen.getByRole('region', { name: 'Manual preview' }));
    expect(preview.getAllByRole('article')[0]).toHaveAccessibleName('Color palette');
    expect(footer('Color palette')).toHaveTextContent('8');
  });

  it('writes the text on every inner page at once, in the Page text color (scenarios 4, 8)', () => {
    renderApp('/brand-manual');
    const skin = openSkin();
    fireEvent.click(skin.getByRole('checkbox', { name: 'Show footer' }));
    fireEvent.change(skin.getByRole('textbox', { name: 'Footer text' }), { target: { value: 'Northwind Coffee' } });

    for (const page of INNER_PAGES) expect(footer(page)).toHaveTextContent('Northwind Coffee');
    expect(footer('Cover')).toBeNull();
    expect(footer('Anatomy')).toHaveStyle({ color: 'rgb(0, 0, 0)' });
    expect(skin.getByRole('textbox', { name: 'Footer text' })).toHaveAttribute('maxLength', '80');
  });

  it('shows the text alone when the numbers are off (scenario 5)', () => {
    renderApp('/brand-manual');
    const skin = openSkin();
    fireEvent.click(skin.getByRole('checkbox', { name: 'Show footer' }));
    fireEvent.change(skin.getByRole('textbox', { name: 'Footer text' }), { target: { value: 'Northwind Coffee' } });
    fireEvent.click(skin.getByRole('checkbox', { name: 'Page numbers' }));

    expect(footer('Brand concept')).toHaveTextContent(/^Northwind Coffee$/);
    expect(footer('Brand concept')!.querySelector('.page-footer-number')).toBeNull();
  });

  it('hides the footer and keeps what was set, until it is shown again (scenario 2b)', () => {
    renderApp('/brand-manual');
    const skin = openSkin();
    const show = skin.getByRole('checkbox', { name: 'Show footer' });
    fireEvent.click(show);
    fireEvent.change(skin.getByRole('textbox', { name: 'Footer text' }), { target: { value: 'Northwind Coffee' } });

    fireEvent.click(show);
    expect(skin.queryByRole('textbox', { name: 'Footer text' })).toBeNull();
    expect(INNER_PAGES.every((page) => footer(page) === null)).toBe(true);

    fireEvent.click(show);
    expect(skin.getByRole('textbox', { name: 'Footer text' })).toHaveValue('Northwind Coffee');
    expect(footer('Anatomy')).toHaveTextContent('3Northwind Coffee');
  });

  it('is kept when going Home and back (scenario 9)', () => {
    renderApp('/brand-manual');
    const skin = openSkin();
    fireEvent.click(skin.getByRole('checkbox', { name: 'Show footer' }));
    fireEvent.change(skin.getByRole('textbox', { name: 'Footer text' }), { target: { value: 'Northwind Coffee' } });

    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    fireEvent.click(screen.getByRole('link', { name: 'Brand Manual' }));

    expect(footer('Mockups')).toHaveTextContent('10Northwind Coffee');
    expect(openSkin().getByRole('textbox', { name: 'Footer text' })).toHaveValue('Northwind Coffee');
  });
});
