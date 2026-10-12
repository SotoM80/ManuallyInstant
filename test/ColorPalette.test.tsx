import { screen, fireEvent, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { colorValues, rgbToCmyk } from '../src/data/colorPalette';

function getColorsForm() {
  return screen.getByRole('form', { name: 'Colors' });
}

function getPalettePage() {
  const preview = screen.getByRole('region', { name: 'Manual preview' });
  return within(preview).getByRole('article', { name: 'Color palette' });
}

function getColorGroups() {
  return within(getColorsForm()).getAllByRole('group', { name: /^Color \d$/ });
}

function getHex(n: number) {
  return within(getColorsForm()).getByRole('textbox', { name: `Color ${n} HEX` });
}

function typeName(n: number, value: string) {
  fireEvent.change(within(getColorsForm()).getByLabelText(`Color ${n} name`), { target: { value } });
}

function clickAddColor() {
  fireEvent.click(within(getColorsForm()).getByRole('button', { name: 'Add color' }));
}

function clickSaveColors() {
  fireEvent.click(within(getColorsForm()).getByRole('button', { name: 'Save' }));
}

// The header row of each color: opens and folds it (accordion)
function getHeader(n: number) {
  return within(getColorsForm()).getByRole('button', { name: `Color ${n}` });
}

function pickBlue(n: number) {
  const group = within(getColorsForm()).getByRole('group', { name: `Color ${n}` });
  fireEvent.click(within(group).getByRole('radio', { name: 'Blue' }));
}

// Spec: specs/colorpalette.md, Section 2 — CMYK calculation
describe('Color palette – CMYK', () => {
  it.each([
    [{ r: 30, g: 136, b: 229 }, { c: 87, m: 41, y: 0, k: 10 }],
    [{ r: 0, g: 0, b: 0 }, { c: 0, m: 0, y: 0, k: 100 }],
    [{ r: 255, g: 255, b: 255 }, { c: 0, m: 0, y: 0, k: 0 }],
  ])('converts %o to %o', (rgb, cmyk) => {
    expect(rgbToCmyk(rgb)).toEqual(cmyk);
  });

  it('formats the three values of a color', () => {
    expect(colorValues('#1E88E5')).toEqual({
      hex: '#1E88E5',
      rgb: '30, 136, 229',
      cmyk: '87, 41, 0, 10',
    });
  });
});

// Spec: specs/colorpalette.md, Scenario 1 — One Color by Default
describe('Color palette – defaults', () => {
  it('starts with one empty Black color, no Remove, and a placeholder page', () => {
    renderApp();

    expect(getColorGroups()).toHaveLength(1);
    expect(within(getColorsForm()).getByLabelText('Color 1 name')).toHaveValue('');
    expect(getHex(1)).toHaveValue('#000000');
    expect(within(getColorsForm()).queryByRole('button', { name: /^Remove/ })).not.toBeInTheDocument();
    expect(within(getPalettePage()).getByText('Your color palette')).toBeInTheDocument();
  });
});

// Spec: specs/colorpalette.md, Scenario 2 — Values Follow the Picker
describe('Color palette – values', () => {
  it('shows HEX, RGB and CMYK for the picked color', () => {
    renderApp();

    pickBlue(1);

    const form = within(getColorsForm());
    expect(form.getByText('HEX #1E88E5')).toBeInTheDocument();
    expect(form.getByText('RGB 30, 136, 229')).toBeInTheDocument();
    expect(form.getByText('CMYK ≈ 87, 41, 0, 10')).toBeInTheDocument();
  });

  it('shows — while the HEX is not valid', () => {
    renderApp();

    fireEvent.change(getHex(1), { target: { value: 'blue' } });

    expect(within(getColorsForm()).getByText('HEX —')).toBeInTheDocument();
  });
});

// Spec: specs/colorpalette.md, Scenarios 3 and 4 — Adding and Removing Colors
describe('Color palette – adding and removing', () => {
  it('renumbers the colors after one is removed', () => {
    renderApp();

    clickAddColor();
    clickAddColor();
    fireEvent.click(getHeader(2)); // Color 3 is open; open Color 2 to reach its Remove
    fireEvent.click(within(getColorsForm()).getByRole('button', { name: 'Remove Color 2' }));

    expect(getColorGroups()).toHaveLength(2);
    expect(getHex(1)).toHaveValue('#000000');
    expect(getHex(2)).toHaveValue('#757575');
  });

  it('allows six colors at most', () => {
    renderApp();

    for (let i = 0; i < 5; i++) clickAddColor();

    expect(getColorGroups()).toHaveLength(6);
    expect(within(getColorsForm()).getByRole('button', { name: 'Add color' })).toBeDisabled();
  });
});

// Spec: specs/colorpalette.md, Section 2 — Accordion (Scenarios 9 to 11)
describe('Color palette – accordion', () => {
  function expanded() {
    return getColorGroups().map((_, i) => getHeader(i + 1).getAttribute('aria-expanded'));
  }

  it('starts with Color 1 open', () => {
    renderApp();

    expect(expanded()).toEqual(['true']);
  });

  it('opens a new color and folds the others', () => {
    renderApp();

    clickAddColor();
    clickAddColor();

    expect(expanded()).toEqual(['false', 'false', 'true']);
  });

  it('opens a folded color with a click and folds the open one', () => {
    renderApp();
    clickAddColor();
    clickAddColor();

    fireEvent.click(getHeader(2));

    expect(expanded()).toEqual(['false', 'true', 'false']);
  });

  it('folds every color when the open one is clicked', () => {
    renderApp();

    fireEvent.click(getHeader(1));

    expect(expanded()).toEqual(['false']);
  });

  it('shows the name and HEX of a folded color in its header', () => {
    renderApp();
    typeName(1, 'Primary blue');
    pickBlue(1);

    clickAddColor();

    expect(getHeader(1)).toHaveAttribute('aria-expanded', 'false');
    expect(getHeader(1)).toHaveAccessibleDescription('Primary blue #1E88E5');
  });

  it('opens the first color with an error on Save', () => {
    renderApp();
    typeName(1, 'Primary blue');
    clickAddColor(); // Color 2 has no name
    fireEvent.click(getHeader(1));

    clickSaveColors();

    expect(expanded()).toEqual(['false', 'true']);
    expect(getHeader(2).closest('.palette-block')).toHaveAttribute('data-invalid', 'true');
  });
});

// Spec: specs/colorpalette.md, Scenario 5 — Saving the Palette
describe('Color palette – saving', () => {
  it('shows the saved color with its name and values on the page', () => {
    renderApp();

    typeName(1, 'Primary blue');
    pickBlue(1);
    clickSaveColors();

    const page = within(getPalettePage());
    expect(page.getByText('Primary blue')).toBeInTheDocument();
    expect(page.getByText('#1E88E5')).toBeInTheDocument();
    expect(page.getByText('30, 136, 229')).toBeInTheDocument();
    expect(page.getByText('87, 41, 0, 10')).toBeInTheDocument();
    expect(page.getByText('CMYK values are approximate')).toBeInTheDocument();
  });

  // Spec: specs/colorpalette.md, Scenario 6 — Required Name
  it('blocks Save while a name is empty', () => {
    renderApp();

    clickSaveColors();

    const name = within(getColorsForm()).getByLabelText('Color 1 name');
    expect(within(getColorsForm()).getByRole('alert')).toHaveTextContent('Required field');
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveStyle({ borderColor: 'red' });
    expect(within(getPalettePage()).getByText('Your color palette')).toBeInTheDocument();
  });

  // Spec: specs/colorpalette.md, Scenario 7 — Palette Waits for Save
  it('does not change the page until Save', () => {
    renderApp();
    typeName(1, 'Primary blue');
    clickSaveColors();

    typeName(1, 'Sky');

    expect(within(getPalettePage()).getByText('Primary blue')).toBeInTheDocument();
    expect(within(getPalettePage()).queryByText('Sky')).not.toBeInTheDocument();
  });
});

// Spec: specs/colorpalette.md, Scenario 8 — Palette Is Kept Between Pages
describe('Color palette – navigation', () => {
  it('keeps the saved palette when going Home and back', () => {
    renderApp();
    typeName(1, 'Primary blue');
    clickSaveColors();

    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    fireEvent.click(screen.getByRole('link', { name: 'Brand Manual' }));

    expect(within(getPalettePage()).getByText('Primary blue')).toBeInTheDocument();
  });
});
