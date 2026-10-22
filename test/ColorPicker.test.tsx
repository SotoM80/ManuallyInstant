import { screen, fireEvent, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import {
  clickApply,
  fillRequiredCoverFields,
  getColorGroup,
  getHexInput,
  pickSwatch,
  typeHex,
  typeTitle,
} from './coverForm';
import type { ColorField } from './coverForm';

function getPreview() {
  return screen.getByRole('region', { name: 'Manual preview' });
}

function getPages() {
  return within(getPreview()).getAllByRole('article');
}

function getCover() {
  return within(getPreview()).getByRole('article', { name: 'Cover' });
}

function getCheckedSwatch(field: ColorField) {
  return within(getColorGroup(field))
    .queryAllByRole('radio')
    .find((radio) => (radio as HTMLInputElement).checked);
}

function saveCover() {
  typeTitle('My Brand');
  fillRequiredCoverFields();
  clickApply();
}

// Spec: specs/colorpicker.md, Section 2 — Interface
describe('Color picker – interface', () => {
  it.each([
    ['Title color', '#000000', 'Black'],
    ['Text color', '#000000', 'Black'],
    ['Background color', '#FFFFFF', 'White'],
  ] as const)('%s starts at %s with the %s swatch selected', (field, hex, swatch) => {
    renderApp();

    expect(getHexInput(field)).toHaveValue(hex);
    expect(getCheckedSwatch(field)).toHaveAccessibleName(swatch);
    expect(within(getColorGroup(field)).getAllByRole('radio')).toHaveLength(12);
    expect(within(getColorGroup(field)).getByLabelText(`${field} custom`)).toHaveValue(hex.toLowerCase());
  });
});

// Spec: specs/colorpicker.md, Scenario 1 — Picking a Swatch
describe('Color picker – swatches', () => {
  it('fills the HEX field when a swatch is clicked', () => {
    renderApp();

    pickSwatch('Background color', 'Navy');

    expect(getHexInput('Background color')).toHaveValue('#1A237E');
    expect(getCheckedSwatch('Background color')).toHaveAccessibleName('Navy');
    // The other picker is not touched
    expect(getHexInput('Title color')).toHaveValue('#000000');
  });
});

// Spec: specs/colorpicker.md, Scenario 2 — Any Color by HEX
describe('Color picker – HEX field', () => {
  it.each([
    ['#2b2d42', '#2B2D42'],
    ['2B2D42', '#2B2D42'],
    ['#abc', '#AABBCC'],
  ])('tidies "%s" into "%s" on blur', (typed, expected) => {
    renderApp();

    typeHex('Title color', typed);
    fireEvent.blur(getHexInput('Title color'));

    expect(getHexInput('Title color')).toHaveValue(expected);
    expect(getHexInput('Title color')).toHaveAttribute('aria-invalid', 'false');
  });

  it('selects the matching swatch when its HEX is typed, and none for other colors', () => {
    renderApp();

    typeHex('Title color', '#e53935');
    expect(getCheckedSwatch('Title color')).toHaveAccessibleName('Red');

    typeHex('Title color', '#2B2D42');
    expect(getCheckedSwatch('Title color')).toBeUndefined();
  });

  it('follows the custom (native) picker', () => {
    renderApp();
    const custom = within(getColorGroup('Background color')).getByLabelText('Background color custom');

    fireEvent.change(custom, { target: { value: '#2b2d42' } });

    expect(getHexInput('Background color')).toHaveValue('#2B2D42');
  });
});

// Spec: specs/colorpicker.md, Scenario 3 — Invalid HEX
describe('Color picker – invalid HEX', () => {
  it('shows an error on blur and keeps the last valid color on the pages', () => {
    // Given
    renderApp();
    typeTitle('My Brand');
    fillRequiredCoverFields();
    typeHex('Background color', 'blue');

    // When
    fireEvent.blur(getHexInput('Background color'));

    // Then
    expect(getHexInput('Background color')).toHaveAccessibleDescription(
      'Enter a valid HEX color, like #1E88E5',
    );
    expect(getHexInput('Background color')).toHaveStyle({ borderColor: 'red' });

    for (const page of getPages()) {
      expect(page).toHaveStyle({ background: '#FFFFFF' });
    }
  });

  it('shows no error when the HEX field is emptied', () => {
    renderApp();
    typeTitle('My Brand');
    typeHex('Title color', '');

    fireEvent.blur(getHexInput('Title color'));

    expect(getHexInput('Title color')).toHaveAttribute('aria-invalid', 'false');
  });
});

// Spec: specs/colorpicker.md, Scenario 4 — Colors on the Manual
describe('Color picker – colors on the manual', () => {
  it('paints the title and "Designed by" with their colors and only the Cover with the Background color', () => {
    // Given
    renderApp();
    pickSwatch('Title color', 'White');
    pickSwatch('Text color', 'White');
    typeHex('Background color', '#1a237e');

    // When
    saveCover();

    // Then
    expect(within(getCover()).getByText('My Brand')).toHaveStyle({ color: '#FFFFFF' });
    expect(getCover().querySelector('.cover-layout')).toHaveStyle({ color: '#FFFFFF' });
    expect(getCover()).toHaveStyle({ background: '#1A237E' });
    // The other pages take their colors from the Skin (specs/skins.md, ADR 0011)
    for (const page of getPages().filter((page) => page !== getCover())) {
      expect(page).toHaveStyle({ background: '#FFFFFF' });
    }
  });

  // Spec: specs/colorpicker.md, Scenario 8 — Title and Text Colors Apart
  it('paints the title with the Title color and "Designed by" with the Text color', () => {
    renderApp();
    saveCover();

    pickSwatch('Title color', 'Red');
    pickSwatch('Text color', 'Gray');

    expect(within(getCover()).getByText('My Brand')).toHaveStyle({ color: '#E53935' });
    expect(within(getCover()).getByText(/^Designed by /)).toHaveStyle({ color: '#757575' });

    // Each one only changes its own text
    pickSwatch('Text color', 'Blue');
    expect(within(getCover()).getByText('My Brand')).toHaveStyle({ color: '#E53935' });
    pickSwatch('Title color', 'Green');
    expect(within(getCover()).getByText(/^Designed by /)).toHaveStyle({ color: '#1E88E5' });
  });

  // Spec: specs/colorpicker.md, Scenario 5 — Colors Are Live
  it('changes the Cover as soon as a swatch is picked', () => {
    renderApp();

    pickSwatch('Background color', 'Navy');

    expect(getCover()).toHaveStyle({ background: '#1A237E' });
  });
});
